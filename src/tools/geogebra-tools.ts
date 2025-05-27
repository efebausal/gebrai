import { ToolDefinition } from '../types/mcp';
// import { MockGeoGebraInstance } from '../utils/geogebra-mock'; // Mock implementation for testing
import { GeoGebraInstance } from '../utils/geogebra-instance'; // Real implementation (production)
import logger from '../utils/logger';
import { 
  validateObjectName, 
  validateCoordinates, 
  validateRadius, 
  validatePolygonVertices, 
  validateLinearEquation,
  validateFunctionExpression,
  validateParametricExpressions,
  validateImplicitExpression,
  validateDomainRange,
  validateFunctionStyling,
  validateAlgebraicExpression,
  validateEquation,
  validateVariableName,
  validateSystemOfEquations,
  validateVariablesList,
  validateSliderParameters,
  validateAnimationSpeed,
  validateAnimationDirection,
  validateAnimationExportParameters
} from '../utils/validation';

// Global instance pool for managing GeoGebra instances
class GeoGebraInstancePool {
  private instances: Map<string, GeoGebraInstance> = new Map();
  private defaultInstance: GeoGebraInstance | undefined;

  async getDefaultInstance(): Promise<GeoGebraInstance> {
    if (!this.defaultInstance) {
      this.defaultInstance = new GeoGebraInstance({
        appName: 'classic', // Use classic app for full functionality (from GEB-12 fixes)
        width: 800,
        height: 600,
        showMenuBar: false,
        showToolBar: false,
        showAlgebraInput: false
      });
      
      try {
        await this.defaultInstance.initialize(true); // Initialize in headless mode for production
        logger.info('Default Real GeoGebra instance initialized');
      } catch (error) {
        logger.error('Failed to initialize default GeoGebra instance', error);
        throw error;
      }
    }
    
    return this.defaultInstance;
  }

  async cleanup(): Promise<void> {
    if (this.defaultInstance) {
      await this.defaultInstance.cleanup();
      this.defaultInstance = undefined;
    }
    
    for (const instance of this.instances.values()) {
      await instance.cleanup();
    }
    this.instances.clear();
  }
}

const instancePool = new GeoGebraInstancePool();

// Cleanup on process exit
process.on('exit', () => {
  instancePool.cleanup();
});

process.on('SIGINT', () => {
  instancePool.cleanup();
  process.exit(0);
});

/**
 * GeoGebra MCP Tools
 */
