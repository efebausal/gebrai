import winston from 'winston';

interface LogInfo {
  timestamp: string;
  level: string;
  message: string;
  stack?: string;
  [key: string]: unknown;
}

// Check if we're in MCP mode (stdio communication)
// When piping input, process.stdin.isTTY is undefined, not false
const isMcpMode = !process.stdin.isTTY;

// Create logger instance
const logger = winston.createLogger({
  level: isMcpMode ? 'error' : (process.env['LOG_LEVEL'] || 'info'),
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.printf((info) => {
      const { timestamp, level, message, stack, ...meta } = info as unknown as LogInfo;
      let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
      
      if (Object.keys(meta).length > 0) {
        log += ` ${JSON.stringify(meta)}`;
      }
      
      if (stack) {
        log += `\n${stack}`;
      }
      
      return log;
    })
  ),
  defaultMeta: { service: 'geogebra-mcp-server' },
  transports: [
    // Use stderr instead of stdout to avoid interfering with MCP JSON-RPC communication
    new winston.transports.Console({
      stderrLevels: ['error', 'warn', 'info', 'debug'],
      format: winston.format.simple() // Remove colorization for MCP compatibility
    })
  ]
});

// Add file transport in production
if (process.env['NODE_ENV'] === 'production') {
  logger.add(new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error'
  }));
  
  logger.add(new winston.transports.File({
    filename: 'logs/combined.log'
  }));
}

export default logger; 