# Performance Tools API Reference

Performance tools provide monitoring, optimization, and resource management capabilities for the GeoGebra MCP Tool. These tools help ensure optimal performance and meet the < 2 second response time requirement.

## 🎯 Overview

Performance tools enable:
- **Real-time monitoring** - Track operation performance and response times
- **Resource optimization** - Manage GeoGebra instance pools for better performance  
- **Performance analysis** - Analyze trends and identify bottlenecks
- **Proactive management** - Pre-warm resources for peak performance

**Performance**: Performance tools respond in < 500ms

---

## 🔧 Tools

### `performance_get_stats`

Get comprehensive performance statistics for operations, including response times, success rates, and performance trends.

#### Input Schema
```json
{
  "type": "object",
  "properties": {
    "operationName": {
      "type": "string",
      "description": "Specific operation name to get stats for (optional - if not provided, gets overall stats)"
    }
  }
}
```

#### Parameters
- **`operationName`** *(string, optional)*: Specific operation to analyze (e.g., "geogebra_create_point", "geogebra_export_png")

#### Response
```json
{
  "content": [{
    "type": "text",
    "text": "{
      \"success\": true,
      \"operationName\": \"geogebra_create_point\",
      \"stats\": {
        \"count\": 150,
        \"averageDuration\": 245.6,
        \"p95Duration\": 420.3,
        \"successRate\": 0.987,
        \"errorCount\": 2
      },
      \"availableOperations\": [\"geogebra_create_point\", \"geogebra_export_png\"],
      \"summary\": {
        \"totalOperations\": 150,
        \"averageResponseTime\": \"245.60ms\",
        \"successRate\": \"98.7%\",
        \"p95ResponseTime\": \"420.30ms\",
        \"performanceStatus\": \"GOOD\"
      }
    }"
  }]
}
```

#### Response Fields
- **`count`**: Total number of operations tracked
- **`averageDuration`**: Average response time in milliseconds
- **`p95Duration`**: 95th percentile response time
- **`successRate`**: Success rate (0.0 to 1.0)
- **`performanceStatus`**: GOOD (< 2000ms p95) or NEEDS_ATTENTION

#### Usage Examples

**Get Overall Statistics:**
```javascript
const result = await mcpClient.call('tools/call', {
  name: 'performance_get_stats',
  arguments: {}
});

const stats = JSON.parse(result.content[0].text);
console.log(`Performance Status: ${stats.summary.performanceStatus}`);
console.log(`Success Rate: ${stats.summary.successRate}`);
```

**Monitor Specific Operation:**
```javascript
const result = await mcpClient.call('tools/call', {
  name: 'performance_get_stats', 
  arguments: {
    operationName: 'geogebra_export_png'
  }
});

const stats = JSON.parse(result.content[0].text);
if (stats.stats.p95Duration > 1500) {
  console.warn('PNG export performance degraded');
}
```

#### Use Cases
- Performance monitoring dashboards
- Alerting when response times degrade
- Capacity planning and optimization
- SLA compliance monitoring

---

### `performance_get_pool_stats`

Get instance pool performance and resource statistics for monitoring memory usage and pool efficiency.

#### Input Schema
```json
{
  "type": "object",
  "properties": {}
}
```

#### Parameters
*No parameters required*

#### Response
```json
{
  "content": [{
    "type": "text",
    "text": "{
      \"success\": true,
      \"poolStats\": {
        \"totalInstances\": 3,
        \"activeInstances\": 2,
        \"memoryEstimate\": 120,
        \"averageUsage\": 8.5,
        \"peakUsage\": 15
      },
      \"resourceStatus\": {
        \"memoryUsage\": \"120MB estimated\",
        \"efficiency\": \"NORMAL\",
        \"poolUtilization\": \"66.7%\",
        \"recommendation\": \"Pool size appropriate for current usage\"
      }
    }"
  }]
}
```

#### Response Fields
- **`totalInstances`**: Total GeoGebra instances in pool
- **`activeInstances`**: Currently active instances
- **`memoryEstimate`**: Estimated memory usage in MB
- **`averageUsage`**: Average concurrent usage
- **`efficiency`**: HIGH, NORMAL, or LOW based on usage patterns

#### Usage Examples

**Monitor Resource Usage:**
```javascript
const result = await mcpClient.call('tools/call', {
  name: 'performance_get_pool_stats',
  arguments: {}
});

const poolStats = JSON.parse(result.content[0].text);
console.log(`Memory Usage: ${poolStats.resourceStatus.memoryUsage}`);
console.log(`Recommendation: ${poolStats.resourceStatus.recommendation}`);
```

**Resource Optimization Logic:**
```javascript
async function optimizeResourceUsage() {
  const result = await mcpClient.call('tools/call', {
    name: 'performance_get_pool_stats',
    arguments: {}
  });
  
  const stats = JSON.parse(result.content[0].text);
  
  if (stats.poolStats.averageUsage > 10) {
    // High usage - consider warming up more instances
    await warmUpPool(2);
  } else if (stats.poolStats.averageUsage < 2 && stats.poolStats.totalInstances > 1) {
    // Low usage - could reduce pool size
    console.log('Consider reducing pool size for memory efficiency');
  }
}
```

