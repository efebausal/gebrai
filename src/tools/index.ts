import { McpTool, ToolDefinition } from '../types/mcp';
import { errors } from '../utils/errors';
import logger from '../utils/logger';
import { geogebraTools } from './geogebra-tools';
import { educationalTemplateTools } from './educational-templates';

/**
 * Tool Registry for managing MCP tools
 */
export class ToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map();

  /**
   * Register a new tool
   */
  register(definition: ToolDefinition): void {
    this.tools.set(definition.tool.name, definition);
    logger.info(`Registered tool: ${definition.tool.name}`);
  }

  /**
   * Get all registered tools
   */
  getTools(): McpTool[] {
    return Array.from(this.tools.values()).map(def => def.tool);
  }

  /**
   * Get a specific tool by name
   */
  getTool(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  /**
   * Execute a tool by name with given parameters
   */
  async executeTool(name: string, params: Record<string, unknown> = {}) {
    const toolDef = this.tools.get(name);
    
    if (!toolDef) {
      throw errors.toolNotFound(name);
    }

    try {
      logger.info(`Executing tool: ${name}`, { params });
      const result = await toolDef.handler(params);
      logger.info(`Tool execution completed: ${name}`);
      return result;
    } catch (error) {
      logger.error(`Tool execution failed: ${name}`, error);
      throw errors.toolExecutionError(name, error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Check if a tool exists
   */
  hasTool(name: string): boolean {
    return this.tools.has(name);
  }

  /**
   * Get the number of registered tools
   */
  getToolCount(): number {
    return this.tools.size;
  }
}

// Create global tool registry instance
export const toolRegistry = new ToolRegistry();

// Example tools for testing and demonstration
const exampleTools: ToolDefinition[] = [
  {
    tool: {
      name: 'echo',
      description: 'Echo back the provided message',
      inputSchema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            description: 'The message to echo back'
          }
        },
        required: ['message']
      }
    },
    handler: async (params: Record<string, unknown>) => {
      const message = params['message'] as string;
      return {
        content: [{
          type: 'text' as const,
          text: `Echo: ${message}`
        }]
      };
    }
  },
  {
    tool: {
      name: 'ping',
      description: 'Simple ping tool that returns pong',
      inputSchema: {
        type: 'object',
        properties: {},
        required: []
      }
    },
    handler: async () => {
      return {
        content: [{
          type: 'text' as const,
          text: 'pong'
        }]
      };
    }
  },
  {
    tool: {
      name: 'server_info',
      description: 'Get information about the MCP server',
      inputSchema: {
        type: 'object',
        properties: {},
        required: []
      }
    },
    handler: async () => {
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            name: 'GeoGebra MCP Tool',
            version: '1.0.0',
            description: 'Model Context Protocol server for GeoGebra mathematical visualization',
            toolCount: toolRegistry.getToolCount(),
            timestamp: new Date().toISOString()
          }, null, 2)
        }]
      };
    }
  }
];

// Register example tools
exampleTools.forEach(tool => {
  toolRegistry.register(tool);
});

// Register GeoGebra tools
geogebraTools.forEach(tool => {
  toolRegistry.register(tool);
});

// Register Educational Template tools
educationalTemplateTools.forEach(tool => {
  toolRegistry.register(tool);
}); 