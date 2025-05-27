// Mock GeoGebraInstance BEFORE any imports to ensure the instance pool uses our mock
let globalMockInstance: any;

jest.mock('../../src/utils/geogebra-instance', () => {
  return {
    GeoGebraInstance: jest.fn().mockImplementation(() => {
      // Return the global mock instance that will be set up in beforeEach
      return globalMockInstance || {
        evalCommand: jest.fn().mockResolvedValue({ success: true, result: 'fallback' }),
        getAllObjectNames: jest.fn().mockResolvedValue([]),
        getObjectInfo: jest.fn().mockResolvedValue({ name: 'fallback', type: 'point', visible: true, defined: true }),
        newConstruction: jest.fn().mockResolvedValue(undefined),
        exportPNG: jest.fn().mockResolvedValue('base64-data'),
        exportSVG: jest.fn().mockResolvedValue('<svg></svg>'),
        exportPDF: jest.fn().mockResolvedValue('pdf-data'),
        isReady: jest.fn().mockResolvedValue(true),
        cleanup: jest.fn().mockResolvedValue(undefined),
        getState: jest.fn().mockReturnValue({ id: 'fallback-id', isReady: true, lastActivity: new Date(), config: { appName: 'classic' } }),
        initialize: jest.fn().mockResolvedValue(undefined),
        setCoordSystem: jest.fn().mockResolvedValue(undefined),
        setAxesVisible: jest.fn().mockResolvedValue(undefined),
        setGridVisible: jest.fn().mockResolvedValue(undefined),
      };
    })
  };
});

// Mock logger
jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  debug: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

// NOW import the modules - they will use our mocked GeoGebraInstance
import { ToolRegistry, toolRegistry } from '../../src/tools';
import { GeoGebraInstance } from '../../src/utils/geogebra-instance';

