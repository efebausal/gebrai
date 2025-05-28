/**
 * Model Context Protocol (MCP) Types
 * Following JSON-RPC 2.0 specification
 */

// JSON-RPC 2.0 Base Types
export interface JsonRpcRequest {
  jsonrpc: '2.0';
  method: string;
  params?: Record<string, unknown> | unknown[];
  id?: string | number | null;
}

export interface JsonRpcResponse {
  jsonrpc: '2.0';
  result?: unknown;
  error?: JsonRpcError;
  id: string | number | null;
}

export interface JsonRpcError {
  code: number;
  message: string;
  data?: unknown;
}

// MCP Protocol - Initialize
export interface McpInitializeRequest extends JsonRpcRequest {
  method: 'initialize';
  params: {
    protocolVersion: string;
    capabilities: {
      tools?: {};
      [key: string]: unknown;
    };
    clientInfo: {
      name: string;
      version: string;
    };
  };
}

export interface McpInitializeResponse extends JsonRpcResponse {
  result?: {
    protocolVersion: string;
    capabilities: {
      tools?: {
        listChanged?: boolean;
      };
      [key: string]: unknown;
    };
    serverInfo: {
      name: string;
      version: string;
    };
  };
  error?: JsonRpcError;
}

// MCP Protocol - Initialized Notification
export interface McpInitializedNotification extends JsonRpcRequest {
  method: 'notifications/initialized';
  params?: Record<string, never>;
}

// MCP Specific Types
export interface McpTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
    [key: string]: unknown; // Allow additional JSON Schema properties
  };
}

export interface McpToolsListRequest extends JsonRpcRequest {
  method: 'tools/list';
  params?: Record<string, never>;
}

export interface McpToolsListResponse extends JsonRpcResponse {
  result?: {
    tools: McpTool[];
  };
  error?: JsonRpcError;
}

export interface McpToolCallRequest extends JsonRpcRequest {
  method: 'tools/call';
  params: {
    name: string;
    arguments?: Record<string, unknown>;
  };
}

export interface McpToolCallResponse extends JsonRpcResponse {
  result?: {
    content: Array<{
      type: 'text' | 'image' | 'resource';
      text?: string;
      data?: string;
      mimeType?: string;
    }>;
    isError?: boolean;
  };
  error?: JsonRpcError;
}

// Error Codes (following JSON-RPC 2.0 and MCP conventions)
export enum McpErrorCode {
  ParseError = -32700,
  InvalidRequest = -32600,
  MethodNotFound = -32601,
  InvalidParams = -32602,
  InternalError = -32603,
  ToolNotFound = -32000,
  ToolExecutionError = -32001,
}

// Server Configuration
export interface McpServerConfig {
  name: string;
  version: string;
  description: string;
  logLevel?: 'error' | 'warn' | 'info' | 'debug';
}

// Tool Registry Types
export type ToolHandler = (params: Record<string, unknown>) => Promise<NonNullable<McpToolCallResponse['result']>>;

export interface ToolDefinition {
  tool: McpTool;
  handler: ToolHandler;
} 