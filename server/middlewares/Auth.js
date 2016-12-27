import Fetch from 'node-fetch';
import wrap from 'common/utils/wrap';

module.exports = () => {
    return wrap(async (req, res, next) => {
        const App = req.app;
        const User = App.models.User;
        const config = App.get('services');

        const accessToken = req.headers.authorization ? req.headers.authorization.replace('Bearer ', '') : null;

        if (accessToken === null) {
            req.user = getAnonymousUser();
        } else {
            try {
                req.user = await getCurrentUser();
            } catch (error) {
                console.error(error);
                req.user = getAnonymousUser();
            }
        }

        function getAnonymousUser() {
            return new User({
                id: '',
                firstName: "Anonymous",
                email: "guest@hope.ua",
                permissions: {}
            });
        }

        async function getCurrentUser() {
            const apiResponse = await Fetch(`${config.auth.url}/users/self`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });

            if (apiResponse.status !== 200) {
                throw new Error(
                    await apiResponse.text()
                );
            }

            const userData = await apiResponse.json();

            return new User(userData);
        }

        next();
    });
};
