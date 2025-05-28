import 'dotenv/config';
import { McpServer } from './server';
import { McpServerConfig } from './types/mcp';
import logger from './utils/logger';

/**
 * Main entry point for the GeoGebra MCP Tool server
 */
async function main() {
  try {
    // Server configuration
    const config: McpServerConfig = {
      name: 'GeoGebra MCP Tool',
      version: '1.0.0',
      description: 'Model Context Protocol server for GeoGebra mathematical visualization',
      logLevel: (process.env['LOG_LEVEL'] as 'error' | 'warn' | 'info' | 'debug') || 'info'
    };

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
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the application
if (require.main === module) {
  main().catch((error) => {
    logger.error('Application startup failed:', error);
    process.exit(1);
  });
}

export { McpServer } from './server';
export { toolRegistry } from './tools';
export * from './types/mcp'; 