#### Use Cases
- Memory usage monitoring
- Pool size optimization
- Resource planning
- Cost optimization in cloud environments

---

### `performance_warm_up_pool`

Pre-warm the instance pool by creating GeoGebra instances in advance for better performance during peak usage.

#### Input Schema
```json
{
  "type": "object",
  "properties": {
    "count": {
      "type": "number",
      "description": "Number of instances to pre-create (default: 1, max: 3)",
      "minimum": 1,
      "maximum": 3
    }
  }
}
```

#### Parameters
- **`count`** *(number, optional)*: Number of instances to pre-create (1-3, default: 1)

#### Response
```json
{
  "content": [{
    "type": "text",
    "text": "{
      \"success\": true,
      \"message\": \"Pool warmed up with 2 instances\",
      \"warmUpTime\": \"1250ms\",
      \"poolStats\": {
        \"totalInstances\": 2,
        \"memoryEstimate\": \"80MB\"
      }
    }"
  }]
}
```

#### Usage Examples

**Startup Warm-up:**
```javascript
// Warm up pool during application startup
const result = await mcpClient.call('tools/call', {
  name: 'performance_warm_up_pool',
  arguments: {
    count: 2
  }
});

const warmUp = JSON.parse(result.content[0].text);
console.log(`Pool ready in ${warmUp.warmUpTime}`);
```

**Peak Usage Preparation:**
```javascript
async function prepareForPeakUsage() {
  try {
    // Pre-warm 3 instances before expected high load
    await mcpClient.call('tools/call', {
      name: 'performance_warm_up_pool',
      arguments: { count: 3 }
    });
    
    console.log('System ready for peak usage');
  } catch (error) {
    console.error('Failed to warm up pool:', error);
  }
}
```

#### Use Cases
- Application startup optimization
- Pre-peak load preparation
- Reducing first-request latency
- Load testing preparation

---

### `performance_clear_metrics`

Clear all performance metrics - useful for testing, benchmarking, or starting fresh metric collection.

#### Input Schema
```json
{
  "type": "object",
  "properties": {}
}
```

#### Parameters
*No parameters required*

#### Response
```json
{
  "content": [{
    "type": "text",
    "text": "{
      \"success\": true,
      \"message\": \"All performance metrics cleared\"
    }"
  }]
}
```

#### Usage Examples

**Reset Metrics for Testing:**
```javascript
// Clear metrics before running performance tests
await mcpClient.call('tools/call', {
  name: 'performance_clear_metrics',
  arguments: {}
});

// Run your test operations
// ...

// Get fresh performance statistics
const stats = await mcpClient.call('tools/call', {
  name: 'performance_get_stats',
  arguments: {}
});
```

#### Use Cases
- Performance testing setup
- Metric collection reset
- Benchmark preparation
- Development and debugging

---

### `performance_monitor_compliance`

Monitor compliance with performance requirements and generate alerts for degraded performance.

#### Input Schema
```json
{
  "type": "object",
  "properties": {
    "thresholdMs": {
      "type": "number",
      "description": "Response time threshold in milliseconds (default: 2000)",
      "minimum": 100,
      "maximum": 10000
    }
  }
}
```

#### Parameters
- **`thresholdMs`** *(number, optional)*: Performance threshold in milliseconds (default: 2000)

#### Response
```json
{
  "content": [{
    "type": "text",
    "text": "{
      \"success\": true,
      \"compliance\": {
        \"threshold\": 2000,
        \"compliantOperations\": 23,
        \"violatingOperations\": 2,
        \"complianceRate\": 92.0,
        \"status\": \"WARNING\"
      },
      \"violations\": [
        {
          \"operation\": \"geogebra_export_pdf\",
          \"p95Duration\": 2150,
          \"violationSeverity\": \"MINOR\"
        }
      ],
      \"recommendations\": [
        \"Consider optimizing PDF export operations\",
        \"Monitor resource usage during export operations\"
      ]
    }"
  }]
}
```

#### Usage Examples

**Compliance Monitoring:**
```javascript
const result = await mcpClient.call('tools/call', {
  name: 'performance_monitor_compliance',
  arguments: {
    thresholdMs: 1500  // Stricter threshold
  }
});

const compliance = JSON.parse(result.content[0].text);
if (compliance.compliance.status !== 'GOOD') {
  console.warn(`Performance compliance: ${compliance.compliance.status}`);
  compliance.recommendations.forEach(rec => console.log(`- ${rec}`));
}
```

#### Use Cases
- SLA monitoring
- Performance regression detection
- Automated alerting
- Compliance reporting

---

## 🚀 Integration Patterns

