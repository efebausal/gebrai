#!/usr/bin/env node

/**
 * CLI entry point for GeoGebra MCP Tool
 * Enables npx usage: npx @gebrai/gebrai
 */

/**
 * Display help information
 */
function showHelp() {
  console.log(`
GeoGebra MCP Tool - Mathematical Visualization via Model Context Protocol

Usage:
  npx @gebrai/gebrai [options]

Options:
  -h, --help        Show this help message
  -v, --version     Show version information
  --log-level LEVEL Set log level (error, warn, info, debug) [default: info]
  --port PORT       Set server port [default: from stdin/stdout for MCP]

Examples:
  npx @gebrai/gebrai                    # Start MCP server on stdin/stdout
  npx @gebrai/gebrai --log-level debug  # Start with debug logging
  npx @gebrai/gebrai --help             # Show this help

For more information, visit: https://github.com/your-org/gebrai
`);
}

/**
 * Display version information
 */
function showVersion() {
  const packageJson = require('../package.json');
  console.log(`GeoGebra MCP Tool v${packageJson.version}`);
}

/**
 * Parse command line arguments
 */
function parseArgs(args: string[]) {
  const options = {
    help: false,
    version: false,
    logLevel: process.env['LOG_LEVEL'] || 'info',
    port: process.env['PORT'] || undefined
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    // Type guard to ensure arg is defined
    if (!arg) continue;
    
    switch (arg) {
      case '-h':
      case '--help':
        options.help = true;
        break;
      
      case '-v':
      case '--version':
        options.version = true;
        break;
      
      case '--log-level':
        if (i + 1 < args.length && args[i + 1]) {
          const level = args[i + 1]!; // Non-null assertion since we checked above
          if (['error', 'warn', 'info', 'debug'].includes(level)) {
            options.logLevel = level;
            i++; // Skip next argument
          } else {
            console.error(`Invalid log level: ${level}`);
            process.exit(1);
          }
        } else {
          console.error('--log-level requires a value');
          process.exit(1);
        }
        break;
      
      case '--port':
        if (i + 1 < args.length && args[i + 1]) {
          options.port = args[i + 1]!; // Non-null assertion since we checked above
          i++; // Skip next argument
        } else {
          console.error('--port requires a value');
          process.exit(1);
        }
        break;
      
      default:
        if (arg.startsWith('-')) {
          console.error(`Unknown option: ${arg}`);
          console.error('Use --help for usage information');
          process.exit(1);
        }
        break;
    }
  }

  return options;
}

/**
 * Main CLI function
 */
async function main() {
  try {
    // Parse command line arguments first
    const args = process.argv.slice(2);
    const options = parseArgs(args);

    // Handle help and version BEFORE loading any dependencies
    if (options.help) {
      showHelp();
      process.exit(0);
    }

    if (options.version) {
      showVersion();
      process.exit(0);
    }

    // Only import heavy dependencies if we're actually starting the server
    await import('dotenv/config');
    const { McpServer } = await import('./server');
    const { default: logger } = await import('./utils/logger');

    // Server configuration
    const config = {
      name: 'GeoGebra MCP Tool',
      version: '1.0.0',
      description: 'Model Context Protocol server for GeoGebra mathematical visualization',
      logLevel: options.logLevel as 'error' | 'warn' | 'info' | 'debug'
    };

    logger.info('Starting GeoGebra MCP Tool...');
    logger.info(`Log level: ${config.logLevel}`);

    // Create and start the MCP server
    const server = new McpServer(config);

    // Set up graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully...`);
      try {
        await server.stop();
        process.exit(0);
      } catch (error) {
        logger.error('Error during shutdown:', error);
        process.exit(1);
      }
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });

    // Start the server
    await server.start();

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the CLI application
main().catch((error) => {
  console.error('CLI startup failed:', error);
  process.exit(1);
}); 