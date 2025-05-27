/**
 * Animation Tools Tests
 * Tests for GEB-7: Animation System Implementation
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
        setAnimating: jest.fn().mockResolvedValue(undefined),
        setAnimationSpeed: jest.fn().mockResolvedValue(undefined),
        startAnimation: jest.fn().mockResolvedValue(undefined),
        stopAnimation: jest.fn().mockResolvedValue(undefined),
        isAnimationRunning: jest.fn().mockResolvedValue(false),
        setTracing: jest.fn().mockResolvedValue(undefined),
        clearTrace: jest.fn().mockResolvedValue(undefined),
        exists: jest.fn().mockResolvedValue(true),
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

describe('Animation Tools (GEB-7)', () => {
  let mockGeoGebraInstance: jest.Mocked<GeoGebraInstance>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock GeoGebra instance
    mockGeoGebraInstance = {
      evalCommand: jest.fn(),
      getAllObjectNames: jest.fn().mockResolvedValue(['slider1', 'point1']), // Default to having some objects
      getObjectInfo: jest.fn(),
      newConstruction: jest.fn(),
      exportPNG: jest.fn().mockResolvedValue('base64-data'),
      exportSVG: jest.fn().mockResolvedValue('<svg></svg>'),
      exportPDF: jest.fn(),
      isReady: jest.fn(),
      cleanup: jest.fn(),
      getState: jest.fn(),
      initialize: jest.fn(),
      setCoordSystem: jest.fn(),
      setAxesVisible: jest.fn(),
      setGridVisible: jest.fn(),
      setAnimating: jest.fn(),
      setAnimationSpeed: jest.fn(),
      startAnimation: jest.fn(),
      stopAnimation: jest.fn(),
      isAnimationRunning: jest.fn().mockResolvedValue(true), // Default to animation running
      setTracing: jest.fn(), // Fixed typo: was setTracing, should be setTrace
              setTrace: jest.fn(), // Add the correct method name
        clearTrace: jest.fn(),
        exists: jest.fn().mockResolvedValue(true), // Default to object existing
        setValue: jest.fn(), // Add missing setValue method
      } as any;

      // Update the global mock instance so new instances created by the tools use this one
      globalMockInstance = mockGeoGebraInstance;
      
      // Clear all mock history to ensure clean state for each test
      jest.clearAllMocks();
  });

  describe('geogebra_create_slider', () => {
    it('should create a slider with basic parameters', async () => {
      mockGeoGebraInstance.evalCommand.mockResolvedValue({ success: true });
      mockGeoGebraInstance.setValue.mockResolvedValue();
      mockGeoGebraInstance.getObjectInfo.mockResolvedValue({
        name: 'testSlider',
        type: 'slider',
        visible: true,
        defined: true,
        value: 0
      });

      const result = await toolRegistry.executeTool('geogebra_create_slider', {
        name: 'testSlider',
        min: 0,
        max: 10
      });

      expect(result.content[0]?.type).toBe('text');
      const response = JSON.parse(result.content[0]?.text!);
      expect(response.success).toBe(true);
      expect(response.slider.name).toBe('testSlider');
      expect(response.slider.min).toBe(0);
      expect(response.slider.max).toBe(10);
    });

    it('should validate slider parameters', async () => {
      const result = await toolRegistry.executeTool('geogebra_create_slider', {
        name: 'testSlider',
        min: 10,
        max: 5  // Invalid: min > max
      });

      expect(result.content[0]?.type).toBe('text');
      const response = JSON.parse(result.content[0]?.text!);
      expect(response.success).toBe(false);
      expect(response.error).toContain('Minimum value must be less than maximum value');
    });

    it('should create slider with advanced parameters', async () => {
      mockGeoGebraInstance.evalCommand.mockResolvedValue({ success: true });
      mockGeoGebraInstance.setValue.mockResolvedValue();
      mockGeoGebraInstance.getObjectInfo.mockResolvedValue({
        name: 'angleSlider',
        type: 'slider',
        visible: true,
        defined: true,
        value: 1.57
      });

      const result = await toolRegistry.executeTool('geogebra_create_slider', {
        name: 'angleSlider',
        min: 0,
        max: 6.28,
        increment: 0.1,
        defaultValue: 1.57,
        width: 200,
        isAngle: true,
        horizontal: false
      });

      expect(result.content[0]?.type).toBe('text');
      const response = JSON.parse(result.content[0]?.text!);
      expect(response.success).toBe(true);
      expect(response.slider.isAngle).toBe(true);
      expect(response.slider.horizontal).toBe(false);
      expect(response.slider.width).toBe(200);
    });
  });

  describe('geogebra_animate_parameter', () => {
    it('should enable animation for an object', async () => {
      mockGeoGebraInstance.exists.mockResolvedValue(true);
      mockGeoGebraInstance.setAnimating.mockResolvedValue();
      mockGeoGebraInstance.setAnimationSpeed.mockResolvedValue();
      mockGeoGebraInstance.getObjectInfo.mockResolvedValue({
        name: 'testSlider',
        type: 'slider',
        visible: true,
        defined: true,
        value: 5
      });

      const result = await toolRegistry.executeTool('geogebra_animate_parameter', {
        objectName: 'testSlider',
        animate: true,
        speed: 2
      });

      expect(result.content[0]?.type).toBe('text');
      const response = JSON.parse(result.content[0]?.text!);
      expect(response.success).toBe(true);
      expect(response.animation.animate).toBe(true);
      expect(response.animation.speed).toBe(2);
    });

    it('should disable animation for an object', async () => {
      mockGeoGebraInstance.exists.mockResolvedValue(true);
      mockGeoGebraInstance.setAnimating.mockResolvedValue();
      mockGeoGebraInstance.getObjectInfo.mockResolvedValue({
        name: 'testSlider',
        type: 'slider',
        visible: true,
        defined: true,
        value: 5
      });

      const result = await toolRegistry.executeTool('geogebra_animate_parameter', {
        objectName: 'testSlider',
        animate: false
      });

      expect(result.content[0]?.type).toBe('text');
      const response = JSON.parse(result.content[0]?.text!);
      expect(response.success).toBe(true);
      expect(response.animation.animate).toBe(false);
      expect(response.animation.speed).toBe(null);
    });

    it('should validate animation speed', async () => {
      const result = await toolRegistry.executeTool('geogebra_animate_parameter', {
        objectName: 'testSlider',
        animate: true,
        speed: 15  // Invalid: > 10
      });

      expect(result.content[0]?.type).toBe('text');
      const response = JSON.parse(result.content[0]?.text!);
      expect(response.success).toBe(false);
      expect(response.error).toContain('Animation speed should not exceed 10');
    });

    it('should check if object exists', async () => {
      // Update global mock instance to return false for exists
      globalMockInstance.exists = jest.fn().mockResolvedValue(false);
      mockGeoGebraInstance.exists = globalMockInstance.exists;

      const result = await toolRegistry.executeTool('geogebra_animate_parameter', {
        objectName: 'nonExistentObject',
        animate: true
      });

      expect(result.content[0]?.type).toBe('text');
      const response = JSON.parse(result.content[0]?.text!);
      expect(response.success).toBe(false);
      expect(response.error).toContain('Object nonExistentObject does not exist');
    });
  });

  describe('geogebra_trace_object', () => {
    it('should enable tracing for an object', async () => {
      mockGeoGebraInstance.exists.mockResolvedValue(true);
      mockGeoGebraInstance.setTrace.mockResolvedValue();
      mockGeoGebraInstance.getObjectInfo.mockResolvedValue({
        name: 'movingPoint',
        type: 'point',
        visible: true,
        defined: true,
        x: 1,
        y: 2
      });

      const result = await toolRegistry.executeTool('geogebra_trace_object', {
        objectName: 'movingPoint',
        enableTrace: true
      });

      expect(result.content[0]?.type).toBe('text');
      const response = JSON.parse(result.content[0]?.text!);
      expect(response.success).toBe(true);
      expect(response.trace.enableTrace).toBe(true);
    });

    it('should disable tracing for an object', async () => {
      mockGeoGebraInstance.exists.mockResolvedValue(true);
      mockGeoGebraInstance.setTrace.mockResolvedValue();
      mockGeoGebraInstance.getObjectInfo.mockResolvedValue({
        name: 'movingPoint',
        type: 'point',
        visible: true,
        defined: true,
        x: 1,
        y: 2
      });

      const result = await toolRegistry.executeTool('geogebra_trace_object', {
        objectName: 'movingPoint',
        enableTrace: false
      });

      expect(result.content[0]?.type).toBe('text');
      const response = JSON.parse(result.content[0]?.text!);
      expect(response.success).toBe(true);
      expect(response.trace.enableTrace).toBe(false);
    });
  });

  describe('geogebra_start_animation', () => {
    it('should start all animations', async () => {
      mockGeoGebraInstance.startAnimation.mockResolvedValue();
      mockGeoGebraInstance.isAnimationRunning.mockResolvedValue(true);

      const result = await toolRegistry.executeTool('geogebra_start_animation', {});

      expect(result.content[0]?.type).toBe('text');
      const response = JSON.parse(result.content[0]?.text!);
      expect(response.success).toBe(true);
      expect(response.action).toBe('start_animation');
      expect(response.isRunning).toBe(true);
    });
  });

  describe('geogebra_stop_animation', () => {
    it('should stop all animations', async () => {
      // Update global mock instance to return false for isAnimationRunning
      mockGeoGebraInstance.stopAnimation.mockResolvedValue(undefined);
      globalMockInstance.isAnimationRunning = jest.fn().mockResolvedValue(false);
      mockGeoGebraInstance.isAnimationRunning = globalMockInstance.isAnimationRunning;

      const result = await toolRegistry.executeTool('geogebra_stop_animation', {});

      expect(result.content[0]?.type).toBe('text');
      const response = JSON.parse(result.content[0]?.text!);
      expect(response.success).toBe(true);
      expect(response.action).toBe('stop_animation');
      expect(response.isRunning).toBe(false);
    });
  });

  describe('geogebra_animation_status', () => {
    it('should check animation status', async () => {
      mockGeoGebraInstance.isAnimationRunning.mockResolvedValue(true);

      const result = await toolRegistry.executeTool('geogebra_animation_status', {});

      expect(result.content[0]?.type).toBe('text');
      const response = JSON.parse(result.content[0]?.text!);
      expect(response.success).toBe(true);
      expect(response.action).toBe('check_animation_status');
      expect(response.isRunning).toBe(true);
    });
  });

  describe('geogebra_export_animation', () => {
    it('should export animation frames', async () => {
      // Set up mock to have objects available
      mockGeoGebraInstance.getAllObjectNames.mockResolvedValueOnce(['slider1', 'point1', 'curve1']);
      mockGeoGebraInstance.startAnimation.mockResolvedValue(undefined);
      mockGeoGebraInstance.stopAnimation.mockResolvedValue(undefined);
      mockGeoGebraInstance.exportPNG.mockResolvedValue('base64-frame-data');

      const result = await toolRegistry.executeTool('geogebra_export_animation', {
        frameCount: 10,
        frameDelay: 100,
        format: 'png'
      });

      expect(result.content[0]?.type).toBe('text');
      const response = JSON.parse(result.content[0]?.text!);
      expect(response.success).toBe(true);
      expect(response.export.frameCount).toBe(10);
      expect(response.export.frameDelay).toBe(100);
      expect(response.export.format).toBe('png');
    });

    it('should validate export parameters', async () => {
      // No need to set up getAllObjectNames mock since validation should happen first
      const result = await toolRegistry.executeTool('geogebra_export_animation', {
        frameCount: 500,  // Invalid: > 300
        frameDelay: 100
      });

      expect(result.content[0]?.type).toBe('text');
      const response = JSON.parse(result.content[0]?.text!);
      expect(response.success).toBe(false);
      expect(response.error).toContain('Frame count should not exceed 300');
    });
  });

  describe('geogebra_animation_demo', () => {
    beforeEach(() => {
      mockGeoGebraInstance.newConstruction.mockResolvedValue();
      mockGeoGebraInstance.evalCommand.mockResolvedValue({ success: true });
      mockGeoGebraInstance.setValue.mockResolvedValue();
      mockGeoGebraInstance.setAnimating.mockResolvedValue();
      mockGeoGebraInstance.setAnimationSpeed.mockResolvedValue();
      mockGeoGebraInstance.setTrace.mockResolvedValue();
      mockGeoGebraInstance.setCoordSystem.mockResolvedValue();
      mockGeoGebraInstance.setAxesVisible.mockResolvedValue();
      mockGeoGebraInstance.setGridVisible.mockResolvedValue();
    });

    it('should create parametric spiral demo', async () => {
      const result = await toolRegistry.executeTool('geogebra_animation_demo', {
        demoType: 'parametric_spiral',
        animationSpeed: 1.5
      });

      expect(result.content[0]?.type).toBe('text');
      const response = JSON.parse(result.content[0]?.text!);
      expect(response.success).toBe(true);
      expect(response.demo.type).toBe('parametric_spiral');
      expect(response.demo.animationSpeed).toBe(1.5);
      expect(response.demo.createdObjects).toContain('t');
      expect(response.demo.createdObjects).toContain('spiral');
      expect(response.demo.createdObjects).toContain('P');
    });

    it('should create pendulum demo', async () => {
      const result = await toolRegistry.executeTool('geogebra_animation_demo', {
        demoType: 'pendulum'
      });

      expect(result.content[0]?.type).toBe('text');
      const response = JSON.parse(result.content[0]?.text!);
      expect(response.success).toBe(true);
      expect(response.demo.type).toBe('pendulum');
      expect(response.demo.createdObjects).toContain('angle');
      expect(response.demo.createdObjects).toContain('bob');
      expect(response.demo.createdObjects).toContain('rod');
    });

    it('should create wave function demo', async () => {
      const result = await toolRegistry.executeTool('geogebra_animation_demo', {
        demoType: 'wave_function'
      });

      expect(result.content[0]?.type).toBe('text');
      const response = JSON.parse(result.content[0]?.text!);
      expect(response.success).toBe(true);
      expect(response.demo.type).toBe('wave_function');
      expect(response.demo.createdObjects).toContain('time');
      expect(response.demo.createdObjects).toContain('freq');
      expect(response.demo.createdObjects).toContain('f');
    });

    it('should create circle trace demo', async () => {
      const result = await toolRegistry.executeTool('geogebra_animation_demo', {
        demoType: 'circle_trace'
      });

      expect(result.content[0]?.type).toBe('text');
      const response = JSON.parse(result.content[0]?.text!);
      expect(response.success).toBe(true);
      expect(response.demo.type).toBe('circle_trace');
      expect(response.demo.createdObjects).toContain('theta');
      expect(response.demo.createdObjects).toContain('tracePoint');
      expect(response.demo.createdObjects).toContain('circle1');
      expect(response.demo.createdObjects).toContain('circle2');
    });

    it('should use default values when no parameters provided', async () => {
      const result = await toolRegistry.executeTool('geogebra_animation_demo', {});

      expect(result.content[0]?.type).toBe('text');
      const response = JSON.parse(result.content[0]?.text!);
      expect(response.success).toBe(true);
      expect(response.demo.type).toBe('parametric_spiral'); // default
      expect(response.demo.animationSpeed).toBe(1); // default
    });
  });

  describe('Tool Registration', () => {
    it('should register all animation tools', () => {
      const tools = toolRegistry.getTools();
      const animationTools = [
        'geogebra_create_slider',
        'geogebra_animate_parameter',
        'geogebra_trace_object',
        'geogebra_start_animation',
        'geogebra_stop_animation',
        'geogebra_animation_status',
        'geogebra_export_animation',
        'geogebra_animation_demo'
      ];

      for (const toolName of animationTools) {
        expect(tools.some(tool => tool.name === toolName)).toBe(true);
      }
    });

    it('should have proper schemas for animation tools', () => {
      const tools = toolRegistry.getTools();
      const sliderTool = tools.find(t => t.name === 'geogebra_create_slider');
      
      expect(sliderTool).toBeDefined();
      expect(sliderTool!.inputSchema.properties).toHaveProperty('name');
      expect(sliderTool!.inputSchema.properties).toHaveProperty('min');
      expect(sliderTool!.inputSchema.properties).toHaveProperty('max');
      expect(sliderTool!.inputSchema.required).toContain('name');
      expect(sliderTool!.inputSchema.required).toContain('min');
      expect(sliderTool!.inputSchema.required).toContain('max');
    });
  });
}); 