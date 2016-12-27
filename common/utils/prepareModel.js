export default function (Model, options = {}) {
    Model.disableRemoteMethod('create', true);
    Model.disableRemoteMethod('upsert', true);
    Model.disableRemoteMethod('updateAll', true);
    Model.disableRemoteMethod('updateAttributes', false);
    Model.disableRemoteMethod('createChangeStream', true);

    Model.disableRemoteMethod('find', true);
    Model.disableRemoteMethod('findById', true);
    Model.disableRemoteMethod('findOne', true);
    Model.disableRemoteMethod('count', true);
    Model.disableRemoteMethod('exists', true);

    // Relations
    try {
        Object.keys(Model.definition.settings.relations).forEach(function(relation) {
            Model.disableRemoteMethod(`__findById__${relation}`, false);
            Model.disableRemoteMethod(`__destroyById__${relation}`, false);
            Model.disableRemoteMethod(`__updateById__${relation}`, false);
            Model.disableRemoteMethod(`__exists__${relation}`, false);
            Model.disableRemoteMethod(`__link__${relation}`, false);
            Model.disableRemoteMethod(`__get__${relation}`, false);
            Model.disableRemoteMethod(`__create__${relation}`, false);
            Model.disableRemoteMethod(`__update__${relation}`, false);
            Model.disableRemoteMethod(`__destroy__${relation}`, false);
            Model.disableRemoteMethod(`__unlink__${relation}`, false);
            Model.disableRemoteMethod(`__count__${relation}`, false);
            Model.disableRemoteMethod(`__delete__${relation}`, false);
        });
    } catch(error) {}

    if (options.clean) {
        // Model.disableRemoteMethod('create', true);
        Model.disableRemoteMethod('deleteById', true);

        return;
    }

    /**
     * TODO
     * GET /model
     */

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
