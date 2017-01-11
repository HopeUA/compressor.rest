import HttpHeaders from 'http-headers';
import Path from 'path';

import Handler from './handler';
import SSH from 'common/utils/ssh';

export class Put extends Handler {
    /**
     * Check if input file exists
     */
    async init() {
        const conn = new SSH();

        const outputFileSize = await new Promise((resolve, reject) => {
            let result;
            const command = [
                'stat',
                this.outputFilePath()
            ];

            const onData = (stream) => (data) => {
                console.log(`${stream}: ${data}`);

                const match = /Size: (\d+)/.exec(data);
                if (match) {
                    result = parseInt(match[1], 10);
                }
            };
            const onEnd = () => {
                resolve(result);
            };
            conn.exec(command, onData, onEnd);
        });

        if (outputFileSize === 0) {
            throw new Error('File is empty');
        }

        this.store.size = outputFileSize;
    }

    /**
     * Download input file to input dir
     */
    async process() {
        const conn = new SSH();
        const startTime = new Date();

        const response = await new Promise((resolve, reject) => {
            let response = '';

            const command = [
                'curl',
                '--include',
                '--progress-bar',
                `--header "Authorization: Bearer ${this.options.accessToken}"`,
                `--data-binary "@${this.outputFilePath()}"`,
                this.data.output
            ];

            // curl посылает данные о прогрессе в stderr
            const onData = (stream) => (data) => {
                console.log(`${stream}: ${data}`);

                if (stream === 'stderr') {
                    const reg = /(\d+)\.\d%/gm;
                    let lastMatch;
                    let match;
                    while (match = reg.exec(data)) {
                        lastMatch = match;
                    }
                    if (lastMatch) {
                        const progress = parseInt(lastMatch[1], 10);
                        this.state.setProgress(progress);
                    }
                }

                if (stream === 'stdout') {
                    response += data.toString().replace('HTTP/1.1 100 Continue', '');
                }
            };
            const onEnd = () => {
                return resolve(HttpHeaders(response));
            };
            conn.exec(command, onData, onEnd);
        });

        if (response.statusCode !== 201) {
            throw new Error('File status: ' + response.statusCode);
        }

        const endTime = new Date();
        this.store.duration = endTime.getTime() - startTime.getTime();
    }

    /**
     * Check if file size is ok
     */
    async finish() {
        const conn = new SSH();

        const response = await new Promise((resolve, reject) => {
            let response = '';
            const command = [
                'curl',
                '--head',
                `--header "Authorization: Bearer ${this.options.accessToken}"`,
                this.data.output
            ];
            const onData = (stream) => (data) => {
                console.log(`${stream}: ${data}`);

                if (stream === 'stdout') {
                    response += data;
                }
            };
            const onEnd = () => {
                if (response.indexOf('HTTP/1.1') !== -1) {
                    return resolve(HttpHeaders(response));
                } else {
                    return reject(response);
                }
            };
            conn.exec(command, onData, onEnd);
        });

        if (response.statusCode !== 200) {
            throw new Error('File HEAD status: ' + response.statusCode);
        }

        const outputFileSize = parseInt(response.headers['content-length'], 10);

        if (outputFileSize === 0) {
            throw new Error('File is empty');
        }
        if (outputFileSize !== this.store.size) {
            throw new Error(`Incomplete upload. Local size: ${this.store.size}, server size: ${outputFileSize}`);
        }

        // Save stats
        this.state.stats = {
            speed: parseInt(this.store.size / this.store.duration * 1000, 10)
        };

        this.state.finish();
    }

    outputFilePath() {
        const file = Path.parse(this.data.output);

        return `${this.options.rootPath}/output/${file.name}-${this.options.jobId}${file.ext}`;
    }
}
