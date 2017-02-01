export default function (Model, options = {}) {
    Model.disableRemoteMethodByName('create');
    Model.disableRemoteMethodByName('upsert');
    Model.disableRemoteMethodByName('updateAll');
    Model.disableRemoteMethodByName('updateAttributes');
    Model.disableRemoteMethodByName('createChangeStream');

    Model.disableRemoteMethodByName('find');
    Model.disableRemoteMethodByName('findById');
    Model.disableRemoteMethodByName('findOne');
    Model.disableRemoteMethodByName('count');
    Model.disableRemoteMethodByName('exists');

    // Relations
    try {
        Object.keys(Model.definition.settings.relations).forEach(function(relation) {
            Model.disableRemoteMethodByName(`prototype.__findById__${relation}`);
            Model.disableRemoteMethodByName(`prototype.__destroyById__${relation}`);
            Model.disableRemoteMethodByName(`prototype.__updateById__${relation}`);
            Model.disableRemoteMethodByName(`prototype.__exists__${relation}`);
            Model.disableRemoteMethodByName(`prototype.__link__${relation}`);
            Model.disableRemoteMethodByName(`prototype.__get__${relation}`);
            Model.disableRemoteMethodByName(`prototype.__create__${relation}`);
            Model.disableRemoteMethodByName(`prototype.__update__${relation}`);
            Model.disableRemoteMethodByName(`prototype.__destroy__${relation}`);
            Model.disableRemoteMethodByName(`prototype.__unlink__${relation}`);
            Model.disableRemoteMethodByName(`prototype.__count__${relation}`);
            Model.disableRemoteMethodByName(`prototype.__delete__${relation}`);
        });
    } catch(error) {}

    if (options.clean) {
        Model.disableRemoteMethodByName('deleteById');

        return;
    }

    /**
     * GET /model/{id}
     */
    Model.remoteMethod('getOne', {
        http: { verb: 'get', path: '/:id' },
        accepts: [
            { arg: 'id', type: 'String' }
        ],
        returns: { type: 'Object', root: true }
    });
    Model.getOne = async (id) => {
        const result = await Model.findById(id);

        if (result === null) {
            const error = new Error('Not found');
            error.statusCode = 404;
            throw error;
        }

        return result;
    };
}
