/**
 * Animation Tools Tests
 * Tests for GEB-7: Animation System Implementation
 */

import { toolRegistry } from '../../src/tools';
import { MockGeoGebraInstance } from '../../src/utils/geogebra-mock';

// Mock the instance pool to use our mock
jest.mock('../../src/utils/geogebra-mock');

describe('Animation Tools (GEB-7)', () => {
  let mockInstance: jest.Mocked<MockGeoGebraInstance>;

  beforeEach(() => {
    
    // Create a mock instance
    mockInstance = {
      evalCommand: jest.fn(),
      setValue: jest.fn(),
      setAnimating: jest.fn(),
      setAnimationSpeed: jest.fn(),
      startAnimation: jest.fn(),
      stopAnimation: jest.fn(),
      isAnimationRunning: jest.fn(),
      setTrace: jest.fn(),
      exists: jest.fn(),
      getObjectInfo: jest.fn(),
      getAllObjectNames: jest.fn(),
      newConstruction: jest.fn(),
      setCoordSystem: jest.fn(),
      setAxesVisible: jest.fn(),
      setGridVisible: jest.fn(),
      exportPNG: jest.fn(),
      exportSVG: jest.fn(),
    } as any;

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('geogebra_create_slider', () => {
    it('should create a slider with basic parameters', async () => {
      mockInstance.evalCommand.mockResolvedValue({ success: true });
      mockInstance.setValue.mockResolvedValue();
      mockInstance.getObjectInfo.mockResolvedValue({
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
      mockInstance.evalCommand.mockResolvedValue({ success: true });
      mockInstance.setValue.mockResolvedValue();
      mockInstance.getObjectInfo.mockResolvedValue({
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
      mockInstance.exists.mockResolvedValue(true);
      mockInstance.setAnimating.mockResolvedValue();
      mockInstance.setAnimationSpeed.mockResolvedValue();
      mockInstance.getObjectInfo.mockResolvedValue({
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
      mockInstance.exists.mockResolvedValue(true);
      mockInstance.setAnimating.mockResolvedValue();
      mockInstance.getObjectInfo.mockResolvedValue({
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
      mockInstance.exists.mockResolvedValue(false);

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
      mockInstance.exists.mockResolvedValue(true);
      mockInstance.setTrace.mockResolvedValue();
      mockInstance.getObjectInfo.mockResolvedValue({
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
      mockInstance.exists.mockResolvedValue(true);
      mockInstance.setTrace.mockResolvedValue();
      mockInstance.getObjectInfo.mockResolvedValue({
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
      mockInstance.startAnimation.mockResolvedValue();
      mockInstance.isAnimationRunning.mockResolvedValue(true);

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
      mockInstance.stopAnimation.mockResolvedValue();
      mockInstance.isAnimationRunning.mockResolvedValue(false);

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
      mockInstance.isAnimationRunning.mockResolvedValue(true);

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
      mockInstance.getAllObjectNames.mockResolvedValue(['slider1', 'point1', 'curve1']);
      mockInstance.startAnimation.mockResolvedValue();
      mockInstance.stopAnimation.mockResolvedValue();
      mockInstance.exportPNG.mockResolvedValue('base64-frame-data');

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
      mockInstance.newConstruction.mockResolvedValue();
      mockInstance.evalCommand.mockResolvedValue({ success: true });
      mockInstance.setValue.mockResolvedValue();
      mockInstance.setAnimating.mockResolvedValue();
      mockInstance.setAnimationSpeed.mockResolvedValue();
      mockInstance.setTrace.mockResolvedValue();
      mockInstance.setCoordSystem.mockResolvedValue();
      mockInstance.setAxesVisible.mockResolvedValue();
      mockInstance.setGridVisible.mockResolvedValue();
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