### Performance Monitoring Dashboard
```javascript
class PerformanceMonitor {
  constructor(mcpClient) {
    this.client = mcpClient;
    this.alertThreshold = 2000; // 2 seconds
  }
  
  async getComprehensiveMetrics() {
    const [statsResult, poolResult, complianceResult] = await Promise.all([
      this.client.call('tools/call', { 
        name: 'performance_get_stats', 
        arguments: {} 
      }),
      this.client.call('tools/call', { 
        name: 'performance_get_pool_stats', 
        arguments: {} 
      }),
      this.client.call('tools/call', { 
        name: 'performance_monitor_compliance', 
        arguments: { thresholdMs: this.alertThreshold } 
      })
    ]);
    
    return {
      performance: JSON.parse(statsResult.content[0].text),
      resources: JSON.parse(poolResult.content[0].text),
      compliance: JSON.parse(complianceResult.content[0].text)
    };
  }
  
  async checkAndOptimize() {
    const metrics = await this.getComprehensiveMetrics();
    
    // Check for performance issues
    if (metrics.compliance.compliance.status !== 'GOOD') {
      console.warn('Performance degradation detected');
      
      // Auto-optimize if possible
      if (metrics.resources.poolStats.totalInstances < 2) {
        await this.client.call('tools/call', {
          name: 'performance_warm_up_pool',
          arguments: { count: 2 }
        });
      }
    }
    
    return metrics;
  }
}
```

### Startup Optimization
```javascript
async function optimizeStartup() {
  console.log('Optimizing server startup...');
  
  // Clear old metrics
  await mcpClient.call('tools/call', {
    name: 'performance_clear_metrics',
    arguments: {}
  });
  
  // Warm up pool
  const warmUpResult = await mcpClient.call('tools/call', {
    name: 'performance_warm_up_pool',
    arguments: { count: 2 }
  });
  
  const warmUp = JSON.parse(warmUpResult.content[0].text);
  console.log(`Pool ready: ${warmUp.message} (${warmUp.warmUpTime})`);
  
  // Verify optimization
  const poolStats = await mcpClient.call('tools/call', {
    name: 'performance_get_pool_stats',
    arguments: {}
  });
  
  const stats = JSON.parse(poolStats.content[0].text);
  console.log(`Memory usage: ${stats.resourceStatus.memoryUsage}`);
  console.log('Startup optimization complete');
}
```

### Automated Performance Alerting
```javascript
class PerformanceAlerter {
  constructor(mcpClient, alertCallback) {
    this.client = mcpClient;
    this.onAlert = alertCallback;
    this.monitoringInterval = null;
  }
  
  startMonitoring(intervalMs = 60000) { // Check every minute
    this.monitoringInterval = setInterval(async () => {
      try {
        const result = await this.client.call('tools/call', {
          name: 'performance_monitor_compliance',
          arguments: { thresholdMs: 2000 }
        });
        
        const compliance = JSON.parse(result.content[0].text);
        
        if (compliance.compliance.status === 'CRITICAL') {
          this.onAlert({
            level: 'CRITICAL',
            message: 'Critical performance degradation detected',
            complianceRate: compliance.compliance.complianceRate,
            violations: compliance.violations
          });
        } else if (compliance.compliance.status === 'WARNING') {
          this.onAlert({
            level: 'WARNING',
            message: 'Performance degradation detected',
            complianceRate: compliance.compliance.complianceRate,
            recommendations: compliance.recommendations
          });
        }
      } catch (error) {
        this.onAlert({
          level: 'ERROR',
          message: 'Performance monitoring failed',
          error: error.message
        });
      }
    }, intervalMs);
  }
  
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }
}

// Usage
const alerter = new PerformanceAlerter(mcpClient, (alert) => {
  console.log(`ALERT [${alert.level}]: ${alert.message}`);
  // Send to monitoring system, email, Slack, etc.
});

alerter.startMonitoring(); // Start monitoring every minute
```

## ⚡ Performance Best Practices

### 1. **Startup Optimization**
- Always warm up the pool during application startup
- Use `performance_warm_up_pool` with count=2 for balanced performance/memory
- Monitor warm-up time to detect initialization issues

### 2. **Continuous Monitoring**
- Check performance stats regularly (every 1-5 minutes)
- Monitor compliance with < 2 second requirement
- Set up automated alerting for performance degradation

### 3. **Resource Management**
- Monitor pool stats to optimize memory usage
- Scale pool size based on usage patterns
- Clear metrics periodically to reset baseline

### 4. **Load Testing**
- Use `performance_clear_metrics` before load tests
- Monitor compliance during testing
- Validate performance under different load conditions

## 🔗 Related Documentation

- [API Overview](README.md) - Complete API architecture
- [Basic Tools](basic-tools.md) - Health checks and monitoring
- [GeoGebra Tools](geogebra-tools.md) - Core mathematical functionality
- [Troubleshooting](../support/troubleshooting.md) - Performance issues

---

**Note**: Performance tools are essential for production deployments. Always implement performance monitoring to ensure the < 2 second response time requirement is maintained. 