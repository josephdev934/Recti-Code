import { Queue, Worker, Job } from 'bullmq';
import { getRedisClient } from './redis';
import { analyzeCode } from './gemini';
import logger from './logger';

export interface ReviewJob {
  submissionId: string;
  code: string;
  language: string;
}

const QUEUE_NAME = 'ai-code-review';

let reviewQueue: Queue<ReviewJob>;
let worker: Worker<ReviewJob>;

export function initQueue() {
  const connection = getRedisClient();
  
  reviewQueue = new Queue<ReviewJob>(QUEUE_NAME, {
    connection: connection as any,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000, // 5 seconds
      },
      removeOnComplete: 100,
      removeOnFail: 1000,
    },
  });

  worker = new Worker<ReviewJob>(
    QUEUE_NAME,
    async (job) => {
      logger.info(`📝 Processing job ${job.id} for submission ${job.data.submissionId}`);
      
      try {
        // Perform AI analysis
        const aiReview = await analyzeCode(job.data.code, job.data.language);
        
        logger.info(`✅ Job ${job.id} completed successfully`);
        
        return {
          success: true,
          review: aiReview,
        };
      } catch (error) {
        logger.error(`❌ Job ${job.id} failed:`, error);
        throw error;
      }
    },
    {
      connection: connection as any,
      concurrency: 5, // Process 5 jobs concurrently
    }
  );

  worker.on('completed', (job) => {
    logger.info(`Job ${job.id} completed`);
  });

  worker.on('failed', (job, error) => {
    logger.error(`Job ${job?.id} failed:`, error);
  });

  return { reviewQueue, worker };
}

export function getQueue(): Queue<ReviewJob> {
  if (!reviewQueue) {
    throw new Error('Queue not initialized. Call initQueue() first.');
  }
  return reviewQueue;
}

export async function addReviewJob(jobData: ReviewJob): Promise<Job<ReviewJob>> {
  const queue = getQueue();
  return await queue.add('review', jobData, {
    jobId: jobData.submissionId,
  });
}

export async function getJobStatus(jobId: string): Promise<string | undefined> {
  const queue = getQueue();
  const job = await queue.getJob(jobId);
  
  if (!job) {
    return undefined;
  }
  
  return await job.getState();
}
