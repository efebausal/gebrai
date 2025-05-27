# Troubleshooting Guide

This guide helps you diagnose and resolve common issues with the GeoGebra MCP Tool. Issues are organized by category with step-by-step solutions.

## 🚨 Quick Diagnostics

Start here for immediate issue identification:

### Health Check Script
```bash
# Run this script to check overall system health
npm run health-check

# Or manual health check
curl -X POST http://localhost:3000 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"ping","arguments":{}},"id":1}'
```

### Performance Check
```javascript
// Quick performance verification
const result = await mcpClient.call('tools/call', {
  name: 'performance_get_stats',
  arguments: {}
});

const stats = JSON.parse(result.content[0].text);
console.log('Performance Status:', stats.summary.performanceStatus);
```

---

## 🔧 Installation & Setup Issues

### Node.js Version Incompatibility

**Problem**: Server fails to start with Node.js version errors
```
Error: Unsupported Node.js version. Requires 18.0.0 or higher.
```

**Solution**:
```bash
# Check current Node.js version
node --version

# Install/update Node.js using nvm (recommended)
nvm install 18
nvm use 18

# Verify installation
node --version  # Should show v18.x.x or higher
```

### Dependency Installation Failures

**Problem**: `npm install` fails with permission or network errors

**Solutions**:

1. **Permission Issues (macOS/Linux)**:
```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules

# Or use nvm instead of system Node.js
```

2. **Network/Registry Issues**:
```bash
# Clear npm cache
npm cache clean --force

# Use different registry
npm install --registry https://registry.npmjs.org/

# Check network connectivity
npm config get registry
```

3. **Package Lock Issues**:
```bash
# Remove lock files and reinstall
rm package-lock.json node_modules -rf
npm install
```

### Environment Configuration

**Problem**: Server starts but tools don't work properly

**Solution**:
```bash
# Check environment variables
cat .env

# Verify required variables are set
export LOG_LEVEL=debug
export NODE_ENV=development
export PORT=3000

# Test with minimal configuration
cp .env.example .env.minimal
```

---

## 🔗 Connection & Communication Issues

### MCP Protocol Communication Errors

**Problem**: Client can't connect to MCP server
```
Error: Failed to connect to MCP server
```

**Diagnostic Steps**:
```bash
# 1. Check if server is running
ps aux | grep node

# 2. Check port availability
lsof -i :3000

# 3. Test stdio communication
echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | node dist/index.js
```

**Solutions**:

1. **Server Not Running**:
```bash
# Start server in debug mode
LOG_LEVEL=debug npm run dev

# Check server logs for errors
tail -f logs/server.log
```

2. **Port Conflicts**:
```bash
# Use different port
export PORT=3001
npm start

# Or kill conflicting process
lsof -ti:3000 | xargs kill -9
```

3. **Stdio Issues**:
```bash
# Test with explicit stdio configuration
node dist/index.js < /dev/null

# Check for stdout/stderr conflicts
node dist/index.js 2>&1 | tee debug.log
```

### Claude Desktop Integration Issues

**Problem**: Claude doesn't recognize GeoGebra tools

**Solution**:
```json
// Check Claude Desktop config file
// macOS: ~/Library/Application Support/Claude/claude_desktop_config.json
{
  "mcpServers": {
    "geogebra": {
      "command": "node",
      "args": ["/absolute/path/to/gebrai/dist/index.js"],
      "cwd": "/absolute/path/to/gebrai",
      "env": {
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

**Verification Steps**:
1. Restart Claude Desktop completely
2. Check absolute paths (no `~` or relative paths)
3. Verify file permissions: `ls -la dist/index.js`
4. Test standalone: `node dist/index.js`

### Timeout Issues

**Problem**: Operations timeout or hang
```
Error: Operation timed out after 30000ms
```

**Solutions**:

1. **Increase Timeout**:
```env
# In .env file
RESPONSE_TIMEOUT=60000  # 60 seconds
```

2. **Check Instance Pool**:
```javascript
// Monitor pool status
const poolStats = await mcpClient.call('tools/call', {
  name: 'performance_get_pool_stats',
  arguments: {}
});
```

3. **Optimize Performance**:
```javascript
// Pre-warm instances
await mcpClient.call('tools/call', {
  name: 'performance_warm_up_pool',
  arguments: { count: 2 }
});
```

---

## 📐 Mathematical Construction Issues

### GeoGebra Instance Failures

**Problem**: GeoGebra operations fail or return errors
```
Error: GeoGebra instance not ready
```

**Diagnostic Steps**:
```javascript
// Check instance status
const status = await mcpClient.call('tools/call', {
  name: 'geogebra_instance_status',
  arguments: {}
});

