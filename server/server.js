import Loopback from 'loopback';
import Boot from 'loopback-boot';

const App = module.exports = Loopback();

App.start = () => {
    // start the web server
    return App.listen(() => {
        App.emit('started');
        const baseUrl = App.get('url').replace(/\/$/, '');
        console.log('REST API is available at: %s', baseUrl);
    });
};

// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
Boot(App, __dirname, (err) => {
    if (err) {
        throw err;
    }

    // start the server if `$ node server.js`
    if (require.main === module) {
        App.start();
    }
});
