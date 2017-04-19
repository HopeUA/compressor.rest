import Prepare from 'common/utils/prepareModel';
import Acl from 'common/utils/acl';

module.exports = (Settings) => {
    Prepare(Settings);

    Settings.toPublic = (settings) => {
        settings.id = undefined;

        return settings;
    };

    /**
     * GET /settings
     * Access: app:admin
     */
    Settings.remoteMethod('getAll', {
        http: { verb: 'get', path: '/' },
        returns: {
            arg: 'data',
            type: 'Settings',
            root: true
        }
    });
    Settings.beforeRemote('getAll', async (ctx) => {
        if (!Acl.isGranted(ctx.req.user, 'app:admin')) {
            const error = new Error('Access denied');
            error.statusCode = 401;
            throw error;
        }
    });
    Settings.getAll = async () => {
        return await Settings.findOne();
    };
    Settings.afterRemote('getAll', async (ctx, settings) => {
        ctx.result = Settings.toPublic(settings);
        ctx.res.statusCode = 200;
    });

    /**
     * PUT /settings/{key}
     * Access: app:admin
     */
    Settings.remoteMethod('updateSome', {
        http: { verb: 'put', path: '/' },
        accepts: {
            arg: 'data',
            type: 'object',
            http: { source: 'body' }
        },
        returns: {
            arg: 'data',
            type: 'Settings',
            root: true
        }
    });
    Settings.beforeRemote('updateSome', async (ctx) => {
        if (!Acl.isGranted(ctx.req.user, 'app:admin')) {
            const error = new Error('Access denied');
            error.statusCode = 401;
            throw error;
        }
    });
    Settings.updateSome = async (data) => {
        let settings = await Settings.findOne();

        if (settings === null) {
            settings = new Settings(data);
            await Settings.create(settings);
        } else {
            await settings.updateAttributes(data);
        }

        return settings;
    };
    Settings.afterRemote('updateSome', async (ctx, settings) => {
        ctx.result = Settings.toPublic(settings);
        ctx.res.statusCode = 200;
    });

    // Settings.sharedClass.methods().forEach((m) => {
    //     console.log(m.name, m.isStatic);
    // });
};