console.log('Instance Status:', JSON.parse(status.content[0].text));
```

**Solutions**:

1. **Instance Not Ready**:
```javascript
// Wait for instance to initialize
await mcpClient.call('tools/call', {
  name: 'geogebra_clear_construction',
  arguments: {}
});

// Check if ready
const ready = await mcpClient.call('tools/call', {
  name: 'geogebra_instance_status',
  arguments: {}
});
```

2. **Memory Issues**:
```bash
# Check available memory
free -h  # Linux
vm_stat  # macOS

# Reduce instance pool size
export INSTANCE_POOL_SIZE=1
```

3. **Headless Mode Issues**:
```env
# In .env file
GEOGEBRA_HEADLESS=true
DISPLAY=:99  # Linux with virtual display
```

### Invalid Mathematical Expressions

**Problem**: Mathematical commands fail with syntax errors
```
Error: Invalid expression: 'x^2 ++ 1'
```

**Solutions**:

1. **Validate Input**:
```javascript
// Use validation utilities
import { validateFunctionExpression } from './utils/validation';

const validation = validateFunctionExpression('x^2 + 1');
if (!validation.isValid) {
  console.error('Invalid expression:', validation.error);
}
```

2. **Common Syntax Issues**:
```javascript
// Correct GeoGebra syntax
'x^2 + 2*x + 1'  // ✓ Explicit multiplication
'sin(x) + cos(x)'  // ✓ Function syntax
'sqrt(x)'          // ✓ Square root
'abs(x)'           // ✓ Absolute value

// Incorrect syntax
'x^2 + 2x + 1'     // ✗ Implicit multiplication
'sin x + cos x'     // ✗ Missing parentheses
'√x'               // ✗ Unicode symbols
'|x|'              // ✗ Use abs(x) instead
```

### Object Naming Conflicts

**Problem**: Objects can't be created due to naming conflicts
```
Error: Object 'A' already exists
```

**Solutions**:

1. **Clear Before Creating**:
```javascript
// Clear existing construction
await mcpClient.call('tools/call', {
  name: 'geogebra_clear_construction',
  arguments: {}
});
```

2. **Check Existing Objects**:
```javascript
// List current objects
const objects = await mcpClient.call('tools/call', {
  name: 'geogebra_get_objects',
  arguments: {}
});

console.log('Existing objects:', JSON.parse(objects.content[0].text));
```

3. **Use Unique Names**:
```javascript
// Generate unique names
const timestamp = Date.now();
const pointName = `Point_${timestamp}`;
```

---

## 📊 Performance Issues

### Slow Response Times

**Problem**: Operations take longer than 2 seconds
```
Warning: Operation took 3500ms (exceeds 2000ms requirement)
```

**Diagnostic Steps**:
```javascript
// Get detailed performance stats
const stats = await mcpClient.call('tools/call', {
  name: 'performance_get_stats',
  arguments: { operationName: 'geogebra_export_png' }
});

const perf = JSON.parse(stats.content[0].text);
console.log('P95 Response Time:', perf.stats.p95Duration);
```

**Solutions**:

1. **Optimize Instance Pool**:
```javascript
// Warm up instances
await mcpClient.call('tools/call', {
  name: 'performance_warm_up_pool',
  arguments: { count: 3 }
});

// Monitor pool efficiency
const poolStats = await mcpClient.call('tools/call', {
  name: 'performance_get_pool_stats',
  arguments: {}
});
```

2. **Reduce Export Quality**:
```javascript
// Use lower resolution for faster exports
await mcpClient.call('tools/call', {
  name: 'geogebra_export_png',
  arguments: { scale: 1 }  // Reduced from default 2
});
```

3. **Simplify Constructions**:
```javascript
// Avoid complex constructions in tight loops
// Use batch operations when possible
// Clear unnecessary objects periodically
```

### Memory Usage Issues

**Problem**: High memory consumption or memory leaks
```
Error: Cannot create GeoGebra instance - insufficient memory
```

**Solutions**:

1. **Monitor Memory Usage**:
```bash
# Check system memory
top -p $(pgrep node)

# Check Node.js memory
node --max-old-space-size=4096 dist/index.js
```

2. **Optimize Pool Size**:
```env
# Reduce instance pool size
INSTANCE_POOL_SIZE=1
MAX_INSTANCES=2
```

3. **Force Garbage Collection**:
```javascript
// Periodic cleanup
setInterval(() => {
  if (global.gc) {
    global.gc();
  }
}, 300000); // Every 5 minutes
```

---

## 🎓 Educational Tool Issues

### Template Loading Failures

**Problem**: Educational templates fail to load
```
Error: Educational template not found: 'basic-triangle-properties'
```

**Solutions**:

1. **List Available Templates**:
```javascript
const templates = await mcpClient.call('tools/call', {
  name: 'geogebra_list_educational_templates',
  arguments: {}
});

