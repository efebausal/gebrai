# Getting Started with GeoGebra MCP Tool

Welcome to the GeoGebra MCP Tool! This guide will take you from installation to creating your first mathematical visualizations using the Model Context Protocol.

## 🎯 What You'll Learn

By the end of this guide, you'll be able to:
- Install and configure the GeoGebra MCP Tool
- Connect the tool to AI platforms like Claude
- Create basic mathematical constructions
- Export mathematical visualizations
- Understand the tool architecture and capabilities

## 📋 Prerequisites

### System Requirements
- **Node.js**: Version 18.0.0 or higher
- **npm**: Latest version (comes with Node.js)
- **Operating System**: Windows, macOS, or Linux
- **Memory**: At least 4GB RAM available
- **Disk Space**: 500MB for installation and dependencies

### Knowledge Requirements
- Basic command line usage
- Understanding of JSON and REST APIs (helpful but not required)
- Familiarity with mathematical concepts (for meaningful usage)

## 🚀 Quick Installation

### Step 1: Clone and Install

```bash
# Clone the repository
git clone https://github.com/your-org/gebrai.git
cd gebrai

# Install dependencies
npm install

# Build the project
npm run build
```

### Step 2: Environment Setup

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit the `.env` file with your preferences:

```env
# Server Configuration
PORT=3000
LOG_LEVEL=info
NODE_ENV=development

# GeoGebra Configuration  
GEOGEBRA_APP_NAME=classic
GEOGEBRA_WIDTH=800
GEOGEBRA_HEIGHT=600

# Performance Configuration
INSTANCE_POOL_SIZE=2
RESPONSE_TIMEOUT=30000
```

### Step 3: Start the Server

```bash
# Development mode with hot reload
npm run dev

# Or production mode
npm start
```

You should see output like:
```
[INFO] GeoGebra MCP Tool starting...
[INFO] Registered tool: ping
[INFO] Registered tool: geogebra_create_point
[INFO] MCP server listening on stdio
[INFO] Server ready - 42 tools available
```

## 🔗 Connecting to AI Platforms

### Claude Integration

The easiest way to use the GeoGebra MCP Tool is through Claude Desktop:

1. **Install Claude Desktop** (if not already installed)
2. **Configure MCP in Claude**:

Edit your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "geogebra": {
      "command": "node",
      "args": ["/path/to/gebrai/dist/index.js"],
      "cwd": "/path/to/gebrai"
    }
  }
}
```

3. **Restart Claude Desktop**
4. **Test the connection** by asking Claude to use a GeoGebra tool

### Manual MCP Client

For developers who want direct control:

```javascript
import { MCPClient } from '@modelcontextprotocol/client';
import { ChildProcessTransport } from '@modelcontextprotocol/client-transport-childprocess';

// Create MCP client
const client = new MCPClient({
  name: "geogebra-client",
  version: "1.0.0"
});

// Connect to server
const transport = new ChildProcessTransport({
  command: 'node',
  args: ['./dist/index.js'],
  cwd: './gebrai'
});

await client.connect(transport);

// List available tools
const tools = await client.call('tools/list');
console.log('Available tools:', tools.result.tools.length);
```

## 🧪 Your First Mathematical Construction

Let's create your first mathematical visualization step by step.

### Example 1: Creating a Simple Triangle

```javascript
// Step 1: Test connectivity
const pingResult = await client.call('tools/call', {
  name: 'ping',
  arguments: {}
});
console.log('Server response:', pingResult.result.content[0].text); // "pong"

// Step 2: Clear any existing construction
await client.call('tools/call', {
  name: 'geogebra_clear_construction',
  arguments: {}
});

// Step 3: Create three points
await client.call('tools/call', {
  name: 'geogebra_create_point',
  arguments: { name: 'A', x: 0, y: 0 }
});

await client.call('tools/call', {
  name: 'geogebra_create_point', 
  arguments: { name: 'B', x: 3, y: 0 }
});

await client.call('tools/call', {
  name: 'geogebra_create_point',
  arguments: { name: 'C', x: 1.5, y: 2.6 }
});

// Step 4: Create the triangle sides
await client.call('tools/call', {
  name: 'geogebra_create_line_segment',
  arguments: { name: 'AB', point1: 'A', point2: 'B' }
});

await client.call('tools/call', {
  name: 'geogebra_create_line_segment',
  arguments: { name: 'BC', point1: 'B', point2: 'C' }
});

await client.call('tools/call', {
  name: 'geogebra_create_line_segment',
  arguments: { name: 'CA', point1: 'C', point2: 'A' }
});

// Step 5: Export as PNG
const exportResult = await client.call('tools/call', {
  name: 'geogebra_export_png',
  arguments: { scale: 2 }
});

const imageData = JSON.parse(exportResult.result.content[0].text);
console.log('Triangle created! Image size:', imageData.dimensions);
```

### Example 2: Plotting a Function

```javascript
// Clear construction
await client.call('tools/call', {
  name: 'geogebra_clear_construction',
  arguments: {}
});

// Create a quadratic function
await client.call('tools/call', {
  name: 'geogebra_create_function',
  arguments: {
    name: 'f',
    expression: 'x^2 - 2*x + 1',
    domain: { min: -3, max: 5 }
  }
});

// Style the function
await client.call('tools/call', {
  name: 'geogebra_set_object_style',
  arguments: {
    objectName: 'f',
    color: '#FF6B6B',
    thickness: 3,
    style: 'SOLID'
  }
});

// Add axis labels
await client.call('tools/call', {
  name: 'geogebra_set_axes_labels',
  arguments: {
    xLabel: 'x',
    yLabel: 'f(x) = x² - 2x + 1'
  }
});

