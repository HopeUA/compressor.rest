import App from 'server/server';
import Logger from 'common/utils/logger';
import * as StateHandlers from 'common/states';

export const jobStatus = {
    new: 'new',
    in_progress: 'in_progress',
    error: 'error',
    done: 'done'
};

const service = App.get('service');

export default async (job) => {
    let jobError = false;

    // Блокируем задачу
    job.status = jobStatus.in_progress;
    await job.save();

    // Перебираем этапы процесса
    for (const phase of service.worker.phases) {
        let state = job.states$.findById(phase.toLowerCase());
        if (!state) {
            state = await job.states$.create({
                name: phase.toLowerCase()
            });
        }

        if (state.progress === 100) {
            continue;
        }

        try {
            const options = {
                jobId: job.id,
                rootPath: service.rootPath,
                accessToken: service.user.accessToken
            };
            const handler = new StateHandlers[phase](state, job.data, options);

            Logger.info(`${phase}: Init`);
            await state.addEvent('init_start');
            await handler.init(state);
            await state.addEvent('init_end');

            Logger.info(`${phase}: Process`);
            await state.addEvent('process_start');
            await handler.process(state);
            await state.addEvent('process_end');

            Logger.info(`${phase}: Finish`);
            await state.addEvent('finish_start');
            await handler.finish(state);
            await state.addEvent('finish_end');

            Logger.info(`${phase}: Done`);
            state.finish();
        } catch (error) {
            Logger.error(`${phase}: ${error.stack}`);
            state.error(error.message);
            jobError = true;
            break;
        }
    }

    // Сохраняем результат
    job.status = jobError ? jobStatus.error : jobStatus.done;
    if (jobError) {
        job.failCount++;
    }
    await job.save();
};
