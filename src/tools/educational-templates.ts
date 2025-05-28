import { ToolDefinition } from '../types/mcp';
import { toolRegistry } from './index';
import logger from '../utils/logger';

/**
 * Educational Templates for GeoGebra MCP Tool - GEB-8 Implementation
 * 
 * Pre-built mathematical scenarios for common educational use cases:
 * - Geometry fundamentals
 * - Algebra visualizations  
 * - Calculus demonstrations
 * - Statistics and probability
 * - Mathematical proofs
 */

// Check if we're in MCP mode (stdio communication)
// When piping input, process.stdin.isTTY is undefined, not false
const isMcpMode = !process.stdin.isTTY;

// Template categories
export type TemplateCategory = 'geometry' | 'algebra' | 'calculus' | 'statistics' | 'proofs';

// Template metadata
export interface EducationalTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  description: string;
  gradeLevel: string;
  objectives: string[];
  prerequisites: string[];
  estimatedTime: number; // minutes
  setup: () => Promise<any>;
}

/**
 * Educational template registry
 */
export class EducationalTemplateRegistry {
  private templates: Map<string, EducationalTemplate> = new Map();

  register(template: EducationalTemplate): void {
    this.templates.set(template.id, template);
    if (!isMcpMode) {
      logger.info(`Registered educational template: ${template.id}`);
    }
  }

  getTemplate(id: string): EducationalTemplate | undefined {
    return this.templates.get(id);
  }

  getTemplatesByCategory(category: TemplateCategory): EducationalTemplate[] {
    return Array.from(this.templates.values()).filter(t => t.category === category);
  }

  getAllTemplates(): EducationalTemplate[] {
    return Array.from(this.templates.values());
  }
}

export const templateRegistry = new EducationalTemplateRegistry();

/**
 * Core educational template tools
 */
export const educationalTemplateTools: ToolDefinition[] = [
  {
    tool: {
      name: 'geogebra_list_educational_templates',
      description: 'List all available educational templates by category',
      inputSchema: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            enum: ['geometry', 'algebra', 'calculus', 'statistics', 'proofs'],
            description: 'Filter templates by category (optional)'
          },
          gradeLevel: {
            type: 'string',
            description: 'Filter by grade level (e.g., "6-8", "9-12", "college")'
          }
        },
        required: []
      }
    },
    handler: async (params: Record<string, unknown>) => {
      const { category, gradeLevel } = params;
      
      let templates = templateRegistry.getAllTemplates();
      
      if (category) {
        templates = templates.filter(t => t.category === category);
      }
      
      if (gradeLevel) {
        templates = templates.filter(t => t.gradeLevel === gradeLevel);
      }

      const templateList = templates.map(template => ({
        id: template.id,
        name: template.name,
        category: template.category,
        description: template.description,
        gradeLevel: template.gradeLevel,
        estimatedTime: template.estimatedTime,
        objectives: template.objectives
      }));

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            success: true,
            count: templateList.length,
            templates: templateList
          }, null, 2)
        }]
      };
    }
  },

  {
    tool: {
      name: 'geogebra_load_educational_template',
      description: 'Load and execute a specific educational template',
      inputSchema: {
        type: 'object',
        properties: {
          templateId: {
            type: 'string',
            description: 'The ID of the educational template to load'
          },
          customizations: {
            type: 'object',
            description: 'Optional customizations for the template (colors, parameters, etc.)',
            properties: {
              colors: {
                type: 'object',
                description: 'Custom color scheme'
              },
              parameters: {
                type: 'object', 
                description: 'Custom parameter values'
              },
              showLabels: {
                type: 'boolean',
                description: 'Whether to show object labels'
              }
            }
          }
        },
        required: ['templateId']
      }
    },
    handler: async (params: Record<string, unknown>) => {
      const { templateId } = params;
      // Note: customizations parameter is accepted but not yet implemented
      // Future enhancement: apply color schemes, parameters, and display options
      // const customizations = params['customizations'] || {};
      
      const template = templateRegistry.getTemplate(templateId as string);
      if (!template) {
        throw new Error(`Educational template not found: ${templateId}`);
      }

      logger.info(`Loading educational template: ${template.name}`);
      
      // Clear existing construction
      await toolRegistry.executeTool('geogebra_clear_construction', {});
      
      // Execute template setup
      const result = await template.setup();
      
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            success: true,
            template: {
              id: template.id,
              name: template.name,
              category: template.category,
              loaded: true
            },
            objectives: template.objectives,
            instructions: `Template "${template.name}" loaded successfully. Estimated time: ${template.estimatedTime} minutes.`,
            result
          }, null, 2)
        }]
      };
    }
  },

  {
    tool: {
      name: 'geogebra_create_lesson_plan',
      description: 'Generate a complete lesson plan using multiple educational templates',
      inputSchema: {
        type: 'object',
        properties: {
          topic: {
            type: 'string',
            description: 'The mathematical topic for the lesson'
          },
          gradeLevel: {
            type: 'string',
            description: 'Target grade level'
          },
          duration: {
            type: 'number',
            description: 'Lesson duration in minutes'
          },
          templateIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'Specific template IDs to include in the lesson'
          }
        },
        required: ['topic', 'gradeLevel', 'duration']
      }
    },
    handler: async (params: Record<string, unknown>) => {
      const { topic, gradeLevel, duration, templateIds } = params;
      
      // Auto-select templates if not specified
      let selectedTemplates: EducationalTemplate[];
      
      if (templateIds && Array.isArray(templateIds)) {
        selectedTemplates = templateIds
          .map(id => templateRegistry.getTemplate(id as string))
          .filter(Boolean) as EducationalTemplate[];
      } else {
        // Auto-select based on topic and grade level
        selectedTemplates = templateRegistry.getAllTemplates()
          .filter(t => t.gradeLevel === gradeLevel)
          .filter(t => t.estimatedTime <= (duration as number))
          .slice(0, 3); // Limit to 3 templates for a lesson
      }

      const lessonPlan = {
        topic,
        gradeLevel,
        duration,
        templates: selectedTemplates.map(t => ({
          id: t.id,
          name: t.name,
          category: t.category,
          estimatedTime: t.estimatedTime,
          objectives: t.objectives,
          prerequisites: t.prerequisites
        })),
        totalTime: selectedTemplates.reduce((sum, t) => sum + t.estimatedTime, 0),
        structure: {
          introduction: "5 minutes - Review prerequisites and introduce objectives",
          activities: selectedTemplates.map((t, i) => 
            `Activity ${i + 1}: ${t.name} (${t.estimatedTime} min) - ${t.description}`
          ),
          conclusion: "5 minutes - Summary and assessment"
        }
      };

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(lessonPlan, null, 2)
        }]
      };
    }
  }
];

/**
 * Initialize and register all educational templates
 */
export function initializeEducationalTemplates(): void {
  // Import templates from different categories
  const { geometryTemplates } = require('./templates/geometry-templates');
  const { algebraTemplates } = require('./templates/algebra-templates');
  
  // Register geometry templates
  geometryTemplates.forEach((template: EducationalTemplate) => {
    templateRegistry.register(template);
  });
  
  // Register algebra templates  
  algebraTemplates.forEach((template: EducationalTemplate) => {
    templateRegistry.register(template);
  });
  
  if (!isMcpMode) {
    logger.info(`Registered ${templateRegistry.getAllTemplates().length} educational templates`);
  }
}

// Initialize templates when module is loaded
initializeEducationalTemplates(); 