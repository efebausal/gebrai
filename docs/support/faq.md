# Frequently Asked Questions (FAQ)

Common questions and answers about the GeoGebra MCP Tool. Questions are organized by topic for easy navigation.

## 📋 Table of Contents

- [General Questions](#general)
- [Installation & Setup](#installation--setup)
- [Usage & Integration](#usage--integration)  
- [Performance & Optimization](#performance--optimization)
- [Educational Applications](#educational-applications)
- [Technical Details](#technical-details)
- [Troubleshooting](#troubleshooting)

---

## General

### What is the GeoGebra MCP Tool?

The GeoGebra MCP Tool is a Model Context Protocol (MCP) server that enables AI models to create, manipulate, and analyze mathematical constructions through GeoGebra's mathematical software. It allows AI assistants to generate interactive mathematical visualizations, solve problems graphically, and create educational content.

### What can I do with this tool?

- **Mathematical Visualization**: Create geometric constructions, plot functions, and generate mathematical diagrams
- **Educational Content**: Use pre-built educational templates for classroom activities
- **AI Integration**: Enable AI models to create visual mathematical content in real-time
- **Export Capabilities**: Generate PNG, SVG, and PDF exports of mathematical constructions
- **Interactive Learning**: Create dynamic mathematical explorations and demonstrations

### Who should use this tool?

- **Mathematics Educators**: Teachers who want AI assistance in creating visual lessons
- **Students**: Learners who need interactive mathematical problem-solving
- **AI Application Developers**: Building educational or mathematical AI applications
- **Researchers**: Academics requiring mathematical modeling and visualization
- **Tutoring Platforms**: Educational services integrating AI-powered math help

### Is this tool free to use?

Yes, the GeoGebra MCP Tool is open source and free to use. It builds upon GeoGebra's free educational software and follows the same open-source principles.

### What makes this different from using GeoGebra directly?

The key difference is **AI integration**. While GeoGebra is a powerful mathematical tool, the MCP Tool allows AI models to:
- Create mathematical constructions programmatically
- Generate educational content automatically
- Respond to natural language mathematical requests
- Integrate mathematical visualization into AI conversations

---

## Installation & Setup

### What are the system requirements?

**Minimum Requirements:**
- Node.js 18.0.0 or higher
- 4GB RAM available
- 500MB disk space
- Windows, macOS, or Linux

**Recommended for Production:**
- Node.js 20+ (latest LTS)
- 8GB+ RAM
- SSD storage
- Dedicated server environment

### How do I install the tool?

```bash
# Clone and install
git clone https://github.com/your-org/gebrai.git
cd gebrai
npm install
npm run build

# Start the server
npm start
```

See our [Getting Started Guide](../guides/getting-started.md) for detailed instructions.

### Can I run this in a Docker container?

Yes! Here's a basic Dockerfile:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### How do I integrate with Claude Desktop?

Edit your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "geogebra": {
      "command": "node",
      "args": ["/absolute/path/to/gebrai/dist/index.js"],
      "cwd": "/absolute/path/to/gebrai"
    }
  }
}
```

Restart Claude Desktop and the tools will be available.

### Can I use this with other AI platforms besides Claude?

Yes! The tool implements the standard MCP protocol, so it works with any MCP-compatible client:
- Custom applications using MCP client libraries
- Other AI platforms that support MCP
- Direct API integration via JSON-RPC

---

## Usage & Integration

### How do I create my first mathematical construction?

```javascript
// Basic triangle example
await mcpClient.call('tools/call', {
  name: 'geogebra_create_point',
  arguments: { name: 'A', x: 0, y: 0 }
});

await mcpClient.call('tools/call', {
  name: 'geogebra_create_point',
  arguments: { name: 'B', x: 3, y: 0 }
});

await mcpClient.call('tools/call', {
  name: 'geogebra_create_point',
  arguments: { name: 'C', x: 1.5, y: 2.6 }
});

// Create triangle sides
await mcpClient.call('tools/call', {
  name: 'geogebra_create_polygon',
  arguments: { vertices: ['A', 'B', 'C'] }
});
```

### What mathematical objects can I create?

The tool supports all major GeoGebra objects:
- **Points**: Coordinates, intersections, special points
- **Lines**: Lines, segments, rays, vectors  
- **Circles**: By center/radius, through points, tangent lines
- **Polygons**: Triangles, quadrilaterals, regular polygons
- **Functions**: Polynomials, trigonometric, exponential
- **Conics**: Parabolas, ellipses, hyperbolas
- **Transformations**: Reflections, rotations, translations

### How do I export mathematical constructions?

```javascript
// Export as PNG (high resolution)
const pngResult = await mcpClient.call('tools/call', {
  name: 'geogebra_export_png',
  arguments: { scale: 2 }
});

// Export as SVG (vector graphics)
const svgResult = await mcpClient.call('tools/call', {
  name: 'geogebra_export_svg',
  arguments: {}
});

// Export as PDF (for printing)
const pdfResult = await mcpClient.call('tools/call', {
  name: 'geogebra_export_pdf',
  arguments: {}
});
```

### Can I style mathematical objects?

Yes! You can customize colors, line styles, and appearance:

```javascript
await mcpClient.call('tools/call', {
  name: 'geogebra_set_object_style',
  arguments: {
    objectName: 'myFunction',
    color: '#FF6B6B',
    thickness: 3,
    style: 'SOLID'
  }
});
```

### How do I use educational templates?

```javascript
// List available templates
const templates = await mcpClient.call('tools/call', {
  name: 'geogebra_list_educational_templates',
  arguments: { category: 'geometry', gradeLevel: '9-12' }
});

// Load a specific template
await mcpClient.call('tools/call', {
  name: 'geogebra_load_educational_template',
  arguments: { templateId: 'basic-triangle-properties' }
});
```

---

## Performance & Optimization

### Why is my first request slow?

The first request initializes a GeoGebra instance, which takes time. Subsequent requests are much faster. To optimize:

```javascript
// Pre-warm instances at startup
await mcpClient.call('tools/call', {
  name: 'performance_warm_up_pool',
  arguments: { count: 2 }
});
```

### What's the expected response time?

According to our PRD requirements:
- **Basic tools**: < 100ms
- **Simple constructions**: 100-500ms  
- **Complex operations**: 500-1500ms
- **Export operations**: 800-1800ms
- **All operations**: < 2000ms (hard requirement)

### How much memory does the tool use?

- **Base server**: ~50-100MB
- **Per GeoGebra instance**: ~10-50MB
- **Typical usage**: 200-300MB total
- **Heavy usage**: 500MB-1GB

Monitor with:
```javascript
const poolStats = await mcpClient.call('tools/call', {
  name: 'performance_get_pool_stats',
  arguments: {}
});
```

### Can I run multiple instances?

Yes, the tool supports horizontal scaling:
- Run multiple server instances on different ports
- Use a load balancer to distribute requests
- Each instance maintains its own GeoGebra pool
- No shared state between instances

### How do I optimize for production?

1. **Pre-warm the pool**: Use `performance_warm_up_pool` at startup
2. **Monitor performance**: Implement `performance_get_stats` monitoring
3. **Resource limits**: Set appropriate memory limits and pool sizes
4. **Logging**: Use appropriate log levels (warn/error in production)
5. **Health checks**: Implement health endpoints for load balancers

---

## Educational Applications

### What grade levels are supported?

Educational templates cover:
- **Elementary**: 6-8 (basic geometry, fractions)
- **High School**: 9-12 (algebra, advanced geometry, calculus)
- **College**: Advanced mathematics and specialized topics

### How do I create a lesson plan?

```javascript
await mcpClient.call('tools/call', {
  name: 'geogebra_create_lesson_plan',
  arguments: {
    topic: 'Quadratic Functions',
    gradeLevel: '9-12',
    duration: 50
  }
});
```

The tool automatically selects appropriate templates and creates a structured lesson plan.

### Can I customize educational content?

Yes! Templates support customization:

```javascript
await mcpClient.call('tools/call', {
  name: 'geogebra_load_educational_template',
  arguments: {
    templateId: 'quadratic-explorer',
    customizations: {
      colors: { primary: '#FF6B6B' },
      parameters: { initialA: 2 },
      showLabels: true
    }
  }
});
```

### How do I align with curriculum standards?

Educational templates are designed with common curriculum standards in mind:
- **Common Core** alignment for US schools
- **STEM** focus with hands-on exploration
- **Inquiry-based** learning approaches
- **Multiple representation** strategies

### Can students use this directly?

While designed for teacher use, students can interact with:
- Pre-built educational templates
- Guided mathematical explorations
- Interactive problem-solving activities
- Visual learning experiences

---

## Technical Details

### What's the difference between MCP and REST APIs?

**MCP (Model Context Protocol)**:
- Designed specifically for AI integration
- Standardized tool discovery and execution
- Optimized for conversational AI interactions
- Built-in error handling and validation

**REST API**:
- General-purpose web API
- Requires custom integration work
- More flexible but more complex to implement

### How does the GeoGebra integration work?

The tool uses GeoGebra's Apps API:
1. Creates headless GeoGebra instances
2. Sends commands via `evalCommand()` method
3. Retrieves object information and state
4. Exports visual content as images/vectors

### Can I extend the tool with custom features?

Yes! The tool is designed for extensibility:

```typescript
// Add custom tools
export const customTools: ToolDefinition[] = [
  {
    tool: {
      name: 'my_custom_tool',
      description: 'My custom mathematical operation',
      inputSchema: { /* ... */ }
    },
    handler: async (params) => {
      // Your custom logic
    }
  }
];
```

### What about security considerations?

- **Local execution**: GeoGebra runs locally, no external dependencies
- **Input validation**: All parameters are validated before execution
- **Resource limits**: Memory and CPU usage are controlled
- **No file system access**: Operates in controlled environment
- **Logging**: Comprehensive audit trails available

### How do I backup and restore constructions?

```javascript
// Get current construction state
const objects = await mcpClient.call('tools/call', {
  name: 'geogebra_get_objects',
  arguments: {}
});

// Save state to file/database
const state = JSON.parse(objects.content[0].text);

// Restore construction (rebuild from saved state)
// Implementation depends on your specific needs
```

---

## Troubleshooting

### Why can't Claude see the GeoGebra tools?

Common issues:
1. **Path problems**: Use absolute paths in Claude config
2. **Permissions**: Ensure Claude can execute the tool
3. **Server not running**: Verify the MCP server starts correctly
4. **Config syntax**: Check JSON syntax in Claude config file

### Why do I get "GeoGebra instance not ready" errors?

This usually indicates:
1. **Initialization time**: Wait for instance to fully load
2. **Memory issues**: Check available system memory
3. **Headless mode**: Ensure proper display configuration
4. **Resource limits**: Verify pool size and limits

### How do I debug performance issues?

```javascript
// Enable detailed performance monitoring
const stats = await mcpClient.call('tools/call', {
  name: 'performance_get_stats',
  arguments: { operationName: 'geogebra_export_png' }
});

// Check instance pool efficiency  
const poolStats = await mcpClient.call('tools/call', {
  name: 'performance_get_pool_stats',
  arguments: {}
});
```

### Why are mathematical expressions failing?

Common syntax issues:
- Use `*` for multiplication: `2*x` not `2x`
- Use `sqrt(x)` not `√x`
- Use `abs(x)` not `|x|`
- Use proper parentheses: `sin(x)` not `sin x`

### Where can I get more help?

- **Documentation**: Check our [comprehensive docs](../README.md)
- **Troubleshooting**: See [detailed troubleshooting guide](troubleshooting.md)
- **GitHub Issues**: Report bugs and request features
- **Community**: Join discussions and share solutions
- **Examples**: Browse working code examples

---

## Still Have Questions?

If you didn't find the answer you're looking for:

1. **Search the documentation**: Use Ctrl+F to search this FAQ and other docs
2. **Check the troubleshooting guide**: See [troubleshooting.md](troubleshooting.md) for detailed solutions
3. **Browse examples**: Look at working code in the `examples/` directory
4. **Ask the community**: Open a discussion on GitHub
5. **Report issues**: Create an issue if you found a bug

---

**Last updated**: This FAQ is continuously updated based on user feedback and common support requests. Check back regularly for new information! 