import Winston from 'winston';
import Chalk from 'chalk';
import Moment from 'moment';

const Logger = new (Winston.Logger)({
    transports: [
        new (Winston.transports.Console)({
            timestamp: () => {
                return `${Chalk.bold(Moment().format('YYYY-MM-DD'))}`
                    + ` `
                    + `${Chalk.bold(Moment().format('HH:mm:ss'))}`;
            },
            formatter: (options) => {
                let level = `[${options.level.toUpperCase()}]`;
                switch (level) {
                    case '[INFO]':
                        level = Chalk.green(level);
                        break;
                    case '[ERROR]':
                        level = Chalk.red(level);
                        break;
                    default:
                }

                /* eslint-disable prefer-template */
                return `${options.timestamp()} ${level} `
                    + (typeof options.message !== 'undefined' ? options.message : '')
                    + (options.meta && Object.keys(options.meta).length ? `\n\t${JSON.stringify(options.meta)}` : '');
                /* eslint-enable prefer-template */
            }
        })
    ]
});

export default Logger;
