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

import { toolRegistry } from '../../src/tools';
import { GeoGebraInstance } from '../../src/utils/geogebra-instance';

describe('Function Plotting Tools (GEB-5)', () => {
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

    // Update the global mock instance so new instances created by the tools use this one
    globalMockInstance = mockGeoGebraInstance;
  });

  describe('Standard Function Plotting (geogebra_plot_function)', () => {
    it('should plot a simple quadratic function', async () => {
      // Mock specific function info for this test
      mockGeoGebraInstance.getObjectInfo.mockResolvedValueOnce({
        name: 'f',
        type: 'function',
        value: 'x^2',
        visible: true,
        defined: true,
        color: '#FF0000'
      });
      
      const result = await toolRegistry.executeTool('geogebra_plot_function', {
        name: 'f',
        expression: 'x^2'
      });

      expect(result.content[0]?.type).toBe('text');
      const response = JSON.parse(result.content[0]?.text!);
      
      expect(response.success).toBe(true);
      expect(response.command).toBe('f(x) = x^2');
      expect(response.function?.name).toBe('f');
      expect(response.function?.type).toBe('function');
      expect(response.function?.value).toBe('x^2');
    });

    it('should plot a function with domain restriction', async () => {
      const result = await toolRegistry.executeTool('geogebra_plot_function', {
        name: 'g',
        expression: 'sin(x)',
        xMin: 0,
        xMax: 6.28
      });

      expect(result.content[0]?.type).toBe('text');
      const response = JSON.parse(result.content[0]?.text!);
      
      expect(response.success).toBe(true);
      expect(response.command).toBe('g(x) = If(0 <= x <= 6.28, sin(x), ?)');
      expect(response.domain).toEqual({ xMin: 0, xMax: 6.28 });
    });

    it('should plot a function with styling options', async () => {
      const result = await toolRegistry.executeTool('geogebra_plot_function', {
        name: 'h',
        expression: '2*x + 3',
        color: '#FF0000',
        thickness: 3,
        style: 'dashed'
      });

      expect(result.content[0]?.type).toBe('text');
      const response = JSON.parse(result.content[0]?.text!);
      
      expect(response.success).toBe(true);
      expect(response.styling.color).toBe('#FF0000');
      expect(response.styling.thickness).toBe(3);
      expect(response.styling.style).toBe('dashed');
    });

    it('should validate function expressions', async () => {
      const result = await toolRegistry.executeTool('geogebra_plot_function', {
        name: 'invalid',
        expression: 'x^2 + invalid_char@'
      });

      expect(result.content[0]?.type).toBe('text');
      const response = JSON.parse(result.content[0]?.text!);
      
      expect(response.success).toBe(false);
      expect(response.error).toContain('Invalid expression');
    });

    it('should validate domain ranges', async () => {
      const result = await toolRegistry.executeTool('geogebra_plot_function', {
        name: 'f',
        expression: 'x^2',
        xMin: 10,
        xMax: 5  // Invalid: min > max
      });

      expect(result.content[0]?.type).toBe('text');
      const response = JSON.parse(result.content[0]?.text!);
      
      expect(response.success).toBe(false);
      expect(response.error).toContain('Invalid domain');
    });

    it('should validate styling parameters', async () => {
      const result = await toolRegistry.executeTool('geogebra_plot_function', {
        name: 'f',
        expression: 'x^2',
        thickness: 15  // Invalid: too thick
      });

      expect(result.content[0]?.type).toBe('text');
      const response = JSON.parse(result.content[0]?.text!);
      
      expect(response.success).toBe(false);
      expect(response.error).toContain('Invalid styling');
    });
  });

  describe('Parametric Function Plotting (geogebra_plot_parametric)', () => {
    it('should plot a circle using parametric equations', async () => {
      const result = await toolRegistry.executeTool('geogebra_plot_parametric', {
        name: 'circle',
        xExpression: 'cos(t)',
        yExpression: 'sin(t)',
        parameter: 't',
        tMin: 0,
        tMax: 6.28
      });

      expect(result.content[0]?.type).toBe('text');
      const response = JSON.parse(result.content[0]?.text!);
      
      expect(response.success).toBe(true);
      expect(response.command).toBe('circle = Curve(cos(t), sin(t), t, 0, 6.28)');
      expect(response.parametric.xExpression).toBe('cos(t)');
      expect(response.parametric.yExpression).toBe('sin(t)');
      expect(response.parametric.parameter).toBe('t');
      expect(response.parametric.range).toEqual({ tMin: 0, tMax: 6.28 });
    });

    it('should plot a spiral with custom parameter name', async () => {
      const result = await toolRegistry.executeTool('geogebra_plot_parametric', {
        name: 'spiral',
        xExpression: 's*cos(s)',
        yExpression: 's*sin(s)',
        parameter: 's',
        tMin: 0,
        tMax: 10
      });

      expect(result.content[0]?.type).toBe('text');
      const response = JSON.parse(result.content[0]?.text!);
      
      expect(response.success).toBe(true);
      expect(response.command).toBe('spiral = Curve(s*cos(s), s*sin(s), s, 0, 10)');
      expect(response.parametric.parameter).toBe('s');
    });

    it('should plot parametric curve with styling', async () => {
      const result = await toolRegistry.executeTool('geogebra_plot_parametric', {
        name: 'curve',
        xExpression: 't',
        yExpression: 't^2',
        tMin: -2,
        tMax: 2,
        color: '#00FF00',
        thickness: 2,
        style: 'dotted'
      });

      expect(result.content[0]?.type).toBe('text');
      const response = JSON.parse(result.content[0]?.text!);
      
      expect(response.success).toBe(true);
      expect(response.styling.color).toBe('#00FF00');
      expect(response.styling.thickness).toBe(2);
      expect(response.styling.style).toBe('dotted');
    });

    it('should validate parametric expressions', async () => {
      const result = await toolRegistry.executeTool('geogebra_plot_parametric', {
        name: 'invalid',
        xExpression: 'cos(x)',  // Invalid: should use parameter 't'
        yExpression: 'sin(t)',
        parameter: 't',
        tMin: 0,
        tMax: 1
      });

      expect(result.content[0]?.type).toBe('text');
      const response = JSON.parse(result.content[0]?.text!);
      
      expect(response.success).toBe(false);
      expect(response.error).toContain('Invalid expressions');
    });

    it('should use default parameter name', async () => {
      const result = await toolRegistry.executeTool('geogebra_plot_parametric', {
        name: 'default_param',
        xExpression: 't',
        yExpression: 't^3',
        tMin: -1,
        tMax: 1
        // parameter not specified, should default to 't'
      });

      expect(result.content[0]?.type).toBe('text');
      const response = JSON.parse(result.content[0]?.text!);
      
      expect(response.success).toBe(true);
      expect(response.parametric.parameter).toBe('t');
    });
  });

  describe('Implicit Function Plotting (geogebra_plot_implicit)', () => {
    it('should plot a circle using implicit equation', async () => {
      const result = await toolRegistry.executeTool('geogebra_plot_implicit', {
        name: 'circle',
        expression: 'x^2 + y^2 - 4'
      });

      expect(result.content[0]?.type).toBe('text');
      const response = JSON.parse(result.content[0]?.text!);
      
      expect(response.success).toBe(true);
      expect(response.command).toBe('circle = ImplicitCurve(x^2 + y^2 - 4)');
      expect(response.implicit.expression).toBe('x^2 + y^2 - 4');
    });

    it('should plot an ellipse with styling', async () => {
      const result = await toolRegistry.executeTool('geogebra_plot_implicit', {
        name: 'ellipse',
        expression: 'x^2/4 + y^2/9 - 1',
        color: '#0000FF',
        thickness: 4,
        style: 'dashed'
      });

      expect(result.content[0]?.type).toBe('text');
      const response = JSON.parse(result.content[0]?.text!);
      
      expect(response.success).toBe(true);
      expect(response.styling.color).toBe('#0000FF');
      expect(response.styling.thickness).toBe(4);
      expect(response.styling.style).toBe('dashed');
    });

    it('should plot a hyperbola', async () => {
      const result = await toolRegistry.executeTool('geogebra_plot_implicit', {
        name: 'hyperbola',
        expression: 'x^2 - y^2 - 1'
      });

      expect(result.content[0]?.type).toBe('text');
      const response = JSON.parse(result.content[0]?.text!);
      
      expect(response.success).toBe(true);
      expect(response.command).toBe('hyperbola = ImplicitCurve(x^2 - y^2 - 1)');
    });

    it('should validate implicit expressions contain both x and y', async () => {
      const result = await toolRegistry.executeTool('geogebra_plot_implicit', {
        name: 'invalid',
        expression: 'x^2 - 4'  // Missing y variable
      });

      expect(result.content[0]?.type).toBe('text');
      const response = JSON.parse(result.content[0]?.text!);
      
      expect(response.success).toBe(false);
      expect(response.error).toContain('Invalid expression');
      expect(response.error).toContain('both x and y variables');
    });

    it('should validate implicit expressions for invalid characters', async () => {
      const result = await toolRegistry.executeTool('geogebra_plot_implicit', {
        name: 'invalid',
        expression: 'x^2 + y^2 - invalid@#'
      });

      expect(result.content[0]?.type).toBe('text');
      const response = JSON.parse(result.content[0]?.text!);
      
      expect(response.success).toBe(false);
      expect(response.error).toContain('Invalid expression');
    });
  });

  describe('Function Plotting Integration', () => {
    it('should plot multiple functions of different types', async () => {
      // Setup mocks for the geogebra_get_objects call at the end
      const objectInfoMap = {
        'f1': { name: 'f1', type: 'function', value: 'x^2', visible: true, defined: true, color: '#FF0000' },
        'f2': { name: 'f2', type: 'curve', value: 'parametric', visible: true, defined: true, color: '#00FF00' },
        'f3': { name: 'f3', type: 'implicitcurve', value: 'x^2 + y^2 - 1', visible: true, defined: true, color: '#0000FF' }
      };
      
      // Override getAllObjectNames and getObjectInfo to work together
      mockGeoGebraInstance.getAllObjectNames.mockResolvedValue(['f1', 'f2', 'f3']);
      mockGeoGebraInstance.getObjectInfo.mockImplementation((name: string) => {
        return Promise.resolve(objectInfoMap[name as keyof typeof objectInfoMap] || null);
      });

      // Clear construction first
      await toolRegistry.executeTool('geogebra_clear_construction', {});

      // Plot standard function
      await toolRegistry.executeTool('geogebra_plot_function', {
        name: 'f1',
        expression: 'x^2',
        color: '#FF0000'
      });

      // Plot parametric curve
      await toolRegistry.executeTool('geogebra_plot_parametric', {
        name: 'f2',
        xExpression: 'cos(t)',
        yExpression: 'sin(t)',
        tMin: 0,
        tMax: 6.28,
        color: '#00FF00'
      });

      // Plot implicit curve
      await toolRegistry.executeTool('geogebra_plot_implicit', {
        name: 'f3',
        expression: 'x^2 + y^2 - 1',
        color: '#0000FF'
      });

      // Check all functions were created
      const objects = await toolRegistry.executeTool('geogebra_get_objects', {});
      const objectsResponse = JSON.parse(objects.content[0]?.text!);

      expect(objectsResponse.success).toBe(true);
      expect(objectsResponse.objectCount).toBe(3);
      
      const objectNames = objectsResponse.objects.map((obj: any) => obj.name);
      expect(objectNames).toContain('f1');
      expect(objectNames).toContain('f2');
      expect(objectNames).toContain('f3');
    });

    it('should handle function plotting with different coordinate systems', async () => {
      const result = await toolRegistry.executeTool('geogebra_plot_function', {
        name: 'f',
        expression: 'x^3',
        xMin: -2,
        xMax: 2
      });

      expect(result.content[0]?.type).toBe('text');
      const response = JSON.parse(result.content[0]?.text!);
      expect(response.success).toBe(true);

      // Test with export to ensure view configuration works
      const exportResult = await toolRegistry.executeTool('geogebra_export_png', {
        xmin: -3,
        xmax: 3,
        ymin: -8,
        ymax: 8
      });

      const exportResponse = JSON.parse(exportResult.content[0]?.text!);
      expect(exportResponse.success).toBe(true);
    });
  });
}); 