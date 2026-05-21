// Production initialization - Call this in your root layout or _app.tsx
import { initQueue } from '@/lib/queue';
import logger from '@/lib/logger';

let initialized = false;

export function initializeProduction() {
  if (initialized) return;
  
  logger.info('🚀 Initializing production services...');
  
  try {
    // Initialize job queue
    const { reviewQueue, worker } = initQueue();
    
    logger.info('✅ Queue system initialized');
    logger.info(`📊 Queue: ${reviewQueue.name}`);
    logger.info(`👷 Worker concurrency: 5`);
    
    initialized = true;
  } catch (error) {
    logger.error('❌ Failed to initialize production services:', error);
    throw error;
  }
}
