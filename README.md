# GeoGebra MCP Tool

A Model Context Protocol (MCP) server that enables AI models to interact with GeoGebra's mathematical software suite for creating interactive mathematical visualizations and dynamic constructions.

## 🎯 Overview

The GeoGebra MCP Tool bridges the gap between AI reasoning capabilities and mathematical visualization, allowing AI assistants to:

- Create geometric constructions (points, lines, circles, polygons)
- Plot mathematical functions and graphs
- Perform algebraic computations with visual representation
- Generate interactive mathematical demonstrations
- Export visualizations in various formats

## 🚀 Quick Start

### Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd gebrai
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

4. Start the server:
```bash
npm start
```

### Development Mode

For development with hot reload:

```bash
npm run dev
```

## 🛠️ Development

### Project Structure

```
gebrai/
├── src/
│   ├── index.ts          # Main entry point
│   ├── server.ts         # MCP server implementation
│   ├── types/
│   │   └── mcp.ts        # MCP protocol types
│   ├── tools/
│   │   └── index.ts      # Tool registry and example tools
│   └── utils/
│       ├── logger.ts     # Logging utility
│       └── errors.ts     # Error handling
├── tests/
│   ├── setup.ts          # Test configuration
│   └── server.test.ts    # Server tests
├── package.json
├── tsconfig.json
└── README.md
```

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build the TypeScript project
- `npm start` - Start the production server
- `npm test` - Run the test suite
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues automatically

### Testing

The project includes a comprehensive test suite using Jest:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## 📡 MCP Protocol

The server implements the Model Context Protocol (MCP) following JSON-RPC 2.0 specification.

### Supported Methods

#### `tools/list`

Returns a list of available tools.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "tools/list",
  "id": 1
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "tools": [
      {
        "name": "ping",
        "description": "Simple ping tool that returns pong",
        "inputSchema": {
          "type": "object",
          "properties": {},
          "required": []
        }
      }
    ]
  }
}
```

#### `tools/call`

Executes a specific tool with given parameters.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "echo",
    "arguments": {
      "message": "Hello, MCP!"
    }
  },
  "id": 2
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Echo: Hello, MCP!"
      }
    ]
  }
}
```

### Example Tools

The server includes several example tools for testing:

- **ping**: Simple connectivity test
- **echo**: Echo back a provided message
- **server_info**: Get server status and information

## 🔧 Configuration

### Environment Variables

- `PORT` - Server port (default: 3000)
- `LOG_LEVEL` - Logging level: error, warn, info, debug (default: info)
- `NODE_ENV` - Environment: development, production, test

### Example `.env` file

```env
PORT=3000
LOG_LEVEL=info
NODE_ENV=development
```

## 🏗️ Architecture

### Core Components

1. **MCP Server** (`src/server.ts`)
   - Handles JSON-RPC 2.0 protocol
   - Routes requests to appropriate handlers
   - Manages server lifecycle

2. **Tool Registry** (`src/tools/index.ts`)
   - Manages available tools
   - Handles tool execution
   - Provides tool discovery

3. **Error Handling** (`src/utils/errors.ts`)
   - Standardized error responses
   - JSON-RPC error codes
   - Comprehensive error logging

4. **Logging** (`src/utils/logger.ts`)
   - Structured logging with Winston
   - Configurable log levels
   - Development and production modes

### Design Principles

- **Type Safety**: Full TypeScript implementation with strict mode
- **Error Handling**: Comprehensive error handling and validation
- **Modularity**: Clean separation of concerns
- **Testability**: Extensive test coverage
- **Extensibility**: Easy to add new tools and features

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-tool`
3. Make your changes and add tests
4. Ensure all tests pass: `npm test`
5. Commit your changes: `git commit -m 'Add new tool'`
6. Push to the branch: `git push origin feature/new-tool`
7. Submit a pull request

### Development Guidelines

- Follow TypeScript best practices
- Add tests for new functionality
- Update documentation as needed
- Use conventional commit messages
- Ensure code passes linting

## 🔗 Related Projects

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [GeoGebra](https://www.geogebra.org/)
- [JSON-RPC 2.0 Specification](https://www.jsonrpc.org/specification)

## 📞 Support

For questions, issues, or contributions, please:

1. Check the [Issues](https://github.com/your-repo/issues) page
2. Create a new issue if needed
3. Join our community discussions

---
