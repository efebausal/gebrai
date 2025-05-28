/**
 * Optimized GeoGebra Instance Pool Management
 * GEB-9: Performance Optimization: Response Time and Resource Management
 */

import { GeoGebraInstance } from '../geogebra-instance';
import { GeoGebraPoolConfig } from '../../types/geogebra';
import logger from '../logger';
import { performanceMonitor } from './index';

// Check if we're in MCP mode (stdio communication)
// When piping input, process.stdin.isTTY is undefined, not false
const isMcpMode = !process.stdin.isTTY;

export interface PooledInstance {
  instance: GeoGebraInstance;
  isActive: boolean;
  lastUsed: Date;
  createdAt: Date;
  usageCount: number;
}

export class OptimizedInstancePool {
  private static poolInstance: OptimizedInstancePool;
  private instances: Map<string, PooledInstance> = new Map();
  private config: GeoGebraPoolConfig;
  private cleanupInterval?: NodeJS.Timeout | undefined;

  private defaultConfig: GeoGebraPoolConfig = {
    maxInstances: 3,        // Maximum concurrent instances
    instanceTimeout: 300000, // 5 minutes
    maxIdleTime: 600000,    // 10 minutes
    headless: true,
    browserArgs: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--memory-pressure-off',  // Reduce memory pressure
      '--max_old_space_size=512' // Limit memory usage
    ]
  };

  private constructor(config?: Partial<GeoGebraPoolConfig>) {
    this.config = { ...this.defaultConfig, ...config };
    this.startCleanupTimer();
    
    // Cleanup on process exit
    process.on('SIGINT', () => this.cleanup());
    process.on('SIGTERM', () => this.cleanup());
    process.on('exit', () => this.cleanup());
    
    if (!isMcpMode) {
      logger.info('Optimized Instance Pool initialized', { config: this.config });
    }
  }

  static getInstance(config?: Partial<GeoGebraPoolConfig>): OptimizedInstancePool {
    if (!OptimizedInstancePool.poolInstance) {
      OptimizedInstancePool.poolInstance = new OptimizedInstancePool(config);
    }
    return OptimizedInstancePool.poolInstance;
  }

  /**
   * Get an available instance from the pool
   */
  async getInstance(): Promise<GeoGebraInstance> {
    return performanceMonitor.measureOperation('instance_pool_get', async () => {
      // Try to find an available instance
      let availableInstance = this.findAvailableInstance();
      
      if (!availableInstance) {
        // Create new instance if under limit
        if (this.instances.size < this.config.maxInstances) {
          availableInstance = await this.createNewInstance();
        } else {
          // Wait for an instance to become available or force cleanup
          await this.forceCleanupOldest();
          availableInstance = await this.createNewInstance();
        }
      }

      // Mark as active and update usage stats
      const pooled = this.instances.get(availableInstance.id)!;
      pooled.isActive = true;
      pooled.lastUsed = new Date();
      pooled.usageCount++;

      logger.debug(`Instance ${availableInstance.id} acquired from pool`, {
        totalInstances: this.instances.size,
        activeInstances: this.getActiveCount(),
        usageCount: pooled.usageCount
      });

      return availableInstance;
    });
  }

  /**
   * Release an instance back to the pool
   */
  async releaseInstance(instance: GeoGebraInstance): Promise<void> {
    return performanceMonitor.measureOperation('instance_pool_release', async () => {
      const pooled = this.instances.get(instance.id);
      if (pooled) {
        pooled.isActive = false;
        pooled.lastUsed = new Date();
        
        // Clear construction to reset state for next use
        try {
          await instance.newConstruction();
        } catch (error) {
          logger.warn(`Failed to clear construction on release: ${error}`);
        }

        logger.debug(`Instance ${instance.id} released to pool`, {
          totalInstances: this.instances.size,
          activeInstances: this.getActiveCount()
        });
      }
    });
  }

  /**
   * Find an available (non-active) instance
   */
  private findAvailableInstance(): GeoGebraInstance | null {
    for (const [, pooled] of this.instances) {
      if (!pooled.isActive) {
        return pooled.instance;
      }
    }
    return null;
  }

  /**
   * Create a new instance and add to pool
   */
  private async createNewInstance(): Promise<GeoGebraInstance> {
    return performanceMonitor.measureOperation('instance_pool_create', async () => {
      const instance = new GeoGebraInstance({
        appName: 'classic',
        width: 800,
        height: 600,
        showMenuBar: false,
        showToolBar: false,
        showAlgebraInput: false
      });

      await instance.initialize(this.config.headless, this.config.browserArgs);
      
      const pooled: PooledInstance = {
        instance,
        isActive: false,
        lastUsed: new Date(),
        createdAt: new Date(),
        usageCount: 0
      };

      this.instances.set(instance.id, pooled);
      
      logger.info(`New instance ${instance.id} created and added to pool`, {
        totalInstances: this.instances.size
      });

      return instance;
    });
  }

  /**
   * Force cleanup of the oldest instance to make room
   */
  private async forceCleanupOldest(): Promise<void> {
    let oldestId: string | null = null;
    let oldestTime = Date.now();

    // Find oldest inactive instance
    for (const [id, pooled] of this.instances) {
      if (!pooled.isActive && pooled.lastUsed.getTime() < oldestTime) {
        oldestTime = pooled.lastUsed.getTime();
        oldestId = id;
      }
    }

    // If no inactive instance, find oldest active one
    if (!oldestId) {
      for (const [id, pooled] of this.instances) {
        if (pooled.lastUsed.getTime() < oldestTime) {
          oldestTime = pooled.lastUsed.getTime();
          oldestId = id;
        }
      }
    }

    if (oldestId) {
      await this.removeInstance(oldestId);
      logger.info(`Forced cleanup of oldest instance ${oldestId} to make room`);
    }
  }

  /**
   * Remove and cleanup an instance
   */
  private async removeInstance(instanceId: string): Promise<void> {
    const pooled = this.instances.get(instanceId);
    if (pooled) {
      try {
        await pooled.instance.cleanup();
      } catch (error) {
        logger.error(`Error cleaning up instance ${instanceId}:`, error);
      }
      this.instances.delete(instanceId);
    }
  }

  /**
   * Start automatic cleanup timer
   */
  private startCleanupTimer(): void {
    this.cleanupInterval = setInterval(() => {
      this.performCleanup();
    }, 60000); // Run cleanup every minute
  }

  /**
   * Perform periodic cleanup of idle instances
   */
  private async performCleanup(): Promise<void> {
    const now = Date.now();
    const instancesToRemove: string[] = [];

    for (const [id, pooled] of this.instances) {
      const idleTime = now - pooled.lastUsed.getTime();
      const isExpired = idleTime > this.config.maxIdleTime;
      const isOld = (now - pooled.createdAt.getTime()) > this.config.instanceTimeout;
      
      if (!pooled.isActive && (isExpired || isOld)) {
        instancesToRemove.push(id);
      }
    }

    for (const id of instancesToRemove) {
      await this.removeInstance(id);
      logger.debug(`Cleaned up idle instance ${id}`);
    }

    if (instancesToRemove.length > 0) {
      logger.info(`Cleanup completed: removed ${instancesToRemove.length} idle instances`);
    }
  }

  /**
   * Get count of active instances
   */
  private getActiveCount(): number {
    return Array.from(this.instances.values()).filter(p => p.isActive).length;
  }

  /**
   * Get pool statistics
   */
  getStats(): {
    totalInstances: number;
    activeInstances: number;
    averageUsage: number;
    oldestInstanceAge: number;
    memoryEstimate: number; // MB
  } {
    const instances = Array.from(this.instances.values());
    const now = Date.now();
    
    return {
      totalInstances: instances.length,
      activeInstances: this.getActiveCount(),
      averageUsage: instances.reduce((sum, p) => sum + p.usageCount, 0) / instances.length || 0,
      oldestInstanceAge: instances.length > 0 
        ? Math.max(...instances.map(p => now - p.createdAt.getTime())) / 1000 
        : 0,
      memoryEstimate: instances.length * 75 // Approximate 75MB per instance
    };
  }

  /**
   * Cleanup all instances and stop timers
   */
  async cleanup(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }

    const cleanupPromises = Array.from(this.instances.keys()).map(id => 
      this.removeInstance(id)
    );

    await Promise.all(cleanupPromises);
    
    logger.info('Instance pool cleaned up completely');
  }

  /**
   * Warm up the pool by pre-creating instances
   */
  async warmUp(count: number = 1): Promise<void> {
    const warmUpPromises: Promise<void>[] = [];
    
    for (let i = 0; i < count && this.instances.size < this.config.maxInstances; i++) {
      warmUpPromises.push(
        this.createNewInstance().then(instance => 
          this.releaseInstance(instance)
        )
      );
    }

    await Promise.all(warmUpPromises);
    logger.info(`Pool warmed up with ${count} pre-created instances`);
  }
}

// Global optimized pool instance
export const optimizedInstancePool = OptimizedInstancePool.getInstance(); 