console.log('Available templates:', JSON.parse(templates.content[0].text));
```

2. **Check Template Registration**:
```bash
# Verify templates are initialized
grep -r "templateRegistry.register" src/
```

3. **Template Dependencies**:
```javascript
// Ensure dependencies are loaded
import { initializeEducationalTemplates } from './tools/educational-templates';
initializeEducationalTemplates();
```

### Lesson Plan Generation Issues

**Problem**: Lesson plans are incomplete or inappropriate
```
Error: No suitable templates found for grade level
```

**Solutions**:

1. **Verify Grade Level Format**:
```javascript
// Correct grade level formats
'6-8'    // ✓ Middle school
'9-12'   // ✓ High school  
'college' // ✓ College level

// Incorrect formats
'grade 8'     // ✗
'high school' // ✗
'K-12'        // ✗
```

2. **Fallback to Manual Selection**:
```javascript
// Specify templates manually
await mcpClient.call('tools/call', {
  name: 'geogebra_create_lesson_plan',
  arguments: {
    topic: 'Geometry',
    gradeLevel: '9-12',
    duration: 45,
    templateIds: ['basic-triangle-properties', 'polygon-area-calculator']
  }
});
```

---

## 🔍 Advanced Debugging

### Enable Debug Logging

```bash
# Maximum logging detail
export LOG_LEVEL=debug
export NODE_ENV=development
npm run dev

# Log to file
npm run dev 2>&1 | tee debug.log
```

### Memory Profiling

```bash
# Run with memory profiling
node --inspect --max-old-space-size=4096 dist/index.js

# Use Chrome DevTools for memory analysis
# Open chrome://inspect in Chrome browser
```

### Performance Profiling

```javascript
// Add performance timing to custom tools
const startTime = performance.now();
// ... your operation
const endTime = performance.now();
console.log(`Operation took ${endTime - startTime} milliseconds`);
```

### Network Debugging

```bash
# Monitor network traffic (Linux)
sudo netstat -tulpn | grep :3000

# Check file descriptors
lsof -p $(pgrep node)

# Monitor system calls
strace -p $(pgrep node) -e trace=network
```

---

## 📞 Getting Additional Help

### Collect Diagnostic Information

When reporting issues, include:

```bash
# System information
node --version
npm --version
uname -a  # Linux/macOS
systeminfo  # Windows

# Application logs
tail -100 logs/server.log

# Performance stats
curl -X POST http://localhost:3000 \
  -d '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"performance_get_stats"},"id":1}'

# Memory usage
ps aux | grep node
```

### Log Collection Script

```bash
#!/bin/bash
# collect-debug-info.sh

echo "=== System Info ===" > debug-report.txt
node --version >> debug-report.txt
npm --version >> debug-report.txt
uname -a >> debug-report.txt

echo -e "\n=== Server Logs ===" >> debug-report.txt
tail -100 logs/server.log >> debug-report.txt 2>/dev/null

echo -e "\n=== Performance Stats ===" >> debug-report.txt
npm run test:performance >> debug-report.txt 2>&1

echo "Debug information collected in debug-report.txt"
```

### Community Resources

- **GitHub Issues**: Report bugs and feature requests
- **Discussions**: Ask questions and share solutions  
- **Documentation**: Check latest docs for updates
- **Examples**: Browse working code examples

---

## 🔄 Recovery Procedures

### Complete Reset

If all else fails, perform a complete reset:

```bash
# 1. Stop all processes
pkill -f "node.*gebrai"

# 2. Clean installation
rm -rf node_modules package-lock.json
npm cache clean --force
npm install

# 3. Reset configuration
cp .env.example .env

# 4. Clear performance metrics
rm -rf logs/ tmp/

# 5. Rebuild and test
npm run build
npm test

# 6. Start fresh
npm run dev
```

### Backup and Restore

```bash
# Backup current state
tar -czf gebrai-backup-$(date +%Y%m%d).tar.gz \
  --exclude=node_modules \
  --exclude=dist \
  .

# Restore from backup
tar -xzf gebrai-backup-20241215.tar.gz
npm install
npm run build
```

---

**Remember**: Most issues can be resolved by checking logs, verifying configuration, and ensuring all dependencies are properly installed. When in doubt, start with the health check script and work through the diagnostic steps systematically. 