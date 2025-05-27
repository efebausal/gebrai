# Basic Tools API Reference

The basic tools provide core MCP functionality for testing connectivity, server status, and basic communication patterns. These tools have no GeoGebra dependencies and are designed for fast response times.

## 🎯 Overview

Basic tools are essential for:
- **Connectivity testing** - Verify MCP server is responding
- **Server monitoring** - Get server status and information
- **Communication testing** - Validate message passing functionality
- **Integration testing** - Confirm MCP protocol implementation

**Performance**: All basic tools respond in < 100ms (typically 5-20ms)

---

## 🔧 Tools

### `ping`

Simple connectivity test that returns "pong" - the most basic health check for the MCP server.

#### Input Schema
```json
{
  "type": "object",
  "properties": {},
  "required": []
}
```

#### Parameters
*No parameters required*

#### Response
```json
{
  "content": [{
    "type": "text",
    "text": "pong"
  }]
}
```

#### Usage Examples

**MCP Client Call:**
```javascript
const result = await mcpClient.call('tools/call', {
  name: 'ping',
  arguments: {}
});

console.log(result.content[0].text); // "pong"
```

#### Use Cases
- Health checks in monitoring systems
- Connectivity verification during setup
- Load balancer health probes
- Basic integration testing

---

### `echo`

Echo back a provided message - useful for testing parameter passing and message handling.

#### Input Schema
```json
{
  "type": "object",
  "properties": {
    "message": {
      "type": "string",
      "description": "The message to echo back"
    }
  },
  "required": ["message"]
}
```

#### Parameters
- **`message`** *(string, required)*: The message to echo back

#### Response
```json
{
  "content": [{
    "type": "text",
    "text": "Echo: {message}"
  }]
}
```

#### Usage Examples

**MCP Client Call:**
```javascript
const result = await mcpClient.call('tools/call', {
  name: 'echo',
  arguments: {
    message: "Hello, MCP!"
  }
});

console.log(result.content[0].text); // "Echo: Hello, MCP!"
```

**Parameter Validation Testing:**
```javascript
// Test with complex message
const result = await mcpClient.call('tools/call', {
  name: 'echo',
  arguments: {
    message: JSON.stringify({ test: "data", numbers: [1, 2, 3] })
  }
});
```

#### Use Cases
- Parameter passing validation
- Message formatting testing
- Integration debugging
- Communication protocol verification

---

### `server_info`

Get comprehensive information about the MCP server including version, capabilities, and current status.

#### Input Schema
```json
{
  "type": "object",
  "properties": {},
  "required": []
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
      \"name\": \"GeoGebra MCP Tool\",
      \"version\": \"1.0.0\",
      \"description\": \"Model Context Protocol server for GeoGebra mathematical visualization\",
      \"toolCount\": 42,
      \"timestamp\": \"2024-01-15T10:30:00.000Z\"
    }"
  }]
}
```

#### Response Fields
- **`name`**: Server name identifier
- **`version`**: Current server version
- **`description`**: Server description and capabilities
- **`toolCount`**: Total number of registered tools
- **`timestamp`**: Current server timestamp (ISO format)

#### Usage Examples

**MCP Client Call:**
```javascript
const result = await mcpClient.call('tools/call', {
  name: 'server_info',
  arguments: {}
});

const info = JSON.parse(result.content[0].text);
console.log(`Server: ${info.name} v${info.version}`);
console.log(`Tools available: ${info.toolCount}`);
```

**Health Check Implementation:**
```javascript
async function checkServerHealth() {
  try {
    // Test connectivity
    await mcpClient.call('tools/call', { name: 'ping', arguments: {} });
    
    // Get server info
    const infoResult = await mcpClient.call('tools/call', { 
      name: 'server_info', 
      arguments: {} 
    });
    
    const info = JSON.parse(infoResult.content[0].text);
    
    return {
      status: 'healthy',
      version: info.version,
      toolCount: info.toolCount,
      timestamp: info.timestamp
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
}
```

#### Use Cases
- Server monitoring and status checks
- Version compatibility verification
- Capability discovery
- Diagnostic information gathering

---

## 🚀 Integration Patterns

### Basic Health Check
```javascript
async function basicHealthCheck() {
  const start = Date.now();
  
  try {
    const result = await mcpClient.call('tools/call', {
      name: 'ping',
      arguments: {}
    });
    
    const responseTime = Date.now() - start;
    
    return {
      healthy: result.content[0].text === 'pong',
      responseTime: responseTime,
      status: responseTime < 100 ? 'excellent' : 'acceptable'
    };
  } catch (error) {
    return {
      healthy: false,
      error: error.message,
      responseTime: Date.now() - start
    };
  }
}
```

### Comprehensive Server Status
```javascript
async function getServerStatus() {
  const checks = await Promise.allSettled([
    mcpClient.call('tools/call', { name: 'ping', arguments: {} }),
    mcpClient.call('tools/call', { name: 'echo', arguments: { message: 'test' } }),
    mcpClient.call('tools/call', { name: 'server_info', arguments: {} })
  ]);
  
  const [pingResult, echoResult, infoResult] = checks;
  
  return {
    ping: pingResult.status === 'fulfilled',
    echo: echoResult.status === 'fulfilled' && 
          echoResult.value.content[0].text === 'Echo: test',
    serverInfo: infoResult.status === 'fulfilled' ? 
                JSON.parse(infoResult.value.content[0].text) : null,
    overallHealth: checks.every(c => c.status === 'fulfilled')
  };
}
```

### Monitoring Integration
```javascript
// Express.js health endpoint
app.get('/health', async (req, res) => {
  try {
    const healthCheck = await basicHealthCheck();
    
    if (healthCheck.healthy) {
      res.status(200).json({
        status: 'UP',
        responseTime: healthCheck.responseTime,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        status: 'DOWN',
        error: healthCheck.error,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    res.status(503).json({
      status: 'DOWN',
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
});
```

## ⚡ Performance Notes

- **Response Time**: All basic tools respond in < 100ms
- **Resource Usage**: Minimal CPU and memory usage
- **Concurrency**: Safe for high-frequency concurrent access
- **Rate Limiting**: No rate limiting applied to basic tools

## 🔗 Related Documentation

- [API Overview](README.md) - Complete API architecture
- [GeoGebra Tools](geogebra-tools.md) - Mathematical functionality
- [Performance Tools](performance-tools.md) - Advanced monitoring
- [Integration Guide](../guides/integration-guide.md) - Platform integration

---

**Note**: Basic tools are the foundation for all MCP integrations. Always test basic tool connectivity before attempting to use more complex GeoGebra or educational tools.