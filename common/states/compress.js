import Path from 'path';

import Handler from './handler';
import SSH from 'common/utils/ssh';

function escapeQuotes(str) {
    return str.replace(/\x22/g, '\\\x22');
}

export class Compress extends Handler {
    async init() {
        const conn = new SSH();

        await new Promise((resolve, reject) => {
            const command = [
                'rm',
                '-f',
                this.outputFilePath()
            ];

            const onData = (stream) => (data) => {
                console.log(`${stream}: ${data}`);
            };
            const onEnd = () => {
                resolve();
            };
            conn.exec(command, onData, onEnd);
        });
    }

    /**
     * Download input file to input dir
     */
    async process() {
        const conn = new SSH();

        let speed = 0;
        await new Promise((resolve, reject) => {
            const date = new Date();
            const meta = this.data.meta || {};

            // Presets – 16/9->Stream и 4/3->Stream
            const command = [
                'ffmpeg',
                `-i ${this.inputFilePath()}`,
                '-map_metadata:g -1',
                `-metadata:g creation_time="${date.toISOString()}"`,
                `-metadata:g show="${escapeQuotes(meta.show)}"`,
                `-metadata:g episode_id="${meta.episode}"`,
                `-metadata:g title="${escapeQuotes(meta.title)}"`,
                '-codec:v libx264',
                '-b:v 3M',
                '-r:v 25',
                this.data.preset === '4/3->Stream' ? '-filter:v scale=896:672,crop=896:576,pad=1024:576:64:0,scale=720:576,setdar=16/9,yadif=0:-1:1' : '-filter:v scale=720x576,setdar=16/9,yadif=0:-1:1',
                '-pix_fmt:v yuv420p',
                '-profile:v baseline',
                '-level 3.0',
                '-preset medium',
                '-movflags +faststart',
                '-codec:a aac',
                '-b:a 256k',
                this.data.preset === '4/3->Stream' ? '-filter:a volume=-1dB' : '-filter:a "volume=-1dB,adelay=120|120"',
                '-ar 48000',
                '-threads 24',
                this.outputFilePath()
            ];
            const regSpeed = /speed=(\d+\.\d+)x/m;

            const onData = (stream) => (data) => {
                console.log(`${stream}: ${data}`);

                if (stream === 'stderr') {
                    const match = regSpeed.exec(data);
                    if (match !== null) {
                        speed = parseFloat(match[1]);
                    }
                }
            };
            const onEnd = () => {
                resolve();
            };
            conn.exec(command, onData, onEnd);
        });

        this.store.speed = speed;
    }

    async finish() {
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
            throw new Error('Compression error. File is empty');
        }

        // Save stats
        this.state.stats = {
            speed: this.store.speed
        };
        this.state.finish();
    }

    inputFilePath() {
        const file = Path.parse(this.data.input);

        return `${this.options.rootPath}/input/${file.name}-${this.options.jobId}${file.ext}`;
    }
    outputFilePath() {
        const file = Path.parse(this.data.output);

        return `${this.options.rootPath}/output/${file.name}-${this.options.jobId}${file.ext}`;
    }
}
