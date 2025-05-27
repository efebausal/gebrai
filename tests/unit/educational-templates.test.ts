/**
 * Educational Templates Unit Tests - GEB-8 Implementation
 * 
 * Tests for educational template functionality including:
 * - Template registration and retrieval
 * - Template loading and execution
 * - Lesson plan generation
 * - Category filtering and grade level filtering
 */

import { toolRegistry } from '../../src/tools';
import { templateRegistry } from '../../src/tools/educational-templates';

describe('Educational Templates (GEB-8)', () => {
  
  describe('Template Registry', () => {
    test('should have templates registered', () => {
      const allTemplates = templateRegistry.getAllTemplates();
      expect(allTemplates.length).toBeGreaterThan(0);
    });

    test('should have geometry templates', () => {
      const geometryTemplates = templateRegistry.getTemplatesByCategory('geometry');
      expect(geometryTemplates.length).toBeGreaterThan(0);
      
      // Check specific geometry templates
      expect(geometryTemplates.some(t => t.id === 'triangle_basics')).toBe(true);
      expect(geometryTemplates.some(t => t.id === 'pythagorean_proof')).toBe(true);
    });

    test('should have algebra templates', () => {
      const algebraTemplates = templateRegistry.getTemplatesByCategory('algebra');
      expect(algebraTemplates.length).toBeGreaterThan(0);
      
      // Check specific algebra templates
      expect(algebraTemplates.some(t => t.id === 'quadratic_explorer')).toBe(true);
      expect(algebraTemplates.some(t => t.id === 'linear_systems_graphical')).toBe(true);
    });

    test('should retrieve template by ID', () => {
      const template = templateRegistry.getTemplate('triangle_basics');
      expect(template).toBeDefined();
      expect(template?.name).toBe('Triangle Fundamentals');
      expect(template?.category).toBe('geometry');
    });
  });

  describe('List Educational Templates Tool', () => {
    test('should list all templates', async () => {
      const result = await toolRegistry.executeTool('geogebra_list_educational_templates', {});
      const data = JSON.parse(result.content[0]?.text!);
      
      expect(data.success).toBe(true);
      expect(data.count).toBeGreaterThan(0);
      expect(Array.isArray(data.templates)).toBe(true);
      
      // Verify template structure
      const template = data.templates[0];
      expect(template).toHaveProperty('id');
      expect(template).toHaveProperty('name');
      expect(template).toHaveProperty('category');
      expect(template).toHaveProperty('description');
      expect(template).toHaveProperty('gradeLevel');
      expect(template).toHaveProperty('estimatedTime');
      expect(template).toHaveProperty('objectives');
    });

    test('should filter templates by category', async () => {
      const result = await toolRegistry.executeTool('geogebra_list_educational_templates', {
        category: 'geometry'
      });
      const data = JSON.parse(result.content[0]?.text!);
      
      expect(data.success).toBe(true);
      expect(data.templates.every((t: any) => t.category === 'geometry')).toBe(true);
    });

    test('should filter templates by grade level', async () => {
      const result = await toolRegistry.executeTool('geogebra_list_educational_templates', {
        gradeLevel: '9-12'
      });
      const data = JSON.parse(result.content[0]?.text!);
      
      expect(data.success).toBe(true);
      expect(data.templates.every((t: any) => t.gradeLevel === '9-12')).toBe(true);
    });

    test('should filter by both category and grade level', async () => {
      const result = await toolRegistry.executeTool('geogebra_list_educational_templates', {
        category: 'algebra',
        gradeLevel: '9-12'
      });
      const data = JSON.parse(result.content[0]?.text!);
      
      expect(data.success).toBe(true);
      expect(data.templates.every((t: any) => 
        t.category === 'algebra' && t.gradeLevel === '9-12'
      )).toBe(true);
    });
  });

  describe('Load Educational Template Tool', () => {
    test('should load triangle basics template', async () => {
      const result = await toolRegistry.executeTool('geogebra_load_educational_template', {
        templateId: 'triangle_basics'
      });
      const data = JSON.parse(result.content[0]?.text!);
      
      expect(data.success).toBe(true);
      expect(data.template.id).toBe('triangle_basics');
      expect(data.template.name).toBe('Triangle Fundamentals');
      expect(data.template.loaded).toBe(true);
      expect(Array.isArray(data.objectives)).toBe(true);
      expect(data.instructions).toContain('Triangle Fundamentals');
    });

    test('should load quadratic explorer template', async () => {
      const result = await toolRegistry.executeTool('geogebra_load_educational_template', {
        templateId: 'quadratic_explorer'
      });
      const data = JSON.parse(result.content[0]?.text!);
      
      expect(data.success).toBe(true);
      expect(data.template.id).toBe('quadratic_explorer');
      expect(data.template.name).toBe('Quadratic Function Explorer');
      expect(data.template.category).toBe('algebra');
    });

    test('should handle template not found', async () => {
      await expect(
        toolRegistry.executeTool('geogebra_load_educational_template', {
          templateId: 'nonexistent_template'
        })
      ).rejects.toThrow('Educational template not found: nonexistent_template');
    });

    test('should accept customizations', async () => {
      const result = await toolRegistry.executeTool('geogebra_load_educational_template', {
        templateId: 'triangle_basics',
        customizations: {
          colors: { points: '#FF0000' },
          showLabels: true
        }
      });
      const data = JSON.parse(result.content[0]?.text!);
      
      expect(data.success).toBe(true);
      expect(data.template.loaded).toBe(true);
    });
  });

  describe('Create Lesson Plan Tool', () => {
    test('should create lesson plan with specified templates', async () => {
      const result = await toolRegistry.executeTool('geogebra_create_lesson_plan', {
        topic: 'Functions and Graphing',
        gradeLevel: '9-12',
        duration: 50,
        templateIds: ['quadratic_explorer', 'linear_systems_graphical']
      });
      const data = JSON.parse(result.content[0]?.text!);
      
      expect(data.topic).toBe('Functions and Graphing');
      expect(data.gradeLevel).toBe('9-12');
      expect(data.duration).toBe(50);
      expect(data.templates).toHaveLength(2);
      expect(data.templates[0].id).toBe('quadratic_explorer');
      expect(data.templates[1].id).toBe('linear_systems_graphical');
      expect(data.totalTime).toBeGreaterThan(0);
      expect(data.structure).toHaveProperty('introduction');
      expect(data.structure).toHaveProperty('activities');
      expect(data.structure).toHaveProperty('conclusion');
    });

    test('should auto-select templates when not specified', async () => {
      const result = await toolRegistry.executeTool('geogebra_create_lesson_plan', {
        topic: 'Geometry Foundations',
        gradeLevel: '6-8',
        duration: 45
      });
      const data = JSON.parse(result.content[0]?.text!);
      
      expect(data.topic).toBe('Geometry Foundations');
      expect(data.gradeLevel).toBe('6-8');
      expect(data.duration).toBe(45);
      expect(Array.isArray(data.templates)).toBe(true);
      expect(data.templates.length).toBeGreaterThan(0);
      expect(data.templates.length).toBeLessThanOrEqual(3); // Limited to 3 templates
      
      // All selected templates should match grade level
      expect(data.templates.every((t: any) => t.gradeLevel === '6-8')).toBe(true);
    });

    test('should respect duration constraints in auto-selection', async () => {
      const result = await toolRegistry.executeTool('geogebra_create_lesson_plan', {
        topic: 'Mathematics Review',
        gradeLevel: '9-12',
        duration: 20 // Short duration
      });
      const data = JSON.parse(result.content[0]?.text!);
      
      expect(data.totalTime).toBeLessThanOrEqual(20);
      expect(data.templates.every((t: any) => t.estimatedTime <= 20)).toBe(true);
    });

    test('should have proper lesson structure', async () => {
      const result = await toolRegistry.executeTool('geogebra_create_lesson_plan', {
        topic: 'Test Topic',
        gradeLevel: '9-12',
        duration: 30,
        templateIds: ['quadratic_explorer']
      });
      const data = JSON.parse(result.content[0]?.text!);
      
      expect(data.structure.introduction).toContain('5 minutes');
      expect(data.structure.conclusion).toContain('5 minutes');
      expect(Array.isArray(data.structure.activities)).toBe(true);
      expect(data.structure.activities.length).toBe(1);
      expect(data.structure.activities[0]).toContain('Activity 1');
      expect(data.structure.activities[0]).toContain('Quadratic Function Explorer');
    });
  });

  describe('Template Content Validation', () => {
    test('all templates should have required properties', () => {
      const allTemplates = templateRegistry.getAllTemplates();
      
      allTemplates.forEach(template => {
        expect(template.id).toBeTruthy();
        expect(template.name).toBeTruthy();
        expect(template.category).toBeTruthy();
        expect(template.description).toBeTruthy();
        expect(template.gradeLevel).toBeTruthy();
        expect(Array.isArray(template.objectives)).toBe(true);
        expect(template.objectives.length).toBeGreaterThan(0);
        expect(Array.isArray(template.prerequisites)).toBe(true);
        expect(typeof template.estimatedTime).toBe('number');
        expect(template.estimatedTime).toBeGreaterThan(0);
        expect(typeof template.setup).toBe('function');
      });
    });

    test('template categories should be valid', () => {
      const validCategories = ['geometry', 'algebra', 'calculus', 'statistics', 'proofs'];
      const allTemplates = templateRegistry.getAllTemplates();
      
      allTemplates.forEach(template => {
        expect(validCategories).toContain(template.category);
      });
    });

    test('template grade levels should be reasonable', () => {
      const validGradeLevels = ['6-8', '8-10', '9-12', 'college'];
      const allTemplates = templateRegistry.getAllTemplates();
      
      allTemplates.forEach(template => {
        expect(validGradeLevels).toContain(template.gradeLevel);
      });
    });

    test('estimated times should be reasonable', () => {
      const allTemplates = templateRegistry.getAllTemplates();
      
      allTemplates.forEach(template => {
        expect(template.estimatedTime).toBeGreaterThanOrEqual(5); // At least 5 minutes
        expect(template.estimatedTime).toBeLessThanOrEqual(60);   // At most 60 minutes
      });
    });
  });

  describe('Integration with GeoGebra Tools', () => {
    test('template setup should call GeoGebra tools', async () => {
      const template = templateRegistry.getTemplate('triangle_basics');
      expect(template).toBeDefined();
      
      // Mock the tool registry to track calls
      const originalExecuteTool = toolRegistry.executeTool;
      const toolCalls: string[] = [];
      
      toolRegistry.executeTool = jest.fn().mockImplementation(async (toolName: string) => {
        toolCalls.push(toolName);
        return { content: [{ type: 'text', text: '{"success": true}' }] };
      });
      
      await template!.setup();
      
      // Verify that GeoGebra tools were called
      expect(toolCalls.some(call => call.startsWith('geogebra_'))).toBe(true);
      
      // Restore original function
      toolRegistry.executeTool = originalExecuteTool;
    });
  });
}); 