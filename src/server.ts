import { EventEmitter } from 'events';
import readline from 'readline';
import { 
  JsonRpcRequest, 
  JsonRpcResponse, 
  McpServerConfig,
  McpInitializeRequest,
  McpInitializeResponse,
  McpInitializedNotification,
  McpToolsListRequest,
  McpToolsListResponse,
  McpToolCallRequest,
  McpToolCallResponse
} from './types/mcp';
import { toolRegistry } from './tools';
import { handleError, validateJsonRpcRequest, errors } from './utils/errors';
import { makeGeminiCompatible, needsGeminiCompatibility } from './utils/gemini-compatibility';
import logger from './utils/logger';

// Check if we're in MCP mode (stdio communication)
// When piping input, process.stdin.isTTY is undefined, not false
const isMcpMode = !process.stdin.isTTY;

/**
 * MCP Server implementation following JSON-RPC 2.0 protocol over stdio
 */
export class McpServer extends EventEmitter {
  private config: McpServerConfig;
  private isRunning: boolean = false;
  private isInitialized: boolean = false;
  private readline: readline.Interface | undefined;

  constructor(config: McpServerConfig) {
    super();
    this.config = config;
    if (!isMcpMode) {
      logger.info('MCP Server initialized', { config });
    }
  }

  /**
   * Start the MCP server with stdio communication
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      if (!isMcpMode) {
        logger.warn('Server is already running');
      }
      return;
    }

    try {
      this.isRunning = true;
      
      // Create readline interface for stdin/stdout communication
      this.readline = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: false
      });

      // Handle incoming JSON-RPC requests from stdin
      this.readline.on('line', async (line: string) => {
        try {
          const trimmedLine = line.trim();
          if (!trimmedLine) return;

          // Parse JSON-RPC request
          const request = JSON.parse(trimmedLine);
          
          // Process the request and get response
          const response = await this.processRequest(request);
          
          // Send JSON-RPC response to stdout (only if not null - notifications don't get responses)
          if (response !== null) {
            process.stdout.write(JSON.stringify(response) + '\n');
          }
        } catch (error) {
          logger.error('Error processing stdin line', { line, error });
          
          // Send error response
          const errorResponse: JsonRpcResponse = {
            jsonrpc: '2.0',
            id: null,
            error: handleError(error)
          };
          process.stdout.write(JSON.stringify(errorResponse) + '\n');
        }
      });

      this.readline.on('close', () => {
        if (!isMcpMode) {
          logger.info('Stdin closed, shutting down server');
        }
        this.stop();
      });

      if (!isMcpMode) {
        logger.info(`MCP Server started: ${this.config.name} v${this.config.version}`);
        logger.info(`Available tools: ${toolRegistry.getToolCount()}`);
        logger.info('Listening for JSON-RPC requests on stdin...');
      }
      
      this.emit('started');
    } catch (error) {
      this.isRunning = false;
      logger.error('Failed to start MCP server', error);
      throw error;
    }
  }

  /**
   * Stop the MCP server
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      if (!isMcpMode) {
        logger.warn('Server is not running');
      }
      return;
    }

    try {
      this.isRunning = false;
      
      if (this.readline) {
        this.readline.close();
        this.readline = undefined;
      }
      
      if (!isMcpMode) {
        logger.info('MCP Server stopped');
      }
      this.emit('stopped');
    } catch (error) {
      logger.error('Error stopping MCP server', error);
      throw error;
    }
  }

  /**
   * Process a JSON-RPC request
   */
  async processRequest(requestData: unknown): Promise<JsonRpcResponse | null> {
    try {
      // Validate basic JSON-RPC structure
      if (!validateJsonRpcRequest(requestData)) {
        return this.createErrorResponse(null, handleError(errors.invalidRequest()));
      }

      const request = requestData as JsonRpcRequest;
      logger.debug('Processing request', { method: request.method, id: request.id });

      // Route to appropriate handler
      switch (request.method) {
        case 'initialize':
          return await this.handleInitialize(request as McpInitializeRequest);
        
        case 'notifications/initialized':
          return await this.handleInitialized(request as McpInitializedNotification);
        
        case 'tools/list':
          return await this.handleToolsList(request as McpToolsListRequest);
        
        case 'tools/call':
          return await this.handleToolsCall(request as McpToolCallRequest);
        
        default:
          return this.createErrorResponse(
            request.id ?? null,
            handleError(errors.methodNotFound(request.method))
          );
      }
    } catch (error) {
      logger.error('Error processing request', error);
      return this.createErrorResponse(null, handleError(error));
    }
  }

