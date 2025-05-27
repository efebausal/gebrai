import { toolRegistry } from '../../src/tools';
import { GeoGebraInstance } from '../../src/utils/geogebra-instance';

// Mock GeoGebraInstance
jest.mock('../../src/utils/geogebra-instance');

// Mock logger
jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  debug: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

describe('GEB-3: Core Geometric Construction Tools', () => {
  let mockGeoGebraInstance: jest.Mocked<GeoGebraInstance>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock GeoGebra instance
    mockGeoGebraInstance = {
      evalCommand: jest.fn(),
      isReady: jest.fn(),
      cleanup: jest.fn(),
      getState: jest.fn(),
      initialize: jest.fn(),
      getAllObjectNames: jest.fn(),
      getObjectInfo: jest.fn(),
      newConstruction: jest.fn(),
      setCoordSystem: jest.fn(),
      setAxesVisible: jest.fn(),
      setGridVisible: jest.fn(),
      exportPNG: jest.fn(),
      exportSVG: jest.fn(),
    } as any;

    // Mock the GeoGebraInstance constructor 
    (GeoGebraInstance as jest.MockedClass<typeof GeoGebraInstance>).mockImplementation(() => mockGeoGebraInstance);
    
    // Setup default return values for successful geometric constructions
    mockGeoGebraInstance.evalCommand.mockResolvedValue({ success: true, result: 'success' });
    mockGeoGebraInstance.initialize.mockResolvedValue(undefined);
    mockGeoGebraInstance.isReady.mockResolvedValue(true);
    mockGeoGebraInstance.getAllObjectNames.mockResolvedValue([]);
  });

  describe('Tool Registration', () => {
    it('should have all required geometric construction tools', () => {
      const tools = toolRegistry.getTools();
      const toolNames = tools.map(tool => tool.name);

      // Check for all required tools from GEB-3
      expect(toolNames).toContain('geogebra_create_point');
      expect(toolNames).toContain('geogebra_create_line');
      expect(toolNames).toContain('geogebra_create_circle');
      expect(toolNames).toContain('geogebra_create_polygon');
    });

    it('should have proper tool schemas', () => {
      const tools = toolRegistry.getTools();
      
      // Test create_point tool schema
      const pointTool = tools.find(t => t.name === 'geogebra_create_point');
      expect(pointTool).toBeDefined();
      expect(pointTool?.inputSchema.required).toEqual(['name', 'x', 'y']);
      
      // Test create_circle tool schema
      const circleTool = tools.find(t => t.name === 'geogebra_create_circle');
      expect(circleTool).toBeDefined();
      expect(circleTool?.inputSchema.oneOf).toBeDefined();
      expect(circleTool?.inputSchema.oneOf).toHaveLength(2);
      
      // Test create_polygon tool schema
      const polygonTool = tools.find(t => t.name === 'geogebra_create_polygon');
      expect(polygonTool).toBeDefined();
      expect(polygonTool?.inputSchema.required).toEqual(['name', 'vertices']);
      
      // Test create_line tool schema (enhanced)
      const lineTool = tools.find(t => t.name === 'geogebra_create_line');
      expect(lineTool).toBeDefined();
      expect(lineTool?.inputSchema.oneOf).toBeDefined();
      expect(lineTool?.inputSchema.oneOf).toHaveLength(2);
    });
  });

  describe('Tool Execution', () => {
    it('should create a point successfully', async () => {
      const result = await toolRegistry.executeTool('geogebra_create_point', {
        name: 'A',
        x: 1,
        y: 2
      });

      expect(result.content).toBeDefined();
      expect(result.content[0]?.type).toBe('text');
      
      const response = JSON.parse(result.content[0]?.text!);
      expect(response.success).toBe(true);
      expect(response.command).toBe('A = (1, 2)');
    });

    it('should create a circle with center and radius', async () => {
      const result = await toolRegistry.executeTool('geogebra_create_circle', {
        name: 'c1',
        center: 'A',
        radius: 5
      });

      expect(result.content).toBeDefined();
      const response = JSON.parse(result.content[0]?.text!);
      expect(response.success).toBe(true);
      expect(response.command).toBe('c1 = Circle(A, 5)');
    });

    it('should create a circle through three points', async () => {
      const result = await toolRegistry.executeTool('geogebra_create_circle', {
        name: 'c2',
        point1: 'A',
        point2: 'B',
        point3: 'C'
      });

      expect(result.content).toBeDefined();
      const response = JSON.parse(result.content[0]?.text!);
      expect(response.success).toBe(true);
      expect(response.command).toBe('c2 = Circle(A, B, C)');
    });

    it('should create a polygon with multiple vertices', async () => {
      const result = await toolRegistry.executeTool('geogebra_create_polygon', {
        name: 'poly1',
        vertices: ['A', 'B', 'C', 'D']
      });

      expect(result.content).toBeDefined();
      const response = JSON.parse(result.content[0]?.text!);
      expect(response.success).toBe(true);
      expect(response.command).toBe('poly1 = Polygon(A, B, C, D)');
      expect(response.vertexCount).toBe(4);
    });

    it('should create a line through two points', async () => {
      // First create the points
      await toolRegistry.executeTool('geogebra_create_point', {
        name: 'A',
        x: 0,
        y: 0
      });
      
      await toolRegistry.executeTool('geogebra_create_point', {
        name: 'B',
        x: 1,
        y: 1
      });
      
      // Now create the line
      const result = await toolRegistry.executeTool('geogebra_create_line', {
        name: 'line1',
        point1: 'A',
        point2: 'B'
      });

      expect(result.content).toBeDefined();
      const response = JSON.parse(result.content[0]?.text!);
      expect(response.success).toBe(true);
      expect(response.command).toBe('line1 = Line(A, B)');
      expect(response.method).toBe('two-point');
    });

    it('should create a line from equation', async () => {
      const result = await toolRegistry.executeTool('geogebra_create_line', {
        name: 'line2',
        equation: 'y = 2x + 3'
      });

      expect(result.content).toBeDefined();
      const response = JSON.parse(result.content[0]?.text!);
      expect(response.success).toBe(true);
      expect(response.command).toBe('line2: y = 2x + 3');
      expect(response.method).toBe('equation');
    });
  });

  describe('Parameter Validation', () => {
    it('should validate point names', async () => {
      const result = await toolRegistry.executeTool('geogebra_create_point', {
        name: '123invalid',
        x: 1,
        y: 2
      });

      expect(result.isError).toBe(true);
      const response = JSON.parse(result.content[0]?.text!);
      expect(response.success).toBe(false);
      expect(response.error).toContain('Invalid name');
    });

    it('should validate coordinates', async () => {
      const result = await toolRegistry.executeTool('geogebra_create_point', {
        name: 'A',
        x: Infinity,
        y: 2
      });

      expect(result.isError).toBe(true);
      const response = JSON.parse(result.content[0]?.text!);
      expect(response.success).toBe(false);
      expect(response.error).toContain('Invalid coordinates');
    });

    it('should validate circle radius', async () => {
      const result = await toolRegistry.executeTool('geogebra_create_circle', {
        name: 'c1',
        center: 'A',
        radius: -5
      });

      expect(result.isError).toBe(true);
      const response = JSON.parse(result.content[0]?.text!);
      expect(response.success).toBe(false);
      expect(response.error).toContain('Invalid radius');
    });

    it('should validate polygon vertices', async () => {
      const result = await toolRegistry.executeTool('geogebra_create_polygon', {
        name: 'poly1',
        vertices: ['A', 'B'] // Only 2 vertices, need at least 3
      });

      expect(result.isError).toBe(true);
      const response = JSON.parse(result.content[0]?.text!);
      expect(response.success).toBe(false);
      expect(response.error).toContain('at least 3 vertices');
    });

    it('should validate line equation format', async () => {
      const result = await toolRegistry.executeTool('geogebra_create_line', {
        name: 'line1',
        equation: 'invalid equation'
      });

      expect(result.isError).toBe(true);
      const response = JSON.parse(result.content[0]?.text!);
      expect(response.success).toBe(false);
      expect(response.error).toContain('Invalid equation');
    });
  });

  describe('Tool Discovery', () => {
    it('should support tools/list functionality', () => {
      const tools = toolRegistry.getTools();
      
      // Verify all tools have proper MCP structure
      tools.forEach(tool => {
        expect(tool).toHaveProperty('name');
        expect(tool).toHaveProperty('description');
        expect(tool).toHaveProperty('inputSchema');
        expect(tool.inputSchema).toHaveProperty('type', 'object');
        expect(tool.inputSchema).toHaveProperty('properties');
      });
    });

    it('should have clear tool descriptions', () => {
      const tools = toolRegistry.getTools();
      
      const pointTool = tools.find(t => t.name === 'geogebra_create_point');
      expect(pointTool?.description).toContain('point');
      expect(pointTool?.description).toContain('coordinates');
      
      const circleTool = tools.find(t => t.name === 'geogebra_create_circle');
      expect(circleTool?.description).toContain('circle');
      expect(circleTool?.description).toContain('center');
      expect(circleTool?.description).toContain('radius');
      expect(circleTool?.description).toContain('three points');
      
      const polygonTool = tools.find(t => t.name === 'geogebra_create_polygon');
      expect(polygonTool?.description).toContain('polygon');
      expect(polygonTool?.description).toContain('vertices');
    });
  });
}); 