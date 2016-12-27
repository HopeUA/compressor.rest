import App from 'server/server';

export default class Acl {
    static isGranted(user, policy, resource = null) {
        // Get permissions for current service
        const service = App.get('service');
        if (!(user.permissions[service.group] && user.permissions[service.group][service.name])) {
            return false;
        }
        const permissions = user.permissions[service.group][service.name];

        // Check current
        if (!permissions[policy]) {
            return false;
        }
        const permission = permissions[policy];

        return !!permission;
    }
}
