import { logger } from './logger';

interface Metrics {
  totalStories: number;
  activeStories: number;
  totalRounds: number;
  apiCalls: number;
  errors: number;
  lastReset: Date;
}

class MetricsCollector {
  private metrics: Metrics = {
    totalStories: 0,
    activeStories: 0,
    totalRounds: 0,
    apiCalls: 0,
    errors: 0,
    lastReset: new Date()
  };

  incrementStories(): void {
    this.metrics.totalStories++;
    logger.debug('Metrics: Stories incremented', { total: this.metrics.totalStories });
  }

  incrementActiveStories(): void {
    this.metrics.activeStories++;
  }

  decrementActiveStories(): void {
    this.metrics.activeStories = Math.max(0, this.metrics.activeStories - 1);
  }

  incrementRounds(): void {
    this.metrics.totalRounds++;
  }

  incrementApiCalls(): void {
    this.metrics.apiCalls++;
  }

  incrementErrors(): void {
    this.metrics.errors++;
    logger.warn('Metrics: Error count incremented', { total: this.metrics.errors });
  }

  getMetrics(): Metrics {
    return { ...this.metrics };
  }

  reset(): void {
    this.metrics = {
      totalStories: 0,
      activeStories: 0,
      totalRounds: 0,
      apiCalls: 0,
      errors: 0,
      lastReset: new Date()
    };
    logger.info('Metrics reset');
  }

  logSummary(): void {
    const uptime = Date.now() - this.metrics.lastReset.getTime();
    const uptimeHours = Math.round(uptime / (1000 * 60 * 60) * 100) / 100;
    
    logger.info('Application metrics summary', {
      ...this.metrics,
      uptimeHours,
      storiesPerHour: uptimeHours > 0 ? Math.round(this.metrics.totalStories / uptimeHours * 100) / 100 : 0,
      errorRate: this.metrics.apiCalls > 0 ? Math.round(this.metrics.errors / this.metrics.apiCalls * 10000) / 100 : 0
    });
  }
}

export const metrics = new MetricsCollector();

// Log metrics summary every hour
if (process.env['NODE_ENV'] === 'production') {
  setInterval(() => {
    metrics.logSummary();
  }, 60 * 60 * 1000); // 1 hour
}