  /**
   * Handle initialize requests
   */
  private async handleInitialize(request: McpInitializeRequest): Promise<McpInitializeResponse> {
    try {
      logger.debug('Handling initialize request', { clientInfo: request.params?.clientInfo });

      // Validate protocol version compatibility
      const requestedVersion = request.params?.protocolVersion;
      const supportedVersion = '2024-11-05';
      
      if (requestedVersion !== supportedVersion) {
        logger.warn(`Client requested protocol version ${requestedVersion}, server supports ${supportedVersion}`);
      }

      this.isInitialized = true;

      return {
        jsonrpc: '2.0',
        id: request.id ?? null,
        result: {
          protocolVersion: supportedVersion,
          capabilities: {
            tools: {
              listChanged: false
            }
          },
          serverInfo: {
            name: this.config.name,
            version: this.config.version
          }
        }
      };
    } catch (error) {
      logger.error('Error handling initialize', error);
      return this.createInitializeErrorResponse(request.id ?? null, handleError(error));
    }
  }

  /**
   * Handle notifications/initialized requests (notification, no response expected)
   */
  private async handleInitialized(_request: McpInitializedNotification): Promise<JsonRpcResponse | null> {
    try {
      logger.debug('Client initialization complete');
      
      // For notifications, we don't send a response
      return null;
    } catch (error) {
      logger.error('Error handling initialized notification', error);
      // Even for errors in notifications, we typically don't send responses
      return null;
    }
  }

  /**
   * Handle tools/list requests
   */
  private async handleToolsList(request: McpToolsListRequest): Promise<McpToolsListResponse> {
    try {
      // Check if server is initialized
      if (!this.isInitialized) {
        return this.createToolsListErrorResponse(
          request.id ?? null,
          handleError(errors.invalidRequest('Server not initialized'))
        );
      }

      const rawTools = toolRegistry.getTools();
      
      // Apply Gemini compatibility transformations to tool schemas
      const tools = rawTools.map(tool => {
        // Check if the tool schema needs Gemini compatibility fixes
        if (needsGeminiCompatibility(tool.inputSchema)) {
          logger.debug(`Applying Gemini compatibility fixes to tool: ${tool.name}`);
          
          return {
            ...tool,
            inputSchema: makeGeminiCompatible(tool.inputSchema)
          };
        }
        
        return tool;
      });
      
      logger.debug(`Returning ${tools.length} tools (with Gemini compatibility applied)`);

      return {
        jsonrpc: '2.0',
        id: request.id ?? null,
        result: {
          tools
        }
      };
    } catch (error) {
      logger.error('Error handling tools/list', error);
      return this.createToolsListErrorResponse(request.id ?? null, handleError(error));
    }
  }

  /**
   * Handle tools/call requests
   */
  private async handleToolsCall(request: McpToolCallRequest): Promise<McpToolCallResponse> {
    try {
      // Check if server is initialized
      if (!this.isInitialized) {
        return this.createToolsCallErrorResponse(
          request.id ?? null,
          handleError(errors.invalidRequest('Server not initialized'))
        );
      }

      // Validate request parameters
      if (!request.params || typeof request.params.name !== 'string') {
        return this.createToolsCallErrorResponse(
          request.id ?? null,
          handleError(errors.invalidParams('Missing or invalid tool name'))
        );
      }

      const { name, arguments: toolArgs = {} } = request.params;
      
      // Execute the tool
      const result = await toolRegistry.executeTool(name, toolArgs);

      return {
        jsonrpc: '2.0',
        id: request.id ?? null,
        result
      };
    } catch (error) {
      logger.error('Error handling tools/call', error);
      return this.createToolsCallErrorResponse(request.id ?? null, handleError(error));
    }
  }

  /**
   * Create an error response
   */
  private createErrorResponse(id: string | number | null, error: ReturnType<typeof handleError>): JsonRpcResponse {
    return {
      jsonrpc: '2.0',
      id,
      error
    };
  }

  /**
   * Create a tools/list error response
   */
  private createToolsListErrorResponse(id: string | number | null, error: ReturnType<typeof handleError>): McpToolsListResponse {
    return {
      jsonrpc: '2.0',
      id,
      error
    };
  }

  /**
   * Create a tools/call error response
   */
  private createToolsCallErrorResponse(id: string | number | null, error: ReturnType<typeof handleError>): McpToolCallResponse {
    return {
      jsonrpc: '2.0',
      id,
      error
    };
  }

  /**
   * Create an initialize error response
   */
  private createInitializeErrorResponse(id: string | number | null, error: ReturnType<typeof handleError>): McpInitializeResponse {
    return {
      jsonrpc: '2.0',
      id,
      error
    };
  }

  /**
   * Get server status
   */
  getStatus() {
    return {
      name: this.config.name,
      version: this.config.version,
      description: this.config.description,
      isRunning: this.isRunning,
      toolCount: toolRegistry.getToolCount(),
      uptime: this.isRunning ? process.uptime() : 0
    };
  }

  /**
   * Get server configuration
   */
  getConfig(): McpServerConfig {
    return { ...this.config };
  }

  /**
   * Check if server is running
   */
  isServerRunning(): boolean {
    return this.isRunning;
  }
} 