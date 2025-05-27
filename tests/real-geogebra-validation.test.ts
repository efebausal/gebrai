/**
 * Real GeoGebra Implementation Validation Test
 * Tests the actual browser-based GeoGebra integration before switching from mock
 */

import { GeoGebraInstance } from '../src/utils/geogebra-instance';

describe('Real GeoGebra Implementation Validation', () => {
  let instance: GeoGebraInstance;
  
  beforeAll(async () => {
    instance = new GeoGebraInstance({
      appName: 'classic',  // Use classic app for full functionality
      width: 800,
      height: 600,
      showMenuBar: false,
      showToolBar: false,
      showAlgebraInput: false
    });
    
    // Initialize with headless mode and increased timeout for CI environments
    await instance.initialize(true);
  }, 60000); // 60 second timeout for browser startup

  afterAll(async () => {
    await instance.cleanup();
  });

  describe('Basic Functionality', () => {
    test('should be able to create points', async () => {
      const result = await instance.evalCommand('A = (2, 3)');
      expect(result.success).toBe(true);
      
      const exists = await instance.exists('A');
      expect(exists).toBe(true);
      
      const x = await instance.getXcoord('A');
      const y = await instance.getYcoord('A');
      expect(x).toBe(2);
      expect(y).toBe(3);
    });

    test('should be able to create lines', async () => {
      await instance.evalCommand('B = (5, 1)');
      const result = await instance.evalCommand('line1 = Line(A, B)');
      expect(result.success).toBe(true);
      
      const exists = await instance.exists('line1');
      expect(exists).toBe(true);
    });

    test('should be able to create circles', async () => {
      const result = await instance.evalCommand('circle1 = Circle(A, 3)');
      expect(result.success).toBe(true);
      
      const exists = await instance.exists('circle1');
      expect(exists).toBe(true);
    });
  });

  describe('Function Plotting', () => {
    test('should be able to plot functions', async () => {
      const result = await instance.evalCommand('f(x) = x^2');
      expect(result.success).toBe(true);
      
      const exists = await instance.exists('f');
      expect(exists).toBe(true);
    });

    test('should be able to plot parametric curves', async () => {
      const result = await instance.evalCommand('curve1 = Curve(cos(t), sin(t), t, 0, 2*pi)');
      expect(result.success).toBe(true);
      
      const exists = await instance.exists('curve1');
      expect(exists).toBe(true);
    });
  });

  describe('Export Functionality', () => {
    test('should be able to export PNG', async () => {
      const pngData = await instance.exportPNG(1, true, 72);
      expect(pngData).toBeDefined();
      expect(typeof pngData).toBe('string');
      expect(pngData.length).toBeGreaterThan(0);
      // Should be base64 encoded
      expect(pngData).toMatch(/^[A-Za-z0-9+/]+=*$/);
    });

    test('should be able to export SVG', async () => {
      const svgData = await instance.exportSVG();
      expect(svgData).toBeDefined();
      expect(typeof svgData).toBe('string');
      expect(svgData).toContain('<svg');
      expect(svgData).toContain('</svg>');
    });
  });

  describe('Performance Requirements', () => {
    test('commands should execute within 2 seconds', async () => {
      const startTime = Date.now();
      await instance.evalCommand('C = (1, 1)');
      const endTime = Date.now();
      
      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(2000); // < 2 seconds
    });

    test('export should complete within 5 seconds', async () => {
      const startTime = Date.now();
      await instance.exportPNG();
      const endTime = Date.now();
      
      const exportTime = endTime - startTime;
      expect(exportTime).toBeLessThan(5000); // < 5 seconds
    });
  });

  describe('CAS Operations', () => {
    test('should be able to solve equations', async () => {
      const result = await instance.evalCommand('Solve(x^2 - 4 = 0)');
      expect(result.success).toBe(true);
    });

    test('should be able to differentiate', async () => {
      const result = await instance.evalCommand('g(x) = Derivative(x^2)');
      expect(result.success).toBe(true);
      
      const exists = await instance.exists('g');
      expect(exists).toBe(true);
    });

    test('should be able to integrate', async () => {
      const result = await instance.evalCommand('h(x) = Integral(x)');
      expect(result.success).toBe(true);
      
      const exists = await instance.exists('h');
      expect(exists).toBe(true);
    });
  });

  describe('Animation and Dynamic Features', () => {
    test('should be able to create and animate sliders', async () => {
      const result = await instance.evalCommand('a = Slider(-5, 5, 0.1, 1, 200, false, true, false, false)');
      expect(result.success).toBe(true);
      
      const exists = await instance.exists('a');
      expect(exists).toBe(true);
      
      // Test animation
      await instance.setAnimating('a', true);
      await instance.startAnimation();
      
      const isRunning = await instance.isAnimationRunning();
      expect(isRunning).toBe(true);
      
      await instance.stopAnimation();
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid commands gracefully', async () => {
      try {
        await instance.evalCommand('InvalidCommand(nonsense)');
        // If no exception, it should return success: false
        expect(false).toBe(true); // This should not happen
      } catch (error) {
        // Exception is expected for invalid commands
        expect(error).toBeDefined();
        expect((error as any).name).toBe('GeoGebraCommandError');
      }
    });

    test('should handle non-existent objects', async () => {
      const exists = await instance.exists('NonExistentObject');
      expect(exists).toBe(false);
    });
  });
}); 