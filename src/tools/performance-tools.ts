/**
 * Performance Optimization Tools
 * GEB-9: Performance Optimization: Response Time and Resource Management
 */

import { ToolDefinition } from '../types/mcp';
import { performanceMonitor } from '../utils/performance';
import { optimizedInstancePool } from '../utils/performance/instance-pool';
import logger from '../utils/logger';

export const performanceTools: ToolDefinition[] = [
  {
    tool: {
      name: 'performance_get_stats',
      description: 'Get performance statistics for operations',
      inputSchema: {
        type: 'object',
        properties: {
          operationName: {
            type: 'string',
            description: 'Specific operation name to get stats for (optional - if not provided, gets overall stats)'
          }
        }
      }
    },
    handler: async (params) => {
      try {
        const operationName = params['operationName'] as string | undefined;
        const stats = performanceMonitor.getStats(operationName);
        const operationNames = performanceMonitor.getOperationNames();
        
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: true,
              operationName: operationName || 'overall',
              stats,
              availableOperations: operationNames,
              summary: {
                totalOperations: stats.count,
                averageResponseTime: `${stats.averageDuration.toFixed(2)}ms`,
                successRate: `${(stats.successRate * 100).toFixed(1)}%`,
                p95ResponseTime: `${stats.p95Duration.toFixed(2)}ms`,
                performanceStatus: stats.p95Duration < 2000 ? 'GOOD' : 'NEEDS_ATTENTION'
              }
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Failed to get performance stats', error);
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  },

  {
    tool: {
      name: 'performance_get_pool_stats',
      description: 'Get instance pool performance and resource statistics',
      inputSchema: {
        type: 'object',
        properties: {}
      }
    },
    handler: async () => {
      try {
        const poolStats = optimizedInstancePool.getStats();
        
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: true,
              poolStats,
              resourceStatus: {
                memoryUsage: `${poolStats.memoryEstimate}MB estimated`,
                efficiency: poolStats.averageUsage > 5 ? 'HIGH' : 'NORMAL',
                poolUtilization: `${((poolStats.activeInstances / poolStats.totalInstances) * 100).toFixed(1)}%`,
                recommendation: poolStats.totalInstances === 0 
                  ? 'Pool empty - instances will be created on demand'
                  : poolStats.averageUsage > 10 
                    ? 'Consider increasing pool size for high usage'
                    : 'Pool size appropriate for current usage'
              }
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Failed to get pool stats', error);
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  },

  {
    tool: {
      name: 'performance_warm_up_pool',
      description: 'Pre-warm the instance pool for better performance',
      inputSchema: {
        type: 'object',
        properties: {
          count: {
            type: 'number',
            description: 'Number of instances to pre-create (default: 1, max: 3)',
            minimum: 1,
            maximum: 3
          }
        }
      }
    },
    handler: async (params) => {
      try {
        const count = Math.min((params['count'] as number) || 1, 3);
        
        const startTime = Date.now();
        await optimizedInstancePool.warmUp(count);
        const duration = Date.now() - startTime;
        
        const poolStats = optimizedInstancePool.getStats();
        
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: true,
              message: `Pool warmed up with ${count} instances`,
              warmUpTime: `${duration}ms`,
              poolStats: {
                totalInstances: poolStats.totalInstances,
                memoryEstimate: `${poolStats.memoryEstimate}MB`
              }
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Failed to warm up pool', error);
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  },

  {
    tool: {
      name: 'performance_clear_metrics',
      description: 'Clear all performance metrics (useful for testing)',
      inputSchema: {
        type: 'object',
        properties: {}
      }
    },
    handler: async () => {
      try {
        performanceMonitor.clearMetrics();
        
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: true,
              message: 'All performance metrics cleared'
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Failed to clear metrics', error);
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  },

  {
    tool: {
      name: 'performance_benchmark',
      description: 'Run performance benchmark tests',
      inputSchema: {
        type: 'object',
        properties: {
          testType: {
            type: 'string',
            description: 'Type of benchmark to run',
            enum: ['basic', 'command_execution', 'export_operations', 'all']
          },
          iterations: {
            type: 'number',
            description: 'Number of iterations to run (default: 5)',
            minimum: 1,
            maximum: 20
          }
        },
        required: ['testType']
      }
    },
    handler: async (params) => {
      try {
        const testType = params['testType'] as string;
        const iterations = Math.min((params['iterations'] as number) || 5, 20);
        
        const benchmarkResults: any = {
          testType,
          iterations,
          results: [],
          summary: {}
        };

        const instance = await optimizedInstancePool.getInstance();
        
        try {
          if (testType === 'basic' || testType === 'all') {
            // Basic command execution benchmark
            const durations: number[] = [];
            for (let i = 0; i < iterations; i++) {
              const startTime = Date.now();
              await instance.evalCommand(`TestPoint${i} = (${i}, ${i})`);
              durations.push(Date.now() - startTime);
            }
            
            benchmarkResults.results.push({
              operation: 'basic_command_execution',
              durations,
              average: durations.reduce((a, b) => a + b, 0) / durations.length,
              min: Math.min(...durations),
              max: Math.max(...durations)
            });
          }

          if (testType === 'export_operations' || testType === 'all') {
            // Export benchmark
            await instance.evalCommand('A = (0, 0)');
            await instance.evalCommand('B = (1, 1)');
            await instance.evalCommand('line1 = Line(A, B)');
            
            const exportDurations: number[] = [];
            for (let i = 0; i < Math.min(iterations, 3); i++) { // Limit export tests
              const startTime = Date.now();
              await instance.exportSVG();
              exportDurations.push(Date.now() - startTime);
            }
            
            benchmarkResults.results.push({
              operation: 'svg_export',
              durations: exportDurations,
              average: exportDurations.reduce((a, b) => a + b, 0) / exportDurations.length,
              min: Math.min(...exportDurations),
              max: Math.max(...exportDurations)
            });
          }

          // Calculate overall summary
          benchmarkResults.summary = {
            totalTests: benchmarkResults.results.length,
            allTestsPassed: benchmarkResults.results.every((r: any) => r.average < 2000),
            recommendedAction: benchmarkResults.results.some((r: any) => r.average > 1500) 
              ? 'Consider pool warm-up or optimization' 
              : 'Performance is within acceptable range'
          };

        } finally {
          await optimizedInstancePool.releaseInstance(instance);
        }
        
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: true,
              benchmark: benchmarkResults
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Failed to run benchmark', error);
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  }
]; 