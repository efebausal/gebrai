/**
 * CAS (Computer Algebra System) Tools Tests
 * Tests for Linear Issue GEB-6 implementation
 */

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

import { toolRegistry } from '../../src/tools/index';
import { GeoGebraInstance } from '../../src/utils/geogebra-instance';

describe('CAS Tools (GEB-6)', () => {
  let mockGeoGebraInstance: jest.Mocked<GeoGebraInstance>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock GeoGebra instance
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
  });

  describe('geogebra_solve_equation', () => {
    it('should solve a simple equation', async () => {
      // Mock successful equation solving
      mockGeoGebraInstance.evalCommand.mockResolvedValueOnce({ success: true, result: '{{-2, 2}}' });
      
      const result = await toolRegistry.executeTool('geogebra_solve_equation', {
        equation: 'x^2 - 4 = 0'
      });

      expect(result.content[0]?.type).toBe('text');
      const response = JSON.parse(result.content[0]?.text!);
      expect(response.success).toBe(true);
      expect(response.equation).toBe('x^2 - 4 = 0');
      expect(response.solution).toBe('{{-2, 2}}');
    });

    it('should solve equation with specified variable', async () => {
      // Mock successful equation solving with variable
      mockGeoGebraInstance.evalCommand.mockResolvedValueOnce({ success: true, result: '{{-3, 3}}' });
      
      const result = await toolRegistry.executeTool('geogebra_solve_equation', {
        equation: 'y^2 - 9 = 0',
        variable: 'y'
      });

      expect(result.content[0]?.type).toBe('text');
      const response = JSON.parse(result.content[0]?.text!);
      expect(response.success).toBe(true);
      expect(response.variable).toBe('y');
    });

    it('should validate equation format', async () => {
      const result = await toolRegistry.executeTool('geogebra_solve_equation', {
        equation: 'invalid equation'
      });

      expect(result.content[0]?.type).toBe('text');
      const response = JSON.parse(result.content[0]?.text!);
      expect(response.success).toBe(false);
      expect(response.error).toContain('Invalid equation');
    });
  });

  describe('geogebra_solve_system', () => {
    it('should solve a system of equations', async () => {
      // Mock successful system solving
      mockGeoGebraInstance.evalCommand.mockResolvedValueOnce({ success: true, result: '{{3, 2}}' });
      
      const result = await toolRegistry.executeTool('geogebra_solve_system', {
        equations: ['x + y = 5', 'x - y = 1'],
        variables: ['x', 'y']
      });

      expect(result.content[0]?.type).toBe('text');
      const response = JSON.parse(result.content[0]?.text!);
      expect(response.success).toBe(true);
      expect(response.equations).toEqual(['x + y = 5', 'x - y = 1']);
      expect(response.variables).toEqual(['x', 'y']);
    });

    it('should validate equations array', async () => {
      const result = await toolRegistry.executeTool('geogebra_solve_system', {
        equations: [],
        variables: ['x', 'y']
      });

      expect(result.content[0]?.type).toBe('text');
      const response = JSON.parse(result.content[0]?.text!);
      expect(response.success).toBe(false);
      expect(response.error).toContain('At least one equation must be provided');
    });
  });

  describe('geogebra_differentiate', () => {
    it('should differentiate a simple expression', async () => {
      // Mock successful differentiation
      mockGeoGebraInstance.evalCommand.mockResolvedValueOnce({ success: true, result: '2*x' });
      
      const result = await toolRegistry.executeTool('geogebra_differentiate', {
        expression: 'x^2'
      });

      expect(result.content[0]?.type).toBe('text');
      const response = JSON.parse(result.content[0]?.text!);
      expect(response.success).toBe(true);
      expect(response.expression).toBe('x^2');
      expect(response.variable).toBe('x');
      expect(response.derivative).toBe('2*x');
    });

    it('should differentiate with respect to specified variable', async () => {
      // Mock successful differentiation with variable
      mockGeoGebraInstance.evalCommand.mockResolvedValueOnce({ success: true, result: '3*t^2' });
      
      const result = await toolRegistry.executeTool('geogebra_differentiate', {
        expression: 't^3',
        variable: 't'
      });

      expect(result.content[0]?.type).toBe('text');
      const response = JSON.parse(result.content[0]?.text!);
      expect(response.success).toBe(true);
      expect(response.variable).toBe('t');
      expect(response.derivative).toBe('3*t^2');
    });

    it('should validate expression', async () => {
      const result = await toolRegistry.executeTool('geogebra_differentiate', {
        expression: 'invalid@expression'
      });

      expect(result.content[0]?.type).toBe('text');
      const response = JSON.parse(result.content[0]?.text!);
      expect(response.success).toBe(false);
      expect(response.error).toContain('Invalid expression');
    });
  });

  describe('geogebra_integrate', () => {
    it('should integrate a simple expression', async () => {
      // Mock successful integration
      mockGeoGebraInstance.evalCommand.mockResolvedValueOnce({ success: true, result: 'x^2/2' });
      
      const result = await toolRegistry.executeTool('geogebra_integrate', {
        expression: 'x'
      });

      expect(result.content[0]?.type).toBe('text');
      const response = JSON.parse(result.content[0]?.text!);
      expect(response.success).toBe(true);
      expect(response.expression).toBe('x');
      expect(response.variable).toBe('x');
      expect(response.integral).toBe('x^2/2');
    });

    it('should integrate with respect to specified variable', async () => {
      // Mock successful integration with variable
      mockGeoGebraInstance.evalCommand.mockResolvedValueOnce({ success: true, result: 't^3/3' });
      
      const result = await toolRegistry.executeTool('geogebra_integrate', {
        expression: 't^2',
        variable: 't'
      });

      expect(result.content[0]?.type).toBe('text');
      const response = JSON.parse(result.content[0]?.text!);
      expect(response.success).toBe(true);
      expect(response.variable).toBe('t');
      expect(response.integral).toBe('t^3/3');
    });
  });

  describe('geogebra_simplify', () => {
    it('should simplify a simple expression', async () => {
      // Mock successful simplification
      mockGeoGebraInstance.evalCommand.mockResolvedValueOnce({ success: true, result: '5*x' });
      
      const result = await toolRegistry.executeTool('geogebra_simplify', {
        expression: '2*x + 3*x'
      });

      expect(result.content[0]?.type).toBe('text');
      const response = JSON.parse(result.content[0]?.text!);
      expect(response.success).toBe(true);
      expect(response.expression).toBe('2*x + 3*x');
      expect(response.simplified).toBe('5*x');
    });

    it('should handle already simplified expressions', async () => {
      // Mock expression that's already simplified
      mockGeoGebraInstance.evalCommand.mockResolvedValueOnce({ success: true, result: 'x + 1' });
      
      const result = await toolRegistry.executeTool('geogebra_simplify', {
        expression: 'x + 1'
      });

      expect(result.content[0]?.type).toBe('text');
      const response = JSON.parse(result.content[0]?.text!);
      expect(response.success).toBe(true);
      expect(response.expression).toBe('x + 1');
    });

    it('should validate expression', async () => {
      const result = await toolRegistry.executeTool('geogebra_simplify', {
        expression: 'invalid@expression'
      });

      expect(result.content[0]?.type).toBe('text');
      const response = JSON.parse(result.content[0]?.text!);
      expect(response.success).toBe(false);
      expect(response.error).toContain('Invalid expression');
    });
  });
}); 