/**
 * CAS (Computer Algebra System) Tools Tests
 * Tests for Linear Issue GEB-6 implementation
 */

import { toolRegistry } from '../../src/tools/index';

describe('CAS Tools', () => {
  describe('geogebra_solve_equation', () => {
    it('should solve a simple equation', async () => {
      const result = await toolRegistry.executeTool('geogebra_solve_equation', {
        equation: 'x^2 - 4 = 0'
      });

      expect(result.content[0]?.type).toBe('text');
      const response = JSON.parse(result.content[0]?.text!);
      expect(response.success).toBe(true);
      expect(response.equation).toBe('x^2 - 4 = 0');
      expect(response.solution).toContain('solution');
    });

    it('should solve equation with specified variable', async () => {
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