describe('ToolRegistry', () => {
  let registry: ToolRegistry;
  let mockGeoGebraInstance: jest.Mocked<GeoGebraInstance>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock GeoGebra instance - using jest.fn() without default values
    // Each test will set up the specific responses it needs
    mockGeoGebraInstance = {
      evalCommand: jest.fn(),
      getAllObjectNames: jest.fn(),
      getObjectInfo: jest.fn(),
      newConstruction: jest.fn(),
      exportPNG: jest.fn(),
      exportSVG: jest.fn(),
      exportPDF: jest.fn(),
      isReady: jest.fn(),
      cleanup: jest.fn(),
      getState: jest.fn(),
      initialize: jest.fn(),
      setCoordSystem: jest.fn(),
      setAxesVisible: jest.fn(),
      setGridVisible: jest.fn(),
    } as any;

    // Update the global mock instance so new instances created by the tools use this one
    globalMockInstance = mockGeoGebraInstance;
    
    // Use the global registry that has all tools registered
    registry = toolRegistry;
  });

  describe('Tool Registration', () => {
    it('should register all expected GeoGebra tools', () => {
      const tools = registry.getTools();
      const toolNames = tools.map(tool => tool.name);

      expect(toolNames).toContain('geogebra_eval_command');
      expect(toolNames).toContain('geogebra_create_point');
      expect(toolNames).toContain('geogebra_create_line');
      expect(toolNames).toContain('geogebra_create_circle');
      expect(toolNames).toContain('geogebra_create_polygon');
      expect(toolNames).toContain('geogebra_get_objects');
      expect(toolNames).toContain('geogebra_clear_construction');
      expect(toolNames).toContain('geogebra_instance_status');
      expect(toolNames).toContain('geogebra_export_png');
      expect(toolNames).toContain('geogebra_export_svg');
      expect(toolNames).toContain('geogebra_export_pdf');
      expect(toolNames).toContain('ping');
    });

    it('should return tool count', () => {
      const tools = registry.getTools();
      expect(tools.length).toBeGreaterThan(0);
      expect(typeof tools.length).toBe('number');
    });

    it('should have tools with correct structure', () => {
      const tools = registry.getTools();
      
      tools.forEach(tool => {
        expect(tool).toHaveProperty('name');
        expect(tool).toHaveProperty('description');
        expect(tool).toHaveProperty('inputSchema');
        expect(typeof tool.name).toBe('string');
        expect(typeof tool.description).toBe('string');
        expect(typeof tool.inputSchema).toBe('object');
      });
    });
  });

  describe('Tool Execution', () => {
    describe('ping tool', () => {
      it('should execute ping successfully', async () => {
        const result = await registry.executeTool('ping', {});
        
        expect(result.content).toBeDefined();
        expect(result.content[0]).toBeDefined();
        expect(result.content[0]?.type).toBe('text');
        expect(result.content[0]?.text).toBe('pong');
      });
    });

    describe('geogebra_instance_status tool', () => {
      it('should return instance status', async () => {
        mockGeoGebraInstance.isReady.mockResolvedValue(true);
        mockGeoGebraInstance.getState.mockReturnValue({
          id: 'test-id',
          isReady: true,
          lastActivity: new Date(),
          config: { appName: 'graphing' }
        });

        const result = await registry.executeTool('geogebra_instance_status', {});
        
        expect(result.content).toBeDefined();
        expect(result.content[0]).toBeDefined();
        expect(result.content[0]?.type).toBe('text');
        
        const response = JSON.parse(result.content[0]?.text!);
        expect(response.success).toBe(true);
        expect(response.status.isReady).toBe(true);
        expect(response.status.instanceId).toBe('test-id');
      });

      it('should handle not ready instance', async () => {
        mockGeoGebraInstance.isReady.mockResolvedValue(false);
        mockGeoGebraInstance.getState.mockReturnValue({
          id: 'test-id',
          isReady: false,
          lastActivity: new Date(),
          config: { appName: 'graphing' }
        });

        const result = await registry.executeTool('geogebra_instance_status', {});
        
        const response = JSON.parse(result.content[0]?.text!);
        expect(response.success).toBe(true);
        expect(response.status.isReady).toBe(false);
      });
    });

    describe('geogebra_eval_command tool', () => {
      it('should execute command successfully', async () => {
        const mockResult = {
          success: true,
          result: 'command executed'
        };
        mockGeoGebraInstance.evalCommand.mockResolvedValue(mockResult);

        const result = await registry.executeTool('geogebra_eval_command', {
          command: 'A = (1, 2)'
        });
        
        expect(mockGeoGebraInstance.evalCommand).toHaveBeenCalledWith('A = (1, 2)');
        
        const response = JSON.parse(result.content[0]?.text!);
        expect(response.success).toBe(true);
      });

      it('should handle command execution failure', async () => {
        const mockResult = {
          success: false,
          error: 'Command failed'
        };
        mockGeoGebraInstance.evalCommand.mockResolvedValue(mockResult);

        const result = await registry.executeTool('geogebra_eval_command', {
          command: 'InvalidCommand'
        });
        
        const response = JSON.parse(result.content[0]?.text!);
        expect(response.success).toBe(false);
        expect(response.error).toBe('Command failed');
      });

      it('should require command parameter', async () => {
        const result = await registry.executeTool('geogebra_eval_command', {});
        const response = JSON.parse(result.content[0]?.text!);
        expect(response.success).toBe(false);
        expect(response.error).toContain('command');
      });
    });

    describe('geogebra_create_point tool', () => {
      it('should create point successfully', async () => {
        const mockResult = {
          success: true,
          result: 'point created'
        };
        mockGeoGebraInstance.evalCommand.mockResolvedValue(mockResult);
        mockGeoGebraInstance.getObjectInfo.mockResolvedValue({
          name: 'B',
          type: 'point',
          visible: true,
          defined: true,
          x: 3,
          y: 4
        });

        const result = await registry.executeTool('geogebra_create_point', {
          name: 'B',
          x: 3,
          y: 4
        });
        
        expect(mockGeoGebraInstance.evalCommand).toHaveBeenCalledWith('B = (3, 4)');
        
        const response = JSON.parse(result.content[0]?.text!);
        expect(response.success).toBe(true);
      });

      it('should handle point creation with z coordinate', async () => {
        const mockResult = {
          success: true,
          result: 'point created'
        };
        mockGeoGebraInstance.evalCommand.mockResolvedValue(mockResult);
        mockGeoGebraInstance.getObjectInfo.mockResolvedValue({
          name: 'C',
          type: 'point',
          visible: true,
          defined: true,
          x: 1,
          y: 2,
          z: 3
        });

        await registry.executeTool('geogebra_create_point', {
          name: 'C',
          x: 1,
          y: 2,
          z: 3
        });
        
        expect(mockGeoGebraInstance.evalCommand).toHaveBeenCalledWith('C = (1, 2, 3)');
      });

      it('should require name, x, and y parameters', async () => {
        let result = await registry.executeTool('geogebra_create_point', { x: 1, y: 2 });
        let response = JSON.parse(result.content[0]?.text!);
        expect(response.success).toBe(false);
        
        result = await registry.executeTool('geogebra_create_point', { name: 'A', y: 2 });
        response = JSON.parse(result.content[0]?.text!);
        expect(response.success).toBe(false);
        
        result = await registry.executeTool('geogebra_create_point', { name: 'A', x: 1 });
        response = JSON.parse(result.content[0]?.text!);
        expect(response.success).toBe(false);
      });
    });

    describe('geogebra_get_objects tool', () => {
      it('should get all objects', async () => {
        const mockObjects = ['A', 'B', 'line1'];
        mockGeoGebraInstance.getAllObjectNames.mockResolvedValue(mockObjects);
        mockGeoGebraInstance.getObjectInfo.mockImplementation((name: string) => 
          Promise.resolve({
            name,
            type: name.startsWith('line') ? 'line' : 'point',
            visible: true,
            defined: true
          })
        );

        await registry.executeTool('geogebra_get_objects', {});
        
        expect(mockGeoGebraInstance.getAllObjectNames).toHaveBeenCalled();
      });

      it('should filter objects by type', async () => {
        const mockObjects = ['A', 'B'];
        mockGeoGebraInstance.getAllObjectNames.mockResolvedValue(mockObjects);

        await registry.executeTool('geogebra_get_objects', {
          type: 'point'
        });
        
        expect(mockGeoGebraInstance.getAllObjectNames).toHaveBeenCalledWith('point');
      });

      it('should handle empty object list', async () => {
        mockGeoGebraInstance.getAllObjectNames.mockResolvedValue([]);

        const result = await registry.executeTool('geogebra_get_objects', {});
        
        const response = JSON.parse(result.content[0]?.text!);
        expect(response.success).toBe(true);
        expect(response.objectCount).toBe(0);
        expect(response.objects).toEqual([]);
      });
    });

    describe('geogebra_export_png tool', () => {
      beforeEach(() => {
        // Add missing mock methods for export PNG
        mockGeoGebraInstance.setCoordSystem = jest.fn().mockResolvedValue(undefined);
        mockGeoGebraInstance.setAxesVisible = jest.fn().mockResolvedValue(undefined);
        mockGeoGebraInstance.setGridVisible = jest.fn().mockResolvedValue(undefined);
      });

      it('should export PNG successfully', async () => {
        const mockBase64 = 'base64-encoded-image-data';
        mockGeoGebraInstance.exportPNG.mockResolvedValue(mockBase64);

        const result = await registry.executeTool('geogebra_export_png', {
          scale: 2
        });
        
        const response = JSON.parse(result.content[0]?.text!);
        expect(response.success).toBe(true);
        expect(response.format).toBe('PNG');
        expect(response.scale).toBe(2);
      });

      it('should use default scale', async () => {
        const mockBase64 = 'base64-encoded-image-data';
        mockGeoGebraInstance.exportPNG.mockResolvedValue(mockBase64);

        const result = await registry.executeTool('geogebra_export_png', {});
        
        const response = JSON.parse(result.content[0]?.text!);
        expect(response.success).toBe(true);
        expect(response.format).toBe('PNG');
        expect(response.scale).toBe(1);
      });

      it('should handle export failure', async () => {
        mockGeoGebraInstance.exportPNG.mockRejectedValue(new Error('Export failed'));

        const result = await registry.executeTool('geogebra_export_png', {});
        const response = JSON.parse(result.content[0]?.text!);
        expect(response.success).toBe(false);
        expect(response.error).toContain('Export failed');
      });
    });

    describe('geogebra_clear_construction tool', () => {
      it('should clear construction successfully', async () => {
        mockGeoGebraInstance.newConstruction.mockResolvedValue();

        const result = await registry.executeTool('geogebra_clear_construction', {});
        
        expect(mockGeoGebraInstance.newConstruction).toHaveBeenCalled();
        
        const response = JSON.parse(result.content[0]?.text!);
        expect(response.success).toBe(true);
        expect(response.message).toBe('Construction cleared successfully');
      });

      it('should handle clear failure', async () => {
        mockGeoGebraInstance.newConstruction.mockRejectedValue(new Error('Clear failed'));

        const result = await registry.executeTool('geogebra_clear_construction', {});
        const response = JSON.parse(result.content[0]?.text!);
        expect(response.success).toBe(false);
        expect(response.error).toContain('Clear failed');
      });
    });
  });

  describe('Error Handling', () => {
    it('should throw error for unknown tool', async () => {
      await expect(registry.executeTool('unknown_tool', {})).rejects.toThrow('Tool not found: unknown_tool');
    });

    it('should handle tool execution errors', async () => {
      mockGeoGebraInstance.evalCommand.mockRejectedValue(new Error('Execution failed'));

      const result = await registry.executeTool('geogebra_eval_command', {
        command: 'A = (1, 2)'
      });
      const response = JSON.parse(result.content[0]?.text!);
      expect(response.success).toBe(false);
      expect(response.error).toContain('Execution failed');
    });
  });

  describe('Tool Lookup', () => {
    it('should find existing tools', () => {
      const tools = registry.getTools();
      
      expect(tools.find(t => t.name === 'ping')).toBeDefined();
      expect(tools.find(t => t.name === 'geogebra_eval_command')).toBeDefined();
      expect(tools.find(t => t.name === 'geogebra_export_png')).toBeDefined();
    });

    it('should return undefined for non-existent tools', () => {
      const tools = registry.getTools();
      
      expect(tools.find(t => t.name === 'non_existent_tool')).toBeUndefined();
    });
  });
}); 