import ShortId from 'shortid';
import Promise from 'bluebird';

import Prepare from 'common/utils/prepareModel';
import Acl from 'common/utils/acl';
import { jobStatus } from 'common/utils/worker';

module.exports = (Job) => {
    Prepare(Job);

    Job.toPublic = (job) => {
        return job;
    };

    /**
     * POST /jobs
     * Access: jobs.write
     */
    Job.remoteMethod('createOne', {
        http: { verb: 'post', path: '/' },
        accepts: {
            arg: 'data',
            type: 'object',
            http: { source: 'body' }
        },
        returns: {
            arg: 'data',
            type: 'Job',
            root: true
        }
    });
    Job.beforeRemote('createOne', async (ctx) => {
        if (!Acl.isGranted(ctx.req.user, 'jobs:write')) {
            const error = new Error('Access denied');
            error.statusCode = 401;
            throw error;
        }
    });
    Job.createOne = async (data) => {
        // TODO Валидация данных
        const job = new Job(data);
        job.id      = ShortId.generate();
        job.status  = jobStatus.new;
        job.created = new Date();
        job.failCount = 0;

        await Job.create(job);

        return job;
    };
    Job.afterRemote('createOne', async (ctx, job) => {
        ctx.result = Job.toPublic(job);
        ctx.res.statusCode = 201;
    });

    /**
     * GET /jobs
     * Access: jobs.read
     */
    Job.remoteMethod('getAll', {
        http: { verb: 'get', path: '/' },
        accepts: [
            { arg: 'limit', type: 'number' },
            { arg: 'offset', type: 'number' },
            { arg: 'status', type: 'string' },
            { arg: 'uid', type: 'string' }
        ],
        returns: { type: 'Object', root: true }
    });
    Job.beforeRemote('getAll', async (ctx) => {
        if (!Acl.isGranted(ctx.req.user, 'jobs:read')) {
            const error = new Error('Access denied');
            error.statusCode = 401;
            throw error;
        }

        /**
         * Arguments validation
         */
        // Limit
        let limit = ctx.args.limit;
        if (!limit || limit <= 0) {
            limit = 10;
        }
        if (limit > 100) {
            limit = 100;
        }
        ctx.args.limit = limit;

        // Offset
        let offset = ctx.args.offset;
        if (!offset || offset < 0) {
            offset = 0;
        }
        ctx.args.offset = offset;
    });
    Job.getAll = async (limit, offset, status, uid) => {
        const where = {};
        if (status) {
            where.status = status;
        }
        if (uid) {
            where.uid = uid;
        }

        const results =  await Promise.all([
            Job.find({
                where,
                limit,
                skip: offset,
                order: 'created DESC'
            }),
            Job.count(where)
        ]);

        return {
            jobs: results[0],
            meta: {
                limit,
                offset,
                total: results[1]
            }
        };
    };
    Job.afterRemote('getAll', async (ctx) => {
        if (ctx.result && Array.isArray(ctx.result.jobs)) {
            ctx.result.jobs.forEach(Job.toPublic);

            if (ctx.result.jobs.length === 0) {
                ctx.res.statusCode = 404;
            }
        }
    });
};
