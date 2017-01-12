import App from 'server/server';
import { Client } from 'ssh2';

// TODO добавить выбор ноды для компрессии
const services = App.get('services');
const nodeConfig = services.compressorNodes.node;

export default class SSH {
    constructor() {
        this.connection = null;
    }

    getConnection() {
        if (this.connection) {
            return Promise.resolve(this.connection);
        }

        return new Promise((resolve) => {
            const conn = new Client();
            conn.connect({
                ...nodeConfig
            });

            conn.on('ready', () => {
                this.connection = conn;

                return resolve(conn);
            });
        });
    }

    async exec (command, onData, onEnd) {
        const conn = await this.getConnection();

        console.log(`SSH command exec: ${command.join(' ')}`);

        conn.exec(command.join(' '), (err, stream) => {
            if (err) {
                throw err;
            }

            stream
                .on('close', () => {
                    this.close();

                    return onEnd();
                })
                .on('data', onData('stdout'))
                .stderr.on('data', onData('stderr'));
        });
    }

    close() {
        this.connection.end();
        this.connection = null;
    }
}
