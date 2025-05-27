/**
 * Performance Monitoring and Optimization System
 * GEB-9: Performance Optimization: Response Time and Resource Management
 */

export interface PerformanceMetrics {
  operationName: string;
  startTime: number;
  endTime: number;
  duration: number;
  success: boolean;
  errorMessage?: string;
  memoryUsage?: NodeJS.MemoryUsage;
  metadata?: Record<string, any>;
}

export interface PerformanceThresholds {
  [operationName: string]: {
    warning: number;  // milliseconds
    critical: number; // milliseconds
  };
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics[] = [];
  private thresholds: PerformanceThresholds;
  private maxMetrics: number = 1000; // Keep last 1000 metrics

  // PRD requirements: <2 second response time
  private defaultThresholds: PerformanceThresholds = {
    'geogebra_eval_command': { warning: 1000, critical: 2000 },
    'geogebra_create_point': { warning: 500, critical: 1000 },
    'geogebra_create_line': { warning: 500, critical: 1000 },
    'geogebra_export_png': { warning: 1500, critical: 2000 },
    'geogebra_export_svg': { warning: 800, critical: 1500 },
    'geogebra_instance_init': { warning: 8000, critical: 15000 },
    'geogebra_clear_construction': { warning: 300, critical: 1000 },
    'default': { warning: 1000, critical: 2000 }
  };

  private constructor() {
    this.thresholds = { ...this.defaultThresholds };
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Start timing an operation
   */
  startTiming(operationName: string, metadata?: Record<string, any>): (success?: boolean, errorMessage?: string) => PerformanceMetrics {
    const startTime = performance.now();
    const startMemory = process.memoryUsage();

    return (success: boolean = true, errorMessage?: string) => {
      const endTime = performance.now();
      const endMemory = process.memoryUsage();
      const duration = endTime - startTime;

      const metric: PerformanceMetrics = {
        operationName,
        startTime,
        endTime,
        duration,
        success,
        ...(errorMessage && { errorMessage }),
        memoryUsage: {
          rss: endMemory.rss - startMemory.rss,
          heapTotal: endMemory.heapTotal - startMemory.heapTotal,
          heapUsed: endMemory.heapUsed - startMemory.heapUsed,
          external: endMemory.external - startMemory.external,
          arrayBuffers: endMemory.arrayBuffers - startMemory.arrayBuffers
        },
        ...(metadata && { metadata })
      };

      this.addMetric(metric);
      this.checkThresholds(metric);
      return metric;
    };
  }

  /**
   * Measure and record an async operation
   */
  async measureOperation<T>(
    operationName: string,
    operation: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const endTiming = this.startTiming(operationName, metadata);
    
    try {
      const result = await operation();
      endTiming(true);
      return result;
    } catch (error) {
      endTiming(false, error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Add a metric to the collection
   */
  private addMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric);
    
    // Keep only the last maxMetrics entries
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  /**
   * Check if metric exceeds thresholds and log warnings
   */
  private checkThresholds(metric: PerformanceMetrics): void {
    const threshold = this.thresholds[metric.operationName] || this.thresholds['default'];
    
    if (threshold && metric.duration > threshold.critical) {
      console.error(`🚨 CRITICAL: ${metric.operationName} took ${metric.duration.toFixed(2)}ms (threshold: ${threshold.critical}ms)`);
    } else if (threshold && metric.duration > threshold.warning) {
      console.warn(`⚠️  WARNING: ${metric.operationName} took ${metric.duration.toFixed(2)}ms (threshold: ${threshold.warning}ms)`);
    }
  }

  /**
   * Get performance statistics for an operation
   */
  getStats(operationName?: string): {
    count: number;
    averageDuration: number;
    medianDuration: number;
    minDuration: number;
    maxDuration: number;
    successRate: number;
    p95Duration: number;
    p99Duration: number;
  } {
    const relevantMetrics = operationName 
      ? this.metrics.filter(m => m.operationName === operationName)
      : this.metrics;

    if (relevantMetrics.length === 0) {
      return {
        count: 0,
        averageDuration: 0,
        medianDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        successRate: 0,
        p95Duration: 0,
        p99Duration: 0
      };
    }

    const durations = relevantMetrics.map(m => m.duration).sort((a, b) => a - b);
    const successCount = relevantMetrics.filter(m => m.success).length;

    return {
      count: relevantMetrics.length,
      averageDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      medianDuration: durations[Math.floor(durations.length / 2)] || 0,
      minDuration: durations[0] || 0,
      maxDuration: durations[durations.length - 1] || 0,
      successRate: successCount / relevantMetrics.length,
      p95Duration: durations[Math.floor(durations.length * 0.95)] || 0,
      p99Duration: durations[Math.floor(durations.length * 0.99)] || 0
    };
  }

  /**
   * Get all operation names with metrics
   */
  getOperationNames(): string[] {
    return [...new Set(this.metrics.map(m => m.operationName))];
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  /**
   * Set custom thresholds
   */
  setThresholds(thresholds: Partial<PerformanceThresholds>): void {
    Object.assign(this.thresholds, thresholds);
  }
}

// Global instance
export const performanceMonitor = PerformanceMonitor.getInstance(); 