// Export the graph
const result = await client.call('tools/call', {
  name: 'geogebra_export_svg',
  arguments: {}
});

const svgData = JSON.parse(result.result.content[0].text);
console.log('Function plotted successfully!');
```

## 🎓 Using Educational Templates

The tool includes pre-built educational activities:

```javascript
// List available templates for high school geometry
const templatesResult = await client.call('tools/call', {
  name: 'geogebra_list_educational_templates',
  arguments: {
    category: 'geometry',
    gradeLevel: '9-12'
  }
});

const templates = JSON.parse(templatesResult.result.content[0].text);
console.log(`Found ${templates.count} geometry templates`);

// Load a triangle properties template
const loadResult = await client.call('tools/call', {
  name: 'geogebra_load_educational_template',
  arguments: {
    templateId: 'basic-triangle-properties'
  }
});

const activity = JSON.parse(loadResult.result.content[0].text);
console.log(`Loaded: ${activity.template.name}`);
console.log('Learning objectives:');
activity.objectives.forEach(obj => console.log(`- ${obj}`));
```

## 📊 Performance Optimization

For production usage, optimize performance:

```javascript
// Warm up the instance pool at startup
await client.call('tools/call', {
  name: 'performance_warm_up_pool',
  arguments: { count: 2 }
});

// Monitor performance
const statsResult = await client.call('tools/call', {
  name: 'performance_get_stats',
  arguments: {}
});

const stats = JSON.parse(statsResult.result.content[0].text);
console.log(`Performance status: ${stats.summary.performanceStatus}`);
console.log(`Average response time: ${stats.summary.averageResponseTime}`);
```

## 🛠️ Development Workflow

### Project Structure Understanding

```
gebrai/
├── src/
│   ├── index.ts          # Main entry point
│   ├── server.ts         # MCP server implementation
│   ├── tools/
│   │   ├── index.ts      # Tool registry
│   │   ├── geogebra-tools.ts      # Core mathematical tools
│   │   ├── educational-templates.ts  # Educational activities
│   │   └── performance-tools.ts    # Performance monitoring
│   ├── utils/
│   │   ├── geogebra-instance.ts   # GeoGebra interface
│   │   └── validation.ts          # Parameter validation
│   └── types/
│       └── mcp.ts        # Type definitions
├── tests/                # Test suites
├── docs/                 # Documentation
└── examples/             # Example code
```

### Development Commands

```bash
# Development with hot reload
npm run dev

# Run tests
npm test
npm run test:watch    # Watch mode
npm run test:coverage # With coverage

# Code quality
npm run lint          # Check linting
npm run lint:fix      # Fix linting issues

# Build and deploy
npm run build         # Production build
npm start            # Run production build
```

### Adding Custom Tools

Create your own mathematical tools:

```typescript
// src/tools/custom-tools.ts
import { ToolDefinition } from '../types/mcp';

export const customTools: ToolDefinition[] = [
  {
    tool: {
      name: 'my_custom_construction',
      description: 'Create a custom mathematical construction',
      inputSchema: {
        type: 'object',
        properties: {
          size: {
            type: 'number',
            description: 'Size parameter for the construction'
          }
        },
        required: ['size']
      }
    },
    handler: async (params) => {
      const size = params['size'] as number;
      
      // Your custom logic here
      // Use GeoGebra instance to create constructions
      
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            success: true,
            message: `Custom construction created with size ${size}`
          })
        }]
      };
    }
  }
];

// Register your tools in src/tools/index.ts
import { customTools } from './custom-tools';
customTools.forEach(tool => toolRegistry.register(tool));
```

## 🔍 Debugging and Troubleshooting

### Enable Detailed Logging

```bash
# Set log level to debug
export LOG_LEVEL=debug
npm run dev
```

### Common Issues and Solutions

#### 1. Connection Issues
```bash
# Check if server is running
curl http://localhost:3000/health

# Check MCP protocol communication
npm run test:integration
```

#### 2. Performance Issues
```javascript
// Check instance pool status
const poolStats = await client.call('tools/call', {
  name: 'performance_get_pool_stats',
  arguments: {}
});

console.log('Pool status:', JSON.parse(poolStats.result.content[0].text));
```

#### 3. Mathematical Construction Errors
```javascript
// Get detailed object information
const objectInfo = await client.call('tools/call', {
  name: 'geogebra_get_objects',
  arguments: {}
});

console.log('Current objects:', JSON.parse(objectInfo.result.content[0].text));
```

## 📚 Next Steps

Now that you have the basics working:

1. **Explore More Tools**: Browse the [API Reference](../api/README.md) for all available tools
2. **Try Advanced Examples**: Check out [tutorials](../tutorials/) for complex mathematical constructions  
3. **Educational Use**: Review [Educational Resources](../educational/) for classroom applications
4. **Performance Tuning**: Read the [Performance Guide](../support/performance.md) for optimization
5. **Integration**: See [Integration Guide](integration-guide.md) for connecting to other platforms

## 🆘 Getting Help

- **Documentation**: Check our comprehensive [docs](../README.md)
- **Troubleshooting**: See [common issues](../support/troubleshooting.md)
- **FAQ**: Browse [frequently asked questions](../support/faq.md) 
- **Community**: Join discussions on GitHub Issues
- **Support**: Contact support for technical issues

## 🎉 Success!

You're now ready to create interactive mathematical visualizations with AI! The GeoGebra MCP Tool opens up powerful possibilities for mathematical exploration, education, and research.

Start experimenting with different mathematical constructions and discover how AI can enhance mathematical understanding through visualization.

---

**Next**: Try the [Basic Usage Tutorial](../tutorials/basic-usage.md) for more hands-on examples. 