import App from 'server/server';
import Worker from 'common/utils/worker';
import { jobStatus } from 'common/utils/worker';

const Job = App.models.Job;
const jobId = process.argv[2] || null;

(async () => {
    const job = await Job.findById(jobId);
    if (!job) {
        throw new Error('Job not found');
    }
    await Worker(job);
})()
    .then(() => {
        process.exit(0);
    })
    .catch((error) => {
    console.log(error);
    process.exit(1);
});
