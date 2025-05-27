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

describe('Enhanced Export Functionality (GEB-4)', () => {
  let mockGeoGebraInstance: jest.Mocked<GeoGebraInstance>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock GeoGebra instance
    mockGeoGebraInstance = {
      exportPNG: jest.fn(),
      exportSVG: jest.fn(),
      exportPDF: jest.fn(),
      setCoordSystem: jest.fn(),
      setAxesVisible: jest.fn(),
      setGridVisible: jest.fn(),
      isReady: jest.fn(),
      cleanup: jest.fn(),
      getState: jest.fn(),
      initialize: jest.fn(),
      evalCommand: jest.fn(),
      getAllObjectNames: jest.fn(),
      getObjectInfo: jest.fn(),
      newConstruction: jest.fn(),
    } as any;

    // Mock the GeoGebraInstance constructor 
    (GeoGebraInstance as jest.MockedClass<typeof GeoGebraInstance>).mockImplementation(() => mockGeoGebraInstance);
    
    // Setup default return values for successful exports
    mockGeoGebraInstance.exportPNG.mockResolvedValue('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
    mockGeoGebraInstance.exportSVG.mockResolvedValue('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="white"/></svg>');
    mockGeoGebraInstance.setCoordSystem.mockResolvedValue(undefined);
    mockGeoGebraInstance.setAxesVisible.mockResolvedValue(undefined);
    mockGeoGebraInstance.setGridVisible.mockResolvedValue(undefined);
    mockGeoGebraInstance.initialize.mockResolvedValue(undefined);
  });

  describe('PNG Export with Enhanced Parameters', () => {
    it('should export PNG with basic parameters', async () => {
      const result = await toolRegistry.executeTool('geogebra_export_png', {
        scale: 2,
        transparent: true,
        dpi: 150
      });

      expect(result.content[0]?.type).toBe('text');
      const response = JSON.parse(result.content[0]?.text!);
      
      expect(response.success).toBe(true);
      expect(response.format).toBe('PNG');
      expect(response.scale).toBe(2);
      expect(response.transparent).toBe(true);
      expect(response.dpi).toBe(150);
      expect(response.encoding).toBe('base64');
      expect(response.data).toBeDefined();
    });

    it('should export PNG with width and height', async () => {
      const result = await toolRegistry.executeTool('geogebra_export_png', {
        width: 1200,
        height: 800,
        transparent: false,
        dpi: 300
      });

      expect(result.content[0]?.type).toBe('text');
      const response = JSON.parse(result.content[0]?.text!);
      
      expect(response.success).toBe(true);
      expect(response.width).toBe(1200);
      expect(response.height).toBe(800);
      expect(response.transparent).toBe(false);
      expect(response.dpi).toBe(300);
    });

    it('should export PNG with view configuration', async () => {
      const result = await toolRegistry.executeTool('geogebra_export_png', {
        xmin: -10,
        xmax: 10,
        ymin: -5,
        ymax: 5,
        showAxes: false,
        showGrid: true
      });

      expect(result.content[0]?.type).toBe('text');
      const response = JSON.parse(result.content[0]?.text!);
      
      expect(response.success).toBe(true);
      expect(response.viewSettings.coordSystem).toEqual({
        xmin: -10,
        xmax: 10,
        ymin: -5,
        ymax: 5
      });
      expect(response.viewSettings.showAxes).toBe(false);
      expect(response.viewSettings.showGrid).toBe(true);
    });

    it('should use default values when parameters are not provided', async () => {
      const result = await toolRegistry.executeTool('geogebra_export_png', {});

      expect(result.content[0]?.type).toBe('text');
      const response = JSON.parse(result.content[0]?.text!);
      
      expect(response.success).toBe(true);
      expect(response.scale).toBe(1);
      expect(response.transparent).toBe(false);
      expect(response.dpi).toBe(72);
      expect(response.viewSettings.showAxes).toBe(true);
      expect(response.viewSettings.showGrid).toBe(false);
    });

    it('should handle partial view configuration', async () => {
      const result = await toolRegistry.executeTool('geogebra_export_png', {
        xmin: -10,
        xmax: 10
        // Missing ymin and ymax - should not apply coordinate system
      });

      expect(result.content[0]?.type).toBe('text');
      const response = JSON.parse(result.content[0]?.text!);
      
      expect(response.success).toBe(true);
      // The coordinate system should not be set since ymin and ymax are missing
      // But the response will still show the provided parameters
      expect(response.viewSettings.coordSystem).toBeUndefined();
    });
  });

  describe('SVG Export with Enhanced Parameters', () => {
    it('should export SVG with view configuration', async () => {
      const result = await toolRegistry.executeTool('geogebra_export_svg', {
        xmin: -5,
        xmax: 5,
        ymin: -3,
        ymax: 3,
        showAxes: true,
        showGrid: false
      });

      expect(result.content[0]?.type).toBe('text');
      const response = JSON.parse(result.content[0]?.text!);
      
      expect(response.success).toBe(true);
      expect(response.format).toBe('SVG');
      expect(response.viewSettings.coordSystem).toEqual({
        xmin: -5,
        xmax: 5,
        ymin: -3,
        ymax: 3
      });
      expect(response.viewSettings.showAxes).toBe(true);
      expect(response.viewSettings.showGrid).toBe(false);
      expect(response.encoding).toBe('utf8');
      expect(response.data).toBeDefined();
    });

    it('should export SVG with default settings', async () => {
      const result = await toolRegistry.executeTool('geogebra_export_svg', {});

      expect(result.content[0]?.type).toBe('text');
      const response = JSON.parse(result.content[0]?.text!);
      
      expect(response.success).toBe(true);
      expect(response.format).toBe('SVG');
      expect(response.viewSettings.showAxes).toBe(true);
      expect(response.viewSettings.showGrid).toBe(false);
      expect(response.viewSettings.coordSystem).toBeUndefined();
    });
  });

  describe('Export Parameter Validation', () => {
    it('should handle invalid scale values gracefully', async () => {
      const result = await toolRegistry.executeTool('geogebra_export_png', {
        scale: -1 // Invalid scale
      });

      expect(result.content[0]?.type).toBe('text');
      const response = JSON.parse(result.content[0]?.text!);
      
      // Should still work with the provided scale (mock doesn't validate)
      expect(response.success).toBe(true);
      expect(response.scale).toBe(-1);
    });
  });
}); 