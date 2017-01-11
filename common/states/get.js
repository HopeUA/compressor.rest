import HttpHeaders from 'http-headers';
import Path from 'path';

import Handler from './handler';
import SSH from 'common/utils/ssh';

export class Get extends Handler {
    /**
     * Check if input file exists
     */
    async init() {
        const conn = new SSH();

        const response = await new Promise((resolve, reject) => {
            let response = '';
            const command = [
                'curl',
                '--head',
                `--header "Authorization: Bearer ${this.options.accessToken}"`,
                this.data.input
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

        const size = parseInt(response.headers['content-length'], 10);
        if (size === 0) {
            throw new Error('File is empty');
        }

        this.store.size = size;
    }

    /**
     * Download input file to input dir
     */
    async process() {
        const conn = new SSH();
        const startTime = new Date();

        await new Promise((resolve, reject) => {
            const command = [
                'curl',
                '--progress-bar',
                `--output ${this.inputFilePath()}`,
                `--header "Authorization: Bearer ${this.options.accessToken}"`,
                this.data.input
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
            };
            const onEnd = () => {
                resolve();
            };
            conn.exec(command, onData, onEnd);
        });
        const endTime = new Date();

        this.store.duration = endTime.getTime() - startTime.getTime();
    }

    /**
     * Check if file size is ok
     */
    async finish() {
        const conn = new SSH();

        const inputFileSize = await new Promise((resolve, reject) => {
            let result;
            const command = [
                'stat',
                this.inputFilePath()
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

        if (inputFileSize === 0) {
            throw new Error(`Broken download`);
        }

        if (inputFileSize !== this.store.size) {
            throw new Error(`Incomplete download. Size on server: ${this.store.size}, local size: ${inputFileSize}`);
        }

        // Save stats
        this.state.stats = {
            speed: parseInt(this.store.size / this.store.duration * 1000, 10)
        };

        this.state.finish();
    }

    inputFilePath() {
        const inputFile = Path.parse(this.data.input);

        return `${this.options.rootPath}/input/${inputFile.name}-${this.options.jobId}${inputFile.ext}`;
    }
}
