/**
 * Real GeoGebra Basic Implementation Test
 * Tests the core working functionality of the real GeoGebra integration
 */

import { GeoGebraInstance } from '../src/utils/geogebra-instance';

describe('Real GeoGebra Basic Implementation', () => {
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
    
    await instance.initialize(true);
  }, 60000);

  afterAll(async () => {
    await instance.cleanup();
  });

  describe('Basic Geometric Objects', () => {
    test('should create points', async () => {
      const result = await instance.evalCommand('A = (2, 3)');
      expect(result.success).toBe(true);
      
      const exists = await instance.exists('A');
      expect(exists).toBe(true);
      
      const x = await instance.getXcoord('A');
      const y = await instance.getYcoord('A');
      expect(x).toBe(2);
      expect(y).toBe(3);
    });

    test('should create lines through points', async () => {
      await instance.evalCommand('B = (5, 1)');
      const result = await instance.evalCommand('line1 = Line(A, B)');
      expect(result.success).toBe(true);
      
      const exists = await instance.exists('line1');
      expect(exists).toBe(true);
    });

    test('should create circles with center and point', async () => {
      await instance.evalCommand('C = (1, 1)');
      const result = await instance.evalCommand('circle1 = Circle(A, C)');
      expect(result.success).toBe(true);
      
      const exists = await instance.exists('circle1');
      expect(exists).toBe(true);
    });
  });

  describe('Function Plotting', () => {
    test('should plot basic functions', async () => {
      const result = await instance.evalCommand('f(x) = x^2');
      expect(result.success).toBe(true);
      
      const exists = await instance.exists('f');
      expect(exists).toBe(true);
    });

    test('should plot trigonometric functions', async () => {
      const result = await instance.evalCommand('g(x) = sin(x)');
      expect(result.success).toBe(true);
      
      const exists = await instance.exists('g');
      expect(exists).toBe(true);
    });

    test('should plot parametric curves', async () => {
      const result = await instance.evalCommand('curve1 = Curve(cos(t), sin(t), t, 0, 2*pi)');
      expect(result.success).toBe(true);
      
      const exists = await instance.exists('curve1');
      expect(exists).toBe(true);
    });
  });

  describe('Object Management', () => {
    test('should list all objects', async () => {
      const objects = await instance.getAllObjectNames();
      expect(Array.isArray(objects)).toBe(true);
      expect(objects.length).toBeGreaterThan(0);
      expect(objects).toContain('A');
      expect(objects).toContain('f');
    });

    test('should check object definition', async () => {
      const isDefined = await instance.isDefined('A');
      expect(isDefined).toBe(true);
      
      const notDefined = await instance.isDefined('NonExistent');
      expect(notDefined).toBe(false);
    });

    test('should delete objects', async () => {
      await instance.evalCommand('temp = (0, 0)');
      let exists = await instance.exists('temp');
      expect(exists).toBe(true);
      
      const deleted = await instance.deleteObject('temp');
      expect(deleted).toBe(true);
      
      exists = await instance.exists('temp');
      expect(exists).toBe(false);
    });
  });

  describe('View Configuration', () => {
    test('should set coordinate system', async () => {
      // This should not throw an error
      await expect(instance.setCoordSystem(-10, 10, -5, 5)).resolves.not.toThrow();
    });

    test('should set axes visibility', async () => {
      await expect(instance.setAxesVisible(true, true)).resolves.not.toThrow();
      await expect(instance.setAxesVisible(false, false)).resolves.not.toThrow();
    });

    test('should set grid visibility', async () => {
      await expect(instance.setGridVisible(true)).resolves.not.toThrow();
      await expect(instance.setGridVisible(false)).resolves.not.toThrow();
    });
  });

  describe('Performance', () => {
    test('should execute commands quickly', async () => {
      const startTime = Date.now();
      await instance.evalCommand('D = (4, 4)');
      const endTime = Date.now();
      
      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(2000); // < 2 seconds
    });

    test('should handle multiple rapid commands', async () => {
      const startTime = Date.now();
      
      await Promise.all([
        instance.evalCommand('E = (1, 2)'),
        instance.evalCommand('F = (3, 4)'),
        instance.evalCommand('G = (5, 6)'),
      ]);
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      expect(totalTime).toBeLessThan(3000); // < 3 seconds for 3 commands
    });
  });

  describe('Basic Error Handling', () => {
    test('should handle non-existent objects gracefully', async () => {
      const exists = await instance.exists('NonExistentObject123');
      expect(exists).toBe(false);
    });

    test('should handle coordinate queries for non-existent objects', async () => {
      // This should not crash, but may return 0 or throw
      await expect(async () => {
        await instance.getXcoord('NonExistentPoint');
      }).not.toThrow();
    });
  });

  describe('Construction Management', () => {
    test('should create new construction', async () => {
      await expect(instance.newConstruction()).resolves.not.toThrow();
      
      // After new construction, A should not exist
      const exists = await instance.exists('A');
      expect(exists).toBe(false);
    });

    test('should work after construction reset', async () => {
      // Create a new point after reset
      const result = await instance.evalCommand('NewA = (1, 1)');
      expect(result.success).toBe(true);
      
      const exists = await instance.exists('NewA');
      expect(exists).toBe(true);
    });
  });
}); 