export const geogebraTools: ToolDefinition[] = [
  {
    tool: {
      name: 'geogebra_eval_command',
      description: 'Execute a GeoGebra command and return the result',
      inputSchema: {
        type: 'object',
        properties: {
          command: {
            type: 'string',
            description: 'The GeoGebra command to execute (e.g., "A = (1, 2)", "f(x) = x^2")'
          }
        },
        required: ['command']
      }
    },
    handler: async (params) => {
      try {
        const command = params['command'] as string;
        const instance = await instancePool.getDefaultInstance();
        
        const result = await instance.evalCommand(command);
        
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: result.success,
              command,
              result: result.result,
              error: result.error
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Failed to execute GeoGebra command', error);
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  },
  
  {
    tool: {
      name: 'geogebra_create_point',
      description: 'Create a point in GeoGebra with specified coordinates',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Name of the point (e.g., "A", "P1")'
          },
          x: {
            type: 'number',
            description: 'X coordinate of the point'
          },
          y: {
            type: 'number',
            description: 'Y coordinate of the point'
          }
        },
        required: ['name', 'x', 'y']
      }
    },
    handler: async (params) => {
      try {
        const name = params['name'] as string;
        const x = params['x'] as number;
        const y = params['y'] as number;
        
        // Validate parameters
        const nameValidation = validateObjectName(name);
        if (!nameValidation.isValid) {
          throw new Error(`Invalid name: ${nameValidation.error}`);
        }
        
        const coordValidation = validateCoordinates(x, y);
        if (!coordValidation.isValid) {
          throw new Error(`Invalid coordinates: ${coordValidation.error}`);
        }
        
        const command = `${name} = (${x}, ${y})`;
        const instance = await instancePool.getDefaultInstance();
        
        const result = await instance.evalCommand(command);
        
        if (result.success) {
          const pointInfo = await instance.getObjectInfo(name);
          return {
            content: [{
              type: 'text' as const,
              text: JSON.stringify({
                success: true,
                command,
                point: pointInfo
              }, null, 2)
            }]
          };
        } else {
          throw new Error(result.error || 'Failed to create point');
        }
      } catch (error) {
        logger.error('Failed to create point', error);
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  },

  {
    tool: {
      name: 'geogebra_create_line',
      description: 'Create a line in GeoGebra through two points or from an equation',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Name of the line (e.g., "l", "line1")'
          },
          point1: {
            type: 'string',
            description: 'Name of the first point (for two-point method)'
          },
          point2: {
            type: 'string',
            description: 'Name of the second point (for two-point method)'
          },
          equation: {
            type: 'string',
            description: 'Linear equation (e.g., "y = 2x + 3", "x + y = 5") for equation method'
          }
        },
        required: ['name'],
        oneOf: [
          {
            required: ['name', 'point1', 'point2']
          },
          {
            required: ['name', 'equation']
          }
        ]
      }
    },
    handler: async (params) => {
      try {
        const name = params['name'] as string;
        const point1 = params['point1'] as string;
        const point2 = params['point2'] as string;
        const equation = params['equation'] as string;
        
        // Validate line name
        const nameValidation = validateObjectName(name);
        if (!nameValidation.isValid) {
          throw new Error(`Invalid line name: ${nameValidation.error}`);
        }
        
        let command: string;
        
        // Validate parameters based on method
        if (point1 && point2) {
          // Two-point method - validate point names
          const point1Validation = validateObjectName(point1);
          if (!point1Validation.isValid) {
            throw new Error(`Invalid first point name: ${point1Validation.error}`);
          }
          
          const point2Validation = validateObjectName(point2);
          if (!point2Validation.isValid) {
            throw new Error(`Invalid second point name: ${point2Validation.error}`);
          }
          
          command = `${name} = Line(${point1}, ${point2})`;
        } else if (equation) {
          // Equation method - validate equation format
          const equationValidation = validateLinearEquation(equation);
          if (!equationValidation.isValid) {
            throw new Error(`Invalid equation: ${equationValidation.error}`);
          }
          
          // For equation-based lines, we define them directly
          command = `${name}: ${equation}`;
        } else {
          throw new Error('Either provide two points or an equation for the line');
        }
        
        const instance = await instancePool.getDefaultInstance();
        const result = await instance.evalCommand(command);
        
        if (result.success) {
          const lineInfo = await instance.getObjectInfo(name);
          return {
            content: [{
              type: 'text' as const,
              text: JSON.stringify({
                success: true,
                command,
                line: lineInfo,
                method: point1 && point2 ? 'two-point' : 'equation'
              }, null, 2)
            }]
          };
        } else {
          throw new Error(result.error || 'Failed to create line');
        }
      } catch (error) {
        logger.error('Failed to create line', error);
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  },

  {
    tool: {
      name: 'geogebra_create_circle',
      description: 'Create a circle in GeoGebra with center and radius, or through three points',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Name of the circle (e.g., "c", "circle1")'
          },
          center: {
            type: 'string',
            description: 'Name of the center point (required for center-radius method)'
          },
          radius: {
            type: 'number',
            description: 'Radius of the circle (required for center-radius method)',
            minimum: 0
          },
          point1: {
            type: 'string',
            description: 'First point for three-point circle method'
          },
          point2: {
            type: 'string',
            description: 'Second point for three-point circle method'
          },
          point3: {
            type: 'string',
            description: 'Third point for three-point circle method'
          }
        },
        required: ['name'],
        oneOf: [
          {
            required: ['name', 'center', 'radius']
          },
          {
            required: ['name', 'point1', 'point2', 'point3']
          }
        ]
      }
    },
    handler: async (params) => {
      try {
        const name = params['name'] as string;
        const center = params['center'] as string;
        const radius = params['radius'] as number;
        const point1 = params['point1'] as string;
        const point2 = params['point2'] as string;
        const point3 = params['point3'] as string;
        
        // Validate circle name
        const nameValidation = validateObjectName(name);
        if (!nameValidation.isValid) {
          throw new Error(`Invalid circle name: ${nameValidation.error}`);
        }
        
        let command: string;
        
        // Validate parameters based on method
        if (center && radius !== undefined) {
          // Center-radius method
          const centerValidation = validateObjectName(center);
          if (!centerValidation.isValid) {
            throw new Error(`Invalid center point name: ${centerValidation.error}`);
          }
          
          const radiusValidation = validateRadius(radius);
          if (!radiusValidation.isValid) {
            throw new Error(`Invalid radius: ${radiusValidation.error}`);
          }
          
          command = `${name} = Circle(${center}, ${radius})`;
        } else if (point1 && point2 && point3) {
          // Three-point method - validate all point names
          const points = [
            { name: point1, label: 'first' },
            { name: point2, label: 'second' },
            { name: point3, label: 'third' }
          ];
          
          for (const point of points) {
            if (!point.name) {
              throw new Error(`${point.label} point name is required`);
            }
            const pointValidation = validateObjectName(point.name);
            if (!pointValidation.isValid) {
              throw new Error(`Invalid ${point.label} point name: ${pointValidation.error}`);
            }
          }
          
          command = `${name} = Circle(${point1}, ${point2}, ${point3})`;
        } else {
          throw new Error('Either provide center and radius, or three points for the circle');
        }
        
        const instance = await instancePool.getDefaultInstance();
        const result = await instance.evalCommand(command);
        
        if (result.success) {
          const circleInfo = await instance.getObjectInfo(name);
          return {
            content: [{
              type: 'text' as const,
              text: JSON.stringify({
                success: true,
                command,
                circle: circleInfo
              }, null, 2)
            }]
          };
        } else {
          throw new Error(result.error || 'Failed to create circle');
        }
      } catch (error) {
        logger.error('Failed to create circle', error);
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  },

  {
    tool: {
      name: 'geogebra_create_polygon',
      description: 'Create a polygon in GeoGebra with variable number of vertices',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Name of the polygon (e.g., "poly", "triangle1")'
          },
          vertices: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'Array of point names that form the vertices of the polygon',
            minItems: 3
          }
        },
        required: ['name', 'vertices']
      }
    },
    handler: async (params) => {
      try {
        const name = params['name'] as string;
        const vertices = params['vertices'] as string[];
        
        // Validate polygon name
        const nameValidation = validateObjectName(name);
        if (!nameValidation.isValid) {
          throw new Error(`Invalid polygon name: ${nameValidation.error}`);
        }
        
        // Validate vertices
        const verticesValidation = validatePolygonVertices(vertices);
        if (!verticesValidation.isValid) {
          throw new Error(verticesValidation.error);
        }
        
        const verticesStr = vertices.join(', ');
        const command = `${name} = Polygon(${verticesStr})`;
        
        const instance = await instancePool.getDefaultInstance();
        const result = await instance.evalCommand(command);
        
        if (result.success) {
          const polygonInfo = await instance.getObjectInfo(name);
          return {
            content: [{
              type: 'text' as const,
              text: JSON.stringify({
                success: true,
                command,
                polygon: polygonInfo,
                vertexCount: vertices.length
              }, null, 2)
            }]
          };
        } else {
          throw new Error(result.error || 'Failed to create polygon');
        }
      } catch (error) {
        logger.error('Failed to create polygon', error);
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  },

  {
    tool: {
      name: 'geogebra_get_objects',
      description: 'Get all objects in the current GeoGebra construction',
      inputSchema: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            description: 'Optional: filter by object type (e.g., "point", "line", "circle")'
          }
        },
        required: []
      }
    },
    handler: async (params) => {
      try {
        const type = params['type'] as string | undefined;
        const instance = await instancePool.getDefaultInstance();
        
        const objectNames = await instance.getAllObjectNames(type);
        const objects = [];
        
        for (const name of objectNames) {
          const info = await instance.getObjectInfo(name);
          if (info) {
            objects.push(info);
          }
        }
        
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: true,
              objectCount: objects.length,
              objects
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Failed to get objects', error);
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  },

  {
    tool: {
      name: 'geogebra_clear_construction',
      description: 'Clear all objects from the GeoGebra construction',
      inputSchema: {
        type: 'object',
        properties: {},
        required: []
      }
    },
    handler: async (_params) => {
      try {
        const instance = await instancePool.getDefaultInstance();
        await instance.newConstruction();
        
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: true,
              message: 'Construction cleared successfully'
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Failed to clear construction', error);
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  },

  {
    tool: {
      name: 'geogebra_instance_status',
      description: 'Get the status of the GeoGebra instance',
      inputSchema: {
        type: 'object',
        properties: {},
        required: []
      }
    },
    handler: async (_params) => {
      try {
        const instance = await instancePool.getDefaultInstance();
        const isReady = await instance.isReady();
        const state = instance.getState();
        
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: true,
              status: {
                isReady,
                instanceId: state.id,
                lastActivity: state.lastActivity,
                config: state.config
              }
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Failed to get instance status', error);
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  },

  {
    tool: {
      name: 'geogebra_export_png',
      description: 'Export the current GeoGebra construction as PNG with configurable dimensions, quality, and view settings',
      inputSchema: {
        type: 'object',
        properties: {
          scale: {
            type: 'number',
            description: 'Scale factor for the exported image (default: 1)',
            minimum: 0.1,
            maximum: 10
          },
          width: {
            type: 'number',
            description: 'Width of the exported image in pixels (overrides scale if specified)',
            minimum: 100,
            maximum: 5000
          },
          height: {
            type: 'number',
            description: 'Height of the exported image in pixels (overrides scale if specified)',
            minimum: 100,
            maximum: 5000
          },
          transparent: {
            type: 'boolean',
            description: 'Whether the background should be transparent (default: false)'
          },
          dpi: {
            type: 'number',
            description: 'Dots per inch for the exported image (default: 72)',
            minimum: 72,
            maximum: 300
          },
          xmin: {
            type: 'number',
            description: 'Minimum x-coordinate for view range'
          },
          xmax: {
            type: 'number',
            description: 'Maximum x-coordinate for view range'
          },
          ymin: {
            type: 'number',
            description: 'Minimum y-coordinate for view range'
          },
          ymax: {
            type: 'number',
            description: 'Maximum y-coordinate for view range'
          },
          showAxes: {
            type: 'boolean',
            description: 'Whether to show coordinate axes (default: true)'
          },
          showGrid: {
            type: 'boolean',
            description: 'Whether to show coordinate grid (default: false)'
          }
        },
        required: []
      }
    },
    handler: async (params) => {
      try {
        const scale = (params['scale'] as number) || 1;
        const width = params['width'] as number;
        const height = params['height'] as number;
        const transparent = (params['transparent'] as boolean) || false;
        const dpi = (params['dpi'] as number) || 72;
        const xmin = params['xmin'] as number;
        const xmax = params['xmax'] as number;
        const ymin = params['ymin'] as number;
        const ymax = params['ymax'] as number;
        const showAxes = params['showAxes'] !== undefined ? (params['showAxes'] as boolean) : true;
        const showGrid = (params['showGrid'] as boolean) || false;
        
        const instance = await instancePool.getDefaultInstance();
        
        // Apply view settings if specified
        if (xmin !== undefined && xmax !== undefined && ymin !== undefined && ymax !== undefined) {
          await instance.setCoordSystem(xmin, xmax, ymin, ymax);
        }
        
        if (params['showAxes'] !== undefined) {
          await instance.setAxesVisible(showAxes, showAxes);
        }
        
        if (params['showGrid'] !== undefined) {
          await instance.setGridVisible(showGrid);
        }
        
        // Export with enhanced parameters
        const pngBase64 = await instance.exportPNG(scale, transparent, dpi, width, height);
        
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: true,
              format: 'PNG',
              scale,
              width,
              height,
              transparent,
              dpi,
              viewSettings: {
                coordSystem: (xmin !== undefined && xmax !== undefined && ymin !== undefined && ymax !== undefined) ? { xmin, xmax, ymin, ymax } : undefined,
                showAxes,
                showGrid
              },
              data: pngBase64,
              encoding: 'base64'
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Failed to export PNG', error);
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  },

  {
    tool: {
      name: 'geogebra_export_svg',
      description: 'Export the current GeoGebra construction as SVG with configurable view settings',
      inputSchema: {
        type: 'object',
        properties: {
          xmin: {
            type: 'number',
            description: 'Minimum x-coordinate for view range'
          },
          xmax: {
            type: 'number',
            description: 'Maximum x-coordinate for view range'
          },
          ymin: {
            type: 'number',
            description: 'Minimum y-coordinate for view range'
          },
          ymax: {
            type: 'number',
            description: 'Maximum y-coordinate for view range'
          },
          showAxes: {
            type: 'boolean',
            description: 'Whether to show coordinate axes (default: true)'
          },
          showGrid: {
            type: 'boolean',
            description: 'Whether to show coordinate grid (default: false)'
          }
        },
        required: []
      }
    },
    handler: async (params) => {
      try {
        const xmin = params['xmin'] as number;
        const xmax = params['xmax'] as number;
        const ymin = params['ymin'] as number;
        const ymax = params['ymax'] as number;
        const showAxes = params['showAxes'] !== undefined ? (params['showAxes'] as boolean) : true;
        const showGrid = (params['showGrid'] as boolean) || false;
        
        const instance = await instancePool.getDefaultInstance();
        
        // Apply view settings if specified
        if (xmin !== undefined && xmax !== undefined && ymin !== undefined && ymax !== undefined) {
          await instance.setCoordSystem(xmin, xmax, ymin, ymax);
        }
        
        if (params['showAxes'] !== undefined) {
          await instance.setAxesVisible(showAxes, showAxes);
        }
        
        if (params['showGrid'] !== undefined) {
          await instance.setGridVisible(showGrid);
        }
        
        const svg = await instance.exportSVG();
        
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: true,
              format: 'SVG',
              viewSettings: {
                coordSystem: (xmin !== undefined && xmax !== undefined && ymin !== undefined && ymax !== undefined) ? { xmin, xmax, ymin, ymax } : undefined,
                showAxes,
                showGrid
              },
              data: svg,
              encoding: 'utf8'
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Failed to export SVG', error);
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  },

  {
    tool: {
      name: 'geogebra_export_pdf',
      description: 'Export the current GeoGebra construction as PDF (base64)',
      inputSchema: {
        type: 'object',
        properties: {},
        required: []
      }
    },
    handler: async (_params) => {
      try {
        const instance = await instancePool.getDefaultInstance();
        
        const pdfBase64 = await instance.exportPDF();
        
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: true,
              format: 'PDF',
              data: pdfBase64,
              encoding: 'base64'
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Failed to export PDF', error);
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  },

  {
    tool: {
      name: 'geogebra_plot_function',
      description: 'Plot a mathematical function f(x) = expression with configurable domain and styling',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Name of the function (e.g., "f", "g", "func1")'
          },
          expression: {
            type: 'string',
            description: 'Mathematical expression in terms of x (e.g., "x^2", "sin(x)", "2*x + 3")'
          },
          xMin: {
            type: 'number',
            description: 'Minimum x value for the domain (optional)'
          },
          xMax: {
            type: 'number',
            description: 'Maximum x value for the domain (optional)'
          },
          color: {
            type: 'string',
            description: 'Color of the function graph (hex, rgb, or color name)'
          },
          thickness: {
            type: 'number',
            description: 'Line thickness (1-10)',
            minimum: 1,
            maximum: 10
          },
          style: {
            type: 'string',
            description: 'Line style',
            enum: ['solid', 'dashed', 'dotted']
          }
        },
        required: ['name', 'expression']
      }
    },
    handler: async (params) => {
      try {
        const name = params['name'] as string;
        const expression = params['expression'] as string;
        const xMin = params['xMin'] as number | undefined;
        const xMax = params['xMax'] as number | undefined;
        const color = params['color'] as string | undefined;
        const thickness = params['thickness'] as number | undefined;
        const style = params['style'] as string | undefined;

        // Validate function name
        const nameValidation = validateObjectName(name);
        if (!nameValidation.isValid) {
          throw new Error(`Invalid function name: ${nameValidation.error}`);
        }

        // Validate function expression
        const exprValidation = validateFunctionExpression(expression);
        if (!exprValidation.isValid) {
          throw new Error(`Invalid expression: ${exprValidation.error}`);
        }

        // Validate domain if provided
        if (xMin !== undefined && xMax !== undefined) {
          const domainValidation = validateDomainRange(xMin, xMax, 'x');
          if (!domainValidation.isValid) {
            throw new Error(`Invalid domain: ${domainValidation.error}`);
          }
        }

        // Validate styling if provided
        const styleValidation = validateFunctionStyling(color, thickness, style);
        if (!styleValidation.isValid) {
          throw new Error(`Invalid styling: ${styleValidation.error}`);
        }

        const instance = await instancePool.getDefaultInstance();

        // Create the function
        let command: string;
        if (xMin !== undefined && xMax !== undefined) {
          // Function with domain restriction
          command = `${name}(x) = If(${xMin} <= x <= ${xMax}, ${expression}, ?)`;
        } else {
          // Standard function
          command = `${name}(x) = ${expression}`;
        }

        const result = await instance.evalCommand(command);
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to create function');
        }

        // Apply styling if provided
        const styleCommands: string[] = [];
        
        if (color) {
          styleCommands.push(`SetColor(${name}, "${color}")`);
        }
        
        if (thickness) {
          styleCommands.push(`SetLineThickness(${name}, ${thickness})`);
        }
        
        if (style && style !== 'solid') {
          const lineType = style === 'dashed' ? '10' : '20'; // GeoGebra line types
          styleCommands.push(`SetLineStyle(${name}, ${lineType})`);
        }

        // Execute styling commands
        for (const styleCmd of styleCommands) {
          await instance.evalCommand(styleCmd);
        }

        const functionInfo = await instance.getObjectInfo(name);

        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: true,
              command,
              function: functionInfo,
              domain: (xMin !== undefined && xMax !== undefined) ? { xMin, xMax } : undefined,
              styling: {
                color,
                thickness,
                style
              }
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Failed to plot function', error);
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  },

  {
    tool: {
      name: 'geogebra_plot_parametric',
      description: 'Plot a parametric curve defined by x(t) and y(t) with configurable parameter range and styling',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Name of the parametric curve (e.g., "curve1", "c")'
          },
          xExpression: {
            type: 'string',
            description: 'X-coordinate expression in terms of parameter (e.g., "cos(t)", "t")'
          },
          yExpression: {
            type: 'string',
            description: 'Y-coordinate expression in terms of parameter (e.g., "sin(t)", "t^2")'
          },
          parameter: {
            type: 'string',
            description: 'Parameter variable name (default: "t")',
            default: 't'
          },
          tMin: {
            type: 'number',
            description: 'Minimum parameter value'
          },
          tMax: {
            type: 'number',
            description: 'Maximum parameter value'
          },
          color: {
            type: 'string',
            description: 'Color of the curve (hex, rgb, or color name)'
          },
          thickness: {
            type: 'number',
            description: 'Line thickness (1-10)',
            minimum: 1,
            maximum: 10
          },
          style: {
            type: 'string',
            description: 'Line style',
            enum: ['solid', 'dashed', 'dotted']
          }
        },
        required: ['name', 'xExpression', 'yExpression', 'tMin', 'tMax']
      }
    },
    handler: async (params) => {
      try {
        const name = params['name'] as string;
        const xExpression = params['xExpression'] as string;
        const yExpression = params['yExpression'] as string;
        const parameter = (params['parameter'] as string) || 't';
        const tMin = params['tMin'] as number;
        const tMax = params['tMax'] as number;
        const color = params['color'] as string | undefined;
        const thickness = params['thickness'] as number | undefined;
        const style = params['style'] as string | undefined;

        // Validate curve name
        const nameValidation = validateObjectName(name);
        if (!nameValidation.isValid) {
          throw new Error(`Invalid curve name: ${nameValidation.error}`);
        }

        // Validate parametric expressions
        const exprValidation = validateParametricExpressions(xExpression, yExpression, parameter);
        if (!exprValidation.isValid) {
          throw new Error(`Invalid expressions: ${exprValidation.error}`);
        }

        // Validate parameter range
        const rangeValidation = validateDomainRange(tMin, tMax, parameter);
        if (!rangeValidation.isValid) {
          throw new Error(`Invalid parameter range: ${rangeValidation.error}`);
        }

        // Validate styling if provided
        const styleValidation = validateFunctionStyling(color, thickness, style);
        if (!styleValidation.isValid) {
          throw new Error(`Invalid styling: ${styleValidation.error}`);
        }

        const instance = await instancePool.getDefaultInstance();

        // Create the parametric curve using GeoGebra's Curve command
        const command = `${name} = Curve(${xExpression}, ${yExpression}, ${parameter}, ${tMin}, ${tMax})`;

        const result = await instance.evalCommand(command);
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to create parametric curve');
        }

        // Apply styling if provided
        const styleCommands: string[] = [];
        
        if (color) {
          styleCommands.push(`SetColor(${name}, "${color}")`);
        }
        
        if (thickness) {
          styleCommands.push(`SetLineThickness(${name}, ${thickness})`);
        }
        
        if (style && style !== 'solid') {
          const lineType = style === 'dashed' ? '10' : '20';
          styleCommands.push(`SetLineStyle(${name}, ${lineType})`);
        }

        // Execute styling commands
        for (const styleCmd of styleCommands) {
          await instance.evalCommand(styleCmd);
        }

        const curveInfo = await instance.getObjectInfo(name);

        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: true,
              command,
              curve: curveInfo,
              parametric: {
                xExpression,
                yExpression,
                parameter,
                range: { tMin, tMax }
              },
              styling: {
                color,
                thickness,
                style
              }
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Failed to plot parametric curve', error);
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  },

  {
    tool: {
      name: 'geogebra_plot_implicit',
      description: 'Plot an implicit curve defined by F(x,y) = 0 with configurable styling',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Name of the implicit curve (e.g., "implicit1", "curve")'
          },
          expression: {
            type: 'string',
            description: 'Implicit expression in terms of x and y (e.g., "x^2 + y^2 - 4", "x^2/4 + y^2/9 - 1")'
          },
          color: {
            type: 'string',
            description: 'Color of the curve (hex, rgb, or color name)'
          },
          thickness: {
            type: 'number',
            description: 'Line thickness (1-10)',
            minimum: 1,
            maximum: 10
          },
          style: {
            type: 'string',
            description: 'Line style',
            enum: ['solid', 'dashed', 'dotted']
          }
        },
        required: ['name', 'expression']
      }
    },
    handler: async (params) => {
      try {
        const name = params['name'] as string;
        const expression = params['expression'] as string;
        const color = params['color'] as string | undefined;
        const thickness = params['thickness'] as number | undefined;
        const style = params['style'] as string | undefined;

        // Validate curve name
        const nameValidation = validateObjectName(name);
        if (!nameValidation.isValid) {
          throw new Error(`Invalid curve name: ${nameValidation.error}`);
        }

        // Validate implicit expression
        const exprValidation = validateImplicitExpression(expression);
        if (!exprValidation.isValid) {
          throw new Error(`Invalid expression: ${exprValidation.error}`);
        }

        // Validate styling if provided
        const styleValidation = validateFunctionStyling(color, thickness, style);
        if (!styleValidation.isValid) {
          throw new Error(`Invalid styling: ${styleValidation.error}`);
        }

        const instance = await instancePool.getDefaultInstance();

        // Create the implicit curve using GeoGebra's ImplicitCurve command
        const command = `${name} = ImplicitCurve(${expression})`;

        const result = await instance.evalCommand(command);
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to create implicit curve');
        }

        // Apply styling if provided
        const styleCommands: string[] = [];
        
        if (color) {
          styleCommands.push(`SetColor(${name}, "${color}")`);
        }
        
        if (thickness) {
          styleCommands.push(`SetLineThickness(${name}, ${thickness})`);
        }
        
        if (style && style !== 'solid') {
          const lineType = style === 'dashed' ? '10' : '20';
          styleCommands.push(`SetLineStyle(${name}, ${lineType})`);
        }

        // Execute styling commands
        for (const styleCmd of styleCommands) {
          await instance.evalCommand(styleCmd);
        }

        const curveInfo = await instance.getObjectInfo(name);

        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: true,
              command,
              curve: curveInfo,
              implicit: {
                expression
              },
              styling: {
                color,
                thickness,
                style
              }
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Failed to plot implicit curve', error);
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  },

  // CAS (Computer Algebra System) Tools

  {
    tool: {
      name: 'geogebra_solve_equation',
      description: 'Solve algebraic equations using GeoGebra\'s CAS',
      inputSchema: {
        type: 'object',
        properties: {
          equation: {
            type: 'string',
            description: 'The equation to solve (e.g., "x^2 - 4 = 0", "2x + 3 = 7")'
          },
          variable: {
            type: 'string',
            description: 'Variable to solve for (optional, defaults to automatic detection)'
          }
        },
        required: ['equation']
      }
    },
    handler: async (params) => {
      try {
        const equation = params['equation'] as string;
        const variable = params['variable'] as string | undefined;

        // Validate equation
        const equationValidation = validateEquation(equation);
        if (!equationValidation.isValid) {
          throw new Error(`Invalid equation: ${equationValidation.error}`);
        }

        // Validate variable if provided
        if (variable) {
          const variableValidation = validateVariableName(variable);
          if (!variableValidation.isValid) {
            throw new Error(`Invalid variable: ${variableValidation.error}`);
          }
        }

        const instance = await instancePool.getDefaultInstance();

        // Create the solve command
        const command = variable ? 
          `Solve(${equation}, ${variable})` : 
          `Solve(${equation})`;

        const result = await instance.evalCommand(command);
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to solve equation');
        }

        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: true,
              equation,
              variable: variable || 'auto-detected',
              command,
              solution: result.result
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Failed to solve equation', error);
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  },

  {
    tool: {
      name: 'geogebra_solve_system',
      description: 'Solve a system of equations using GeoGebra\'s CAS',
      inputSchema: {
        type: 'object',
        properties: {
          equations: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'Array of equations to solve (e.g., ["x + y = 5", "x - y = 1"])'
          },
          variables: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'Variables to solve for (e.g., ["x", "y"])'
          }
        },
        required: ['equations', 'variables']
      }
    },
    handler: async (params) => {
      try {
        const equations = params['equations'] as string[];
        const variables = params['variables'] as string[];

        // Validate equations
        const equationsValidation = validateSystemOfEquations(equations);
        if (!equationsValidation.isValid) {
          throw new Error(`Invalid equations: ${equationsValidation.error}`);
        }

        // Validate variables
        const variablesValidation = validateVariablesList(variables);
        if (!variablesValidation.isValid) {
          throw new Error(`Invalid variables: ${variablesValidation.error}`);
        }

        const instance = await instancePool.getDefaultInstance();

        // Create the solve command for system of equations
        const equationsStr = `{${equations.join(', ')}}`;
        const variablesStr = `{${variables.join(', ')}}`;
        const command = `Solve(${equationsStr}, ${variablesStr})`;

        const result = await instance.evalCommand(command);
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to solve system of equations');
        }

        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: true,
              equations,
              variables,
              command,
              solution: result.result
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Failed to solve system of equations', error);
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  },

  {
    tool: {
      name: 'geogebra_differentiate',
      description: 'Compute the derivative of an expression using GeoGebra\'s CAS',
      inputSchema: {
        type: 'object',
        properties: {
          expression: {
            type: 'string',
            description: 'The expression to differentiate (e.g., "x^2", "sin(x)", "x^3 + 2x + 1")'
          },
          variable: {
            type: 'string',
            description: 'Variable to differentiate with respect to (optional, defaults to "x")'
          }
        },
        required: ['expression']
      }
    },
    handler: async (params) => {
      try {
        const expression = params['expression'] as string;
        const variable = (params['variable'] as string) || 'x';

        // Validate expression
        const expressionValidation = validateAlgebraicExpression(expression);
        if (!expressionValidation.isValid) {
          throw new Error(`Invalid expression: ${expressionValidation.error}`);
        }

        // Validate variable
        const variableValidation = validateVariableName(variable);
        if (!variableValidation.isValid) {
          throw new Error(`Invalid variable: ${variableValidation.error}`);
        }

        const instance = await instancePool.getDefaultInstance();

        // Create the derivative command
        const command = `Derivative(${expression}, ${variable})`;

        const result = await instance.evalCommand(command);
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to compute derivative');
        }

        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: true,
              expression,
              variable,
              command,
              derivative: result.result
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Failed to compute derivative', error);
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  },

  {
    tool: {
      name: 'geogebra_integrate',
      description: 'Compute the integral of an expression using GeoGebra\'s CAS',
      inputSchema: {
        type: 'object',
        properties: {
          expression: {
            type: 'string',
            description: 'The expression to integrate (e.g., "x^2", "sin(x)", "2x + 1")'
          },
          variable: {
            type: 'string',
            description: 'Variable to integrate with respect to (optional, defaults to "x")'
          }
        },
        required: ['expression']
      }
    },
    handler: async (params) => {
      try {
        const expression = params['expression'] as string;
        const variable = (params['variable'] as string) || 'x';

        // Validate expression
        const expressionValidation = validateAlgebraicExpression(expression);
        if (!expressionValidation.isValid) {
          throw new Error(`Invalid expression: ${expressionValidation.error}`);
        }

        // Validate variable
        const variableValidation = validateVariableName(variable);
        if (!variableValidation.isValid) {
          throw new Error(`Invalid variable: ${variableValidation.error}`);
        }

        const instance = await instancePool.getDefaultInstance();

        // Create the integral command
        const command = `Integral(${expression}, ${variable})`;

        const result = await instance.evalCommand(command);
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to compute integral');
        }

        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: true,
              expression,
              variable,
              command,
              integral: result.result
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Failed to compute integral', error);
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  },

  {
    tool: {
      name: 'geogebra_simplify',
      description: 'Simplify an algebraic expression using GeoGebra\'s CAS',
      inputSchema: {
        type: 'object',
        properties: {
          expression: {
            type: 'string',
            description: 'The expression to simplify (e.g., "x^2 + 2x + 1", "(x+1)^2", "sin^2(x) + cos^2(x)")'
          }
        },
        required: ['expression']
      }
    },
    handler: async (params) => {
      try {
        const expression = params['expression'] as string;

        // Validate expression
        const expressionValidation = validateAlgebraicExpression(expression);
        if (!expressionValidation.isValid) {
          throw new Error(`Invalid expression: ${expressionValidation.error}`);
        }

        const instance = await instancePool.getDefaultInstance();

        // Create the simplify command
        const command = `Simplify(${expression})`;

        const result = await instance.evalCommand(command);
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to simplify expression');
        }

        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: true,
              expression,
              command,
              simplified: result.result
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Failed to simplify expression', error);
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  },

  // Animation Tools - GEB-7 Implementation
  {
    tool: {
      name: 'geogebra_create_slider',
      description: 'Create an interactive slider for parameter control and animation',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Name of the slider (e.g., "a", "t", "speed")'
          },
          min: {
            type: 'number',
            description: 'Minimum value of the slider'
          },
          max: {
            type: 'number',
            description: 'Maximum value of the slider'
          },
          increment: {
            type: 'number',
            description: 'Step size for the slider (optional, defaults to 0.1)'
          },
          defaultValue: {
            type: 'number',
            description: 'Initial value of the slider (optional, defaults to minimum value)'
          },
          width: {
            type: 'number',
            description: 'Width of the slider in pixels (optional, defaults to 150)'
          },
          isAngle: {
            type: 'boolean',
            description: 'Whether the slider represents an angle (optional, defaults to false)'
          },
          horizontal: {
            type: 'boolean',
            description: 'Whether the slider is horizontal (optional, defaults to true)'
          }
        },
        required: ['name', 'min', 'max']
      }
    },
    handler: async (params) => {
      try {
        const name = params['name'] as string;
        const min = params['min'] as number;
        const max = params['max'] as number;
        const increment = (params['increment'] as number) || 0.1;
        const defaultValue = (params['defaultValue'] as number) || min;
        const width = (params['width'] as number) || 150;
        const isAngle = (params['isAngle'] as boolean) || false;
        const horizontal = (params['horizontal'] as boolean) !== false;

        // Validate parameters
        const validation = validateSliderParameters(name, min, max, increment, defaultValue);
        if (!validation.isValid) {
          throw new Error(validation.error);
        }

        const instance = await instancePool.getDefaultInstance();

        // Create GeoGebra slider command
        const command = `${name} = Slider(${min}, ${max}, ${increment}, 1, ${width}, ${isAngle}, ${horizontal}, false, false)`;

        const result = await instance.evalCommand(command);
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to create slider');
        }

        // Set the default value
        await instance.setValue(name, defaultValue);

        const sliderInfo = await instance.getObjectInfo(name);

        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: true,
              command,
              slider: {
                name,
                min,
                max,
                increment,
                currentValue: defaultValue,
                width,
                isAngle,
                horizontal,
                info: sliderInfo
              }
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Failed to create slider', error);
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  },

  {
    tool: {
      name: 'geogebra_animate_parameter',
      description: 'Configure an object (especially sliders) for parameter-based animation',
      inputSchema: {
        type: 'object',
        properties: {
          objectName: {
            type: 'string',
            description: 'Name of the object to animate (typically a slider or point on a path)'
          },
          animate: {
            type: 'boolean',
            description: 'Whether to enable or disable animation for this object'
          },
          speed: {
            type: 'number',
            description: 'Animation speed (optional, defaults to 1, valid range: 0.1 to 10)'
          },
          direction: {
            type: 'string',
            enum: ['forward', 'backward', 'oscillating'],
            description: 'Animation direction (optional, defaults to "forward")'
          }
        },
        required: ['objectName', 'animate']
      }
    },
    handler: async (params) => {
      try {
        const objectName = params['objectName'] as string;
        const animate = params['animate'] as boolean;
        const speed = (params['speed'] as number) || 1;
        const direction = (params['direction'] as string) || 'forward';

        // Validate parameters
        const nameValidation = validateObjectName(objectName);
        if (!nameValidation.isValid) {
          throw new Error(`Invalid object name: ${nameValidation.error}`);
        }

        const speedValidation = validateAnimationSpeed(speed);
        if (!speedValidation.isValid) {
          throw new Error(speedValidation.error);
        }

        const directionValidation = validateAnimationDirection(direction);
        if (!directionValidation.isValid) {
          throw new Error(directionValidation.error);
        }

        const instance = await instancePool.getDefaultInstance();

        // Check if object exists
        const exists = await instance.exists(objectName);
        if (!exists) {
          throw new Error(`Object ${objectName} does not exist`);
        }

        // Set animation properties
        await instance.setAnimating(objectName, animate);
        if (animate) {
          await instance.setAnimationSpeed(objectName, speed);
        }

        const objectInfo = await instance.getObjectInfo(objectName);

        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: true,
              animation: {
                objectName,
                animate,
                speed: animate ? speed : null,
                direction,
                objectInfo
              }
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Failed to configure animation', error);
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  },

  {
    tool: {
      name: 'geogebra_trace_object',
      description: 'Enable or disable trace for an object to visualize its path during animation',
      inputSchema: {
        type: 'object',
        properties: {
          objectName: {
            type: 'string',
            description: 'Name of the object to trace (typically animated points or curves)'
          },
          enableTrace: {
            type: 'boolean',
            description: 'Whether to enable or disable tracing for this object'
          }
        },
        required: ['objectName', 'enableTrace']
      }
    },
    handler: async (params) => {
      try {
        const objectName = params['objectName'] as string;
        const enableTrace = params['enableTrace'] as boolean;

        // Validate object name
        const nameValidation = validateObjectName(objectName);
        if (!nameValidation.isValid) {
          throw new Error(`Invalid object name: ${nameValidation.error}`);
        }

        const instance = await instancePool.getDefaultInstance();

        // Check if object exists
        const exists = await instance.exists(objectName);
        if (!exists) {
          throw new Error(`Object ${objectName} does not exist`);
        }

        // Set trace
        await instance.setTrace(objectName, enableTrace);

        const objectInfo = await instance.getObjectInfo(objectName);

        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: true,
              trace: {
                objectName,
                enableTrace,
                objectInfo
              }
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Failed to set trace', error);
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  },

  {
    tool: {
      name: 'geogebra_start_animation',
      description: 'Start animation for all objects with animation enabled',
      inputSchema: {
        type: 'object',
        properties: {},
        required: []
      }
    },
    handler: async (_params) => {
      try {
        const instance = await instancePool.getDefaultInstance();

        await instance.startAnimation();
        const isRunning = await instance.isAnimationRunning();

        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: true,
              action: 'start_animation',
              isRunning
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Failed to start animation', error);
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  },

  {
    tool: {
      name: 'geogebra_stop_animation',
      description: 'Stop all currently running animations',
      inputSchema: {
        type: 'object',
        properties: {},
        required: []
      }
    },
    handler: async (_params) => {
      try {
        const instance = await instancePool.getDefaultInstance();

        await instance.stopAnimation();
        const isRunning = await instance.isAnimationRunning();

        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: true,
              action: 'stop_animation',
              isRunning
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Failed to stop animation', error);
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  },

  {
    tool: {
      name: 'geogebra_animation_status',
      description: 'Check the current status of animations',
      inputSchema: {
        type: 'object',
        properties: {},
        required: []
      }
    },
    handler: async (_params) => {
      try {
        const instance = await instancePool.getDefaultInstance();

        const isRunning = await instance.isAnimationRunning();

        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: true,
              action: 'check_animation_status',
              isRunning
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Failed to check animation status', error);
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  },

  {
    tool: {
      name: 'geogebra_export_animation',
      description: 'Export an animation as a sequence of frames for GIF creation',
      inputSchema: {
        type: 'object',
        properties: {
          frameCount: {
            type: 'number',
            description: 'Number of frames to capture (default: 30, max: 300)'
          },
          frameDelay: {
            type: 'number',
            description: 'Delay between frames in milliseconds (default: 100)'
          },
          totalDuration: {
            type: 'number',
            description: 'Total animation duration in seconds (optional, calculated from frameCount and frameDelay if not provided)'
          },
          width: {
            type: 'number',
            description: 'Width of exported frames (optional, defaults to current view width)'
          },
          height: {
            type: 'number',
            description: 'Height of exported frames (optional, defaults to current view height)'
          },
          scale: {
            type: 'number',
            description: 'Scale factor for export quality (default: 1, range: 0.5 to 3)'
          },
          format: {
            type: 'string',
            enum: ['png', 'svg'],
            description: 'Export format for frames (default: png)'
          }
        },
        required: []
      }
    },
    handler: async (params) => {
      try {
        const frameCount = (params['frameCount'] as number) || 30;
        const frameDelay = (params['frameDelay'] as number) || 100;
        const totalDuration = (params['totalDuration'] as number) || ((frameCount * frameDelay) / 1000);
        const width = params['width'] as number;
        const height = params['height'] as number;
        const scale = Math.min(Math.max((params['scale'] as number) || 1, 0.5), 3);
        const format = (params['format'] as string) || 'png';

        // Validate export parameters FIRST before any other operations
        const validation = validateAnimationExportParameters(frameCount, frameDelay, totalDuration);
        if (!validation.isValid) {
          throw new Error(validation.error);
        }

        const instance = await instancePool.getDefaultInstance();

        // Check if any animations are set up
        const allObjects = await instance.getAllObjectNames();
        const hasAnimatedObjects = allObjects && allObjects.length > 0; // In a real implementation, we'd check for animated objects

        if (!hasAnimatedObjects) {
          throw new Error('No objects found. Create and configure animated objects before exporting animation.');
        }

        // Capture frames
        const frames: string[] = [];
        const captureInterval = totalDuration / frameCount;

        logger.info(`Starting animation export: ${frameCount} frames over ${totalDuration}s`);

        // Start animation
        await instance.startAnimation();

        for (let i = 0; i < frameCount; i++) {
          // Wait for the appropriate time interval
          if (i > 0) {
            await new Promise(resolve => setTimeout(resolve, captureInterval * 1000));
          }

          // Capture frame
          let frameData: string;
          if (format === 'svg') {
            frameData = await instance.exportSVG();
          } else {
            frameData = await instance.exportPNG(scale, false, 72, width, height);
          }

          frames.push(frameData);
          logger.debug(`Captured frame ${i + 1}/${frameCount}`);
        }

        // Stop animation
        await instance.stopAnimation();

        logger.info(`Animation export completed: ${frames.length} frames captured`);

        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: true,
              export: {
                frameCount: frames.length,
                frameDelay,
                totalDuration,
                format,
                scale,
                dimensions: width && height ? { width, height } : null,
                frames: frames.slice(0, 3), // Only return first 3 frames in response for brevity
                note: `Captured ${frames.length} frames. In a full implementation, these would be processed into a GIF file.`,
                implementation_note: "Frame data contains base64 encoded images that can be processed into GIF format using libraries like 'gif-encoder' or 'gifski'"
              }
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Failed to export animation', error);
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  },

  {
    tool: {
      name: 'geogebra_animation_demo',
      description: 'Create a comprehensive animation demonstration with parametric curves, traced objects, and animated sliders',
      inputSchema: {
        type: 'object',
        properties: {
          demoType: {
            type: 'string',
            enum: ['parametric_spiral', 'pendulum', 'wave_function', 'circle_trace'],
            description: 'Type of animation demo to create (default: parametric_spiral)'
          },
          animationSpeed: {
            type: 'number',
            description: 'Animation speed (default: 1, range: 0.1 to 5)'
          }
        },
        required: []
      }
    },
    handler: async (params) => {
      try {
        const demoType = (params['demoType'] as string) || 'parametric_spiral';
        const animationSpeed = Math.min(Math.max((params['animationSpeed'] as number) || 1, 0.1), 5);

        const instance = await instancePool.getDefaultInstance();

        // Clear any existing construction
        await instance.newConstruction();

        let createdObjects: string[] = [];
        let animatedObjects: string[] = [];

        switch (demoType) {
          case 'parametric_spiral':
            // Create time parameter slider
            await instance.evalCommand('t = Slider(0, 4*pi, 0.1, 1, 200, false, true, false, false)');
            await instance.setValue('t', 0);
            createdObjects.push('t');

            // Create parametric spiral
            await instance.evalCommand('spiralX(s) = s * cos(s)');
            await instance.evalCommand('spiralY(s) = s * sin(s)');
            await instance.evalCommand('spiral = Curve(spiralX(s), spiralY(s), s, 0, t)');
            createdObjects.push('spiral');

            // Create moving point on spiral
            await instance.evalCommand('P = (spiralX(t), spiralY(t))');
            createdObjects.push('P');

            // Enable animation and tracing
            await instance.setAnimating('t', true);
            await instance.setAnimationSpeed('t', animationSpeed);
            await instance.setTrace('P', true);
            animatedObjects.push('t');
            break;

          case 'pendulum':
            // Create angle slider
            await instance.evalCommand('angle = Slider(-pi/2, pi/2, 0.05, 1, 200, true, true, false, false)');
            await instance.setValue('angle', 0);
            createdObjects.push('angle');

            // Create pendulum setup
            await instance.evalCommand('origin = (0, 0)');
            await instance.evalCommand('length = 3');
            await instance.evalCommand('pendulumX = length * sin(angle)');
            await instance.evalCommand('pendulumY = -length * cos(angle)');
            await instance.evalCommand('bob = (pendulumX, pendulumY)');
            await instance.evalCommand('rod = Segment(origin, bob)');
            createdObjects.push('origin', 'bob', 'rod');

            // Enable animation and tracing
            await instance.setAnimating('angle', true);
            await instance.setAnimationSpeed('angle', animationSpeed);
            await instance.setTrace('bob', true);
            animatedObjects.push('angle');
            break;

          case 'wave_function':
            // Create time and frequency sliders
            await instance.evalCommand('time = Slider(0, 4*pi, 0.1, 1, 150, false, true, false, false)');
            await instance.evalCommand('freq = Slider(0.5, 3, 0.1, 1, 150, false, true, false, false)');
            await instance.setValue('time', 0);
            await instance.setValue('freq', 1);
            createdObjects.push('time', 'freq');

            // Create wave function
            await instance.evalCommand('wave(x) = sin(freq * x + time)');
            await instance.evalCommand('f = wave(x)');
            createdObjects.push('f');

            // Create a point that moves along the wave
            await instance.evalCommand('wavePoint = (time, sin(freq * time + time))');
            createdObjects.push('wavePoint');

            // Enable animation and tracing
            await instance.setAnimating('time', true);
            await instance.setAnimationSpeed('time', animationSpeed);
            await instance.setTrace('wavePoint', true);
            animatedObjects.push('time');
            break;

          case 'circle_trace':
            // Create angle slider
            await instance.evalCommand('theta = Slider(0, 4*pi, 0.1, 1, 200, true, true, false, false)');
            await instance.setValue('theta', 0);
            createdObjects.push('theta');

            // Create circles and tracing points
            await instance.evalCommand('radius1 = 2');
            await instance.evalCommand('radius2 = 1');
            await instance.evalCommand('center1 = (0, 0)');
            await instance.evalCommand('center2 = (radius1 * cos(theta), radius1 * sin(theta))');
            await instance.evalCommand('circle1 = Circle(center1, radius1)');
            await instance.evalCommand('circle2 = Circle(center2, radius2)');
            createdObjects.push('circle1', 'circle2', 'center1', 'center2');

            // Create epicycloid trace point
            await instance.evalCommand('traceX = (radius1 + radius2) * cos(theta) - radius2 * cos((radius1 + radius2) / radius2 * theta)');
            await instance.evalCommand('traceY = (radius1 + radius2) * sin(theta) - radius2 * sin((radius1 + radius2) / radius2 * theta)');
            await instance.evalCommand('tracePoint = (traceX, traceY)');
            createdObjects.push('tracePoint');

            // Enable animation and tracing
            await instance.setAnimating('theta', true);
            await instance.setAnimationSpeed('theta', animationSpeed);
            await instance.setTrace('tracePoint', true);
            await instance.setTrace('center2', true);
            animatedObjects.push('theta');
            break;

          default:
            throw new Error(`Unknown demo type: ${demoType}`);
        }

        // Set up coordinate system for better viewing
        await instance.setCoordSystem(-6, 6, -6, 6);
        await instance.setAxesVisible(true, true);
        await instance.setGridVisible(true);

        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: true,
              demo: {
                type: demoType,
                animationSpeed,
                createdObjects,
                animatedObjects,
                message: `Animation demo '${demoType}' created successfully!`,
                instructions: [
                  'Use geogebra_start_animation to begin the animation',
                  'Use geogebra_stop_animation to pause it',
                  'Use geogebra_animation_status to check if it\'s running',
                  'Use geogebra_export_animation to capture frames for GIF creation',
                  'Objects with tracing enabled will show their paths during animation'
                ]
              }
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Failed to create animation demo', error);
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  },

  // Missing Tools Implementation
  {
    tool: {
      name: 'geogebra_create_line_segment',
      description: 'Create a line segment in GeoGebra between two points',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Name of the line segment (e.g., "AB", "segment1")'
          },
          point1: {
            type: 'string',
            description: 'Name of the first point'
          },
          point2: {
            type: 'string',
            description: 'Name of the second point'
          },
          color: {
            type: 'string',
            description: 'Color of the line segment (hex format, e.g., "#FF0000")'
          },
          thickness: {
            type: 'number',
            description: 'Thickness of the line segment (1-10)',
            minimum: 1,
            maximum: 10
          },
          style: {
            type: 'string',
            enum: ['solid', 'dashed', 'dotted'],
            description: 'Line style (default: solid)'
          }
        },
        required: ['name', 'point1', 'point2']
      }
    },
    handler: async (params) => {
      try {
        const name = params['name'] as string;
        const point1 = params['point1'] as string;
        const point2 = params['point2'] as string;
        const color = params['color'] as string | undefined;
        const thickness = params['thickness'] as number | undefined;
        const style = params['style'] as string | undefined;
        
        // Validate segment name
        const nameValidation = validateObjectName(name);
        if (!nameValidation.isValid) {
          throw new Error(`Invalid segment name: ${nameValidation.error}`);
        }
        
        // Validate point names
        const point1Validation = validateObjectName(point1);
        if (!point1Validation.isValid) {
          throw new Error(`Invalid first point name: ${point1Validation.error}`);
        }
        
        const point2Validation = validateObjectName(point2);
        if (!point2Validation.isValid) {
          throw new Error(`Invalid second point name: ${point2Validation.error}`);
        }
        
        const instance = await instancePool.getDefaultInstance();
        
        // Create the line segment
        const command = `${name} = Segment(${point1}, ${point2})`;
        const result = await instance.evalCommand(command);
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to create line segment');
        }
        
        // Apply styling if provided
        const styleCommands: string[] = [];
        
        if (color) {
          styleCommands.push(`SetColor(${name}, "${color}")`);
        }
        
        if (thickness) {
          styleCommands.push(`SetLineThickness(${name}, ${thickness})`);
        }
        
        if (style && style !== 'solid') {
          const lineType = style === 'dashed' ? '10' : '20';
          styleCommands.push(`SetLineStyle(${name}, ${lineType})`);
        }

        // Execute styling commands
        for (const styleCmd of styleCommands) {
          await instance.evalCommand(styleCmd);
        }

        const segmentInfo = await instance.getObjectInfo(name);

        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: true,
              command,
              segment: segmentInfo,
              styling: {
                color,
                thickness,
                style
              }
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Failed to create line segment', error);
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  },

  {
    tool: {
      name: 'geogebra_create_text',
      description: 'Create a text object in GeoGebra with specified content and position',
      inputSchema: {
        type: 'object',
        properties: {
          text: {
            type: 'string',
            description: 'Text content to display (can include GeoGebra expressions in quotes)'
          },
          x: {
            type: 'number',
            description: 'X coordinate for text position'
          },
          y: {
            type: 'number',
            description: 'Y coordinate for text position'
          },
          fontSize: {
            type: 'number',
            description: 'Font size in points (default: 12)',
            minimum: 8,
            maximum: 72
          },
          color: {
            type: 'string',
            description: 'Text color (hex format, e.g., "#000000")'
          },
          fontStyle: {
            type: 'string',
            enum: ['normal', 'bold', 'italic'],
            description: 'Font style (default: normal)'
          },
          name: {
            type: 'string',
            description: 'Optional name for the text object (auto-generated if not provided)'
          }
        },
        required: ['text', 'x', 'y']
      }
    },
    handler: async (params) => {
      try {
        const text = params['text'] as string;
        const x = params['x'] as number;
        const y = params['y'] as number;
        const fontSize = (params['fontSize'] as number) || 12;
        const color = params['color'] as string | undefined;
        const fontStyle = (params['fontStyle'] as string) || 'normal';
        const name = (params['name'] as string) || `text_${Date.now()}`;
        
        // Validate text object name
        const nameValidation = validateObjectName(name);
        if (!nameValidation.isValid) {
          throw new Error(`Invalid text name: ${nameValidation.error}`);
        }
        
        // Validate coordinates
        const coordValidation = validateCoordinates(x, y);
        if (!coordValidation.isValid) {
          throw new Error(`Invalid coordinates: ${coordValidation.error}`);
        }
        
        const instance = await instancePool.getDefaultInstance();
        
        // Create the text object
        const command = `${name} = Text(${text}, (${x}, ${y}))`;
        const result = await instance.evalCommand(command);
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to create text');
        }
        
        // Apply styling if provided
        const styleCommands: string[] = [];
        
        if (color) {
          styleCommands.push(`SetColor(${name}, "${color}")`);
        }
        
        if (fontSize !== 12) {
          styleCommands.push(`SetTextSize(${name}, ${fontSize})`);
        }
        
        if (fontStyle !== 'normal') {
          const styleNumber = fontStyle === 'bold' ? '1' : fontStyle === 'italic' ? '2' : '0';
          styleCommands.push(`SetTextStyle(${name}, ${styleNumber})`);
        }

        // Execute styling commands
        for (const styleCmd of styleCommands) {
          await instance.evalCommand(styleCmd);
        }

        const textInfo = await instance.getObjectInfo(name);

        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: true,
              command,
              textObject: textInfo,
              position: { x, y },
              styling: {
                fontSize,
                color,
                fontStyle
              }
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Failed to create text', error);
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  }
]; 