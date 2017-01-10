import App from 'server/server';
import Worker from 'common/utils/worker';
import { jobStatus } from 'common/utils/worker';

const Job = App.models.Job;

function getJobs() {
    return Job.find({
        where: {
            or: [
                { status: jobStatus.new },
                { status: jobStatus.error }
            ],
            published: true,
            failCount: {
                lt: 5
            }
        },
        order: [
            'priority DESC',
            'created ASC'
        ],
        limit: 5
    });
}

async function processJobs() {
    const jobs = await getJobs();

    if (jobs.length === 0) {
        return next(false);
    }

    for (const job of jobs) {
        await Worker(job);
    }

    return next();
}

function next(hasJobsInQueue = true) {
    const timeout = hasJobsInQueue ? 500 : 3000;
    setTimeout(processJobs, timeout);
}

next();
