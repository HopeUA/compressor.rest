import App from 'server/server';
import { Client } from 'ssh2';
import { Transform } from 'stream';

// TODO добавить выбор ноды для компрессии
const services = App.get('services');
const nodeConfig = services.compressorNodes.node;

function isPrompt(line) {
    return /:~# /.test(line);
}

function clearPrompt(line) {
    return line.substring(line.indexOf(':~#') + 4);
}
// ea77f7f2ab45:~# [6n
class NormalizedShellStream extends Transform {
    constructor(command) {
        super();

        this.buffer = '';
        this.commandBuffer = '';
        this.isCommandSent = false;
        this.isCommandOutput = false;
        this.command = command.join(' ');
    }

    _transform(chunk, encoding, done) {
        const self = this;
        const lines = chunk.toString().split(/[\r\n]/);
        const output = [];

        if (lines.length > 1) {
            lines.forEach(function(l, index) {
                if (index === 0) {
                    // First part, append it to the stub and push it
                    output.push(self.buffer + l);
                    self.buffer = '';
                } else if (index === lines.length - 1) {
                    // Last part of the chunk, this will be the new stub and the beginning
                    // of the next chunk (until delimiter) will be appended to this
                    self.buffer = l;
                } else {
                    // This must be a part cleanly separated by the delimiter within the
                    // same chunk, push it
                    output.push(l.trim());
                }
            });
        } else {
            // No delimiter found, append the chunk to the stub
            if (isPrompt(lines[0])) {
                output.push(lines[0]);
            } else {
                this.buffer = this.buffer + lines[0];
            }
        }

        output.forEach((line) => {
            if (isPrompt(line) && !this.isCommandSent) {
                this.isCommandSent = true;
                line = clearPrompt(line);
            }

            if (line.indexOf('[6n') !== -1) {
                return;
            }

            if (isPrompt(line) && this.isCommandSent) {
                self.end();
                return;
            }

            if (this.isCommandSent && !this.isCommandOutput) {
                this.commandBuffer += line;
                if (this.command === this.commandBuffer) {
                    this.isCommandOutput = true;
                }
                return;
            }

            if (this.isCommandOutput && line !== '') {
                self.push(line);
            }
        });

        done();
    }

    _flush(done) {
        this.push(this.buffer);
        done();
    }
}

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

    async getShell() {
        const conn = await this.getConnection();

        return new Promise((resolve, reject) => {
            conn.shell((err, stream) => {
                if (err) {
                    return reject(err);
                }

                return resolve(stream);
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
                .on('close', onEnd)
                .on('data', onData('stdout'))
                .stderr.on('data', onData('stderr'));
        });
    }
}
