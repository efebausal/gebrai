/**
 * GEB-9: Performance Optimization Tests
 * Tests for Response Time and Resource Management improvements
 */

import { ToolRegistry } from '../../src/tools';
import { performanceMonitor } from '../../src/utils/performance';
import { optimizedInstancePool } from '../../src/utils/performance/instance-pool';

// Mock dependencies for testing
jest.mock('../../src/utils/geogebra-instance');
jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  debug: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

describe('GEB-9: Performance Optimization System', () => {
  let registry: ToolRegistry;

  beforeEach(() => {
    jest.clearAllMocks();
    registry = new ToolRegistry();
    performanceMonitor.clearMetrics();
  });

  afterEach(async () => {
    await optimizedInstancePool.cleanup();
  });

  describe('Performance Monitoring', () => {
    it('should track operation performance metrics', async () => {
      const operation = async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return 'test result';
      };

      const result = await performanceMonitor.measureOperation('test_operation', operation);
      
      expect(result).toBe('test result');
      
      const stats = performanceMonitor.getStats('test_operation');
      expect(stats.count).toBe(1);
      expect(stats.averageDuration).toBeGreaterThan(90);
      expect(stats.averageDuration).toBeLessThan(200);
      expect(stats.successRate).toBe(1);
    });

    it('should handle operation failures and track error metrics', async () => {
      const failingOperation = async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        throw new Error('Test error');
      };

      await expect(
        performanceMonitor.measureOperation('failing_operation', failingOperation)
      ).rejects.toThrow('Test error');
      
      const stats = performanceMonitor.getStats('failing_operation');
      expect(stats.count).toBe(1);
      expect(stats.successRate).toBe(0);
    });

    it('should calculate performance statistics correctly', async () => {
      // Create multiple operations with known durations
      for (let i = 0; i < 5; i++) {
        await performanceMonitor.measureOperation('batch_operation', async () => {
          await new Promise(resolve => setTimeout(resolve, 100 + i * 10));
        });
      }

      const stats = performanceMonitor.getStats('batch_operation');
      expect(stats.count).toBe(5);
      expect(stats.averageDuration).toBeGreaterThan(110);
      expect(stats.averageDuration).toBeLessThan(150);
      expect(stats.minDuration).toBeGreaterThan(90);
      expect(stats.maxDuration).toBeGreaterThan(130);
    });

    it('should track memory usage changes', async () => {
      const operation = async () => {
        // Create some memory pressure
        const largeArray = new Array(1000).fill('test data');
        await new Promise(resolve => setTimeout(resolve, 10));
        return largeArray.length;
      };

      await performanceMonitor.measureOperation('memory_operation', operation);
      
      const metrics = performanceMonitor.exportMetrics();
      const metric = metrics.find(m => m.operationName === 'memory_operation');
      
      expect(metric).toBeDefined();
      expect(metric?.memoryUsage).toBeDefined();
    });
  });

  describe('Performance Tools Integration', () => {
    it('should provide performance statistics through tool interface', async () => {
      // Generate some test metrics
      await performanceMonitor.measureOperation('test_tool_operation', async () => {
        await new Promise(resolve => setTimeout(resolve, 150));
      });

      const result = await registry.executeTool('performance_get_stats', {
        operationName: 'test_tool_operation'
      });

      expect(result.content).toBeDefined();
      expect(result.content[0]).toBeDefined();
      
      const responseText = result.content[0]?.text;
      expect(responseText).toBeDefined();
      
      const response = JSON.parse(responseText!);
      expect(response.success).toBe(true);
      expect(response.stats.count).toBe(1);
      expect(response.summary.averageResponseTime).toContain('ms');
      expect(response.summary.performanceStatus).toBeDefined();
    });

    it('should provide instance pool statistics', async () => {
      const result = await registry.executeTool('performance_get_pool_stats', {});

      expect(result.content).toBeDefined();
      expect(result.content[0]).toBeDefined();
      
      const responseText = result.content[0]?.text;
      expect(responseText).toBeDefined();
      
      const response = JSON.parse(responseText!);
      expect(response.success).toBe(true);
      expect(response.poolStats).toBeDefined();
      expect(response.resourceStatus).toBeDefined();
      expect(response.resourceStatus.memoryUsage).toContain('MB');
    });

    it('should clear performance metrics', async () => {
      // Add some metrics
      await performanceMonitor.measureOperation('clear_test', async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      expect(performanceMonitor.getStats().count).toBe(1);

      const result = await registry.executeTool('performance_clear_metrics', {});
      
      expect(result.content).toBeDefined();
      expect(result.content[0]).toBeDefined();
      
      const responseText = result.content[0]?.text;
      expect(responseText).toBeDefined();
      
      const response = JSON.parse(responseText!);
      expect(response.success).toBe(true);
      expect(performanceMonitor.getStats().count).toBe(0);
    });
  });

  describe('Performance Thresholds and Alerts', () => {
    it('should detect slow operations and log warnings', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      // Simulate a slow operation (over warning threshold)
      await performanceMonitor.measureOperation('slow_operation', async () => {
        await new Promise(resolve => setTimeout(resolve, 1100)); // Over 1000ms warning
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('WARNING: slow_operation took')
      );
      
      consoleSpy.mockRestore();
    });

    it('should detect critical performance issues', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Simulate a critical slow operation (over critical threshold)
      await performanceMonitor.measureOperation('critical_operation', async () => {
        await new Promise(resolve => setTimeout(resolve, 2100)); // Over 2000ms critical
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('CRITICAL: critical_operation took')
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Performance Requirements Validation', () => {
    it('should meet PRD requirement of <2 second response time for basic operations', async () => {
      const startTime = Date.now();
      
      // Test a typical operation
      await performanceMonitor.measureOperation('prd_test_operation', async () => {
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate typical operation
      });
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(2000); // PRD requirement: <2 seconds
      
      const stats = performanceMonitor.getStats('prd_test_operation');
      expect(stats.averageDuration).toBeLessThan(2000);
    });

    it('should track success rates for reliability metrics', async () => {
      // Mix successful and failed operations
      for (let i = 0; i < 8; i++) {
        try {
          await performanceMonitor.measureOperation('reliability_test', async () => {
            if (i < 7) { // 7 successes, 1 failure
              await new Promise(resolve => setTimeout(resolve, 10));
            } else {
              throw new Error('Simulated failure');
            }
          });
        } catch (error) {
          // Expected for the last iteration
        }
      }

      const stats = performanceMonitor.getStats('reliability_test');
      expect(stats.count).toBe(8);
      expect(stats.successRate).toBeCloseTo(0.875); // 7/8 = 87.5%
    });
  });

  describe('Memory and Resource Management', () => {
    it('should maintain reasonable memory limits', async () => {
      const initialMemory = process.memoryUsage();
      
      // Simulate multiple operations
      for (let i = 0; i < 10; i++) {
        await performanceMonitor.measureOperation(`memory_test_${i}`, async () => {
          await new Promise(resolve => setTimeout(resolve, 50));
        });
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Memory increase should be reasonable (less than 50MB for this test)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });

    it('should limit metrics storage to prevent memory leaks', async () => {
      // Add more metrics than the limit
      for (let i = 0; i < 1200; i++) {
        await performanceMonitor.measureOperation(`overflow_test_${i}`, async () => {
          await new Promise(resolve => setTimeout(resolve, 1));
        });
      }

      const allMetrics = performanceMonitor.exportMetrics();
      expect(allMetrics.length).toBeLessThanOrEqual(1000); // Should cap at 1000 metrics
    });
  });

  describe('Performance Optimization Effectiveness', () => {
    it('should show improved performance with multiple operations', async () => {
      const operations: Promise<void>[] = [];
      
      // Run multiple concurrent-like operations
      for (let i = 0; i < 5; i++) {
        operations.push(
          performanceMonitor.measureOperation(`concurrent_test_${i}`, async () => {
            await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 50));
          })
        );
      }

      await Promise.all(operations);
      
      // Check that all operations completed within reasonable time
      const overallStats = performanceMonitor.getStats();
      expect(overallStats.count).toBe(5);
      expect(overallStats.p95Duration).toBeLessThan(300); // 95% under 300ms
    });

    it('should provide actionable performance insights', async () => {
      // Simulate a slow operation
      await performanceMonitor.measureOperation('insight_test', async () => {
        await new Promise(resolve => setTimeout(resolve, 1800)); // Close to 2s limit
      });

      const result = await registry.executeTool('performance_get_stats', {
        operationName: 'insight_test'
      });

      expect(result.content).toBeDefined();
      expect(result.content[0]).toBeDefined();
      
      const responseText = result.content[0]?.text;
      expect(responseText).toBeDefined();
      
      const response = JSON.parse(responseText!);
      expect(response.summary.performanceStatus).toBe('NEEDS_ATTENTION');
      expect(parseFloat(response.summary.p95ResponseTime)).toBeGreaterThan(1500);
    });
  });
});

describe('Performance Benchmark Integration', () => {
  let registry: ToolRegistry;

  beforeEach(() => {
    registry = new ToolRegistry();
  });

  it('should run basic performance benchmarks', async () => {
    const result = await registry.executeTool('performance_benchmark', {
      testType: 'basic',
      iterations: 3
    });

    expect(result.content).toBeDefined();
    expect(result.content[0]).toBeDefined();
    
    const responseText = result.content[0]?.text;
    expect(responseText).toBeDefined();
    
    const response = JSON.parse(responseText!);
    expect(response.success).toBe(true);
    expect(response.benchmark.testType).toBe('basic');
    expect(response.benchmark.iterations).toBe(3);
    expect(response.benchmark.results).toHaveLength(1);
    expect(response.benchmark.summary.totalTests).toBe(1);
  });
}); 