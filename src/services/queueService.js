const { Queue, Worker } = require('bullmq');
const Redis = require('ioredis');
const matchingService = require('./matchingService');

// Redis Connection
const connection = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    maxRetriesPerRequest: null,
});

connection.on('connect', () => {
    console.log('✅ Redis connected successfully');
});

connection.on('error', (err) => {
    console.error('❌ Redis connection error:', err.message);
});

const MATCH_QUEUE_NAME = 'RideMatchingQueue';

// Queue Producer
const matchQueue = new Queue(MATCH_QUEUE_NAME, { connection });

// Queue Consumer (Worker)
const matchWorker = new Worker(MATCH_QUEUE_NAME, async (job) => {
    const { requestId } = job.data;
    console.log(`Worker processing match for request: ${requestId}`);
    try {
        const result = await matchingService.matchRequest(requestId);
        if (result) {
            console.log(`Match success for ${requestId}:`, result);
        } else {
            console.log(`No match found for ${requestId} yet.`);
            // Retry logic or leave pending?
            // Could re-queue with delay if not matched immediately?
        }
    } catch (err) {
        console.error(`Error processing job ${job.id}:`, err);
        throw err;
    }
}, { connection });

console.log('🚀 Ride matching worker initialized');

matchWorker.on('completed', job => {
    console.log(`${job.id} has completed!`);
});

matchWorker.on('failed', (job, err) => {
    console.log(`${job.id} has failed with ${err.message}`);
});

matchWorker.on('error', (err) => {
    console.error('Worker error:', err);
});

module.exports = {
    addMatchJob: async (requestId) => {
        await matchQueue.add('match-ride', { requestId }, {
            removeOnComplete: true,
            removeOnFail: 100 // Keep last 100 failed jobs
        });
    }
};
