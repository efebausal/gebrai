# Educational Tools API Reference

Educational tools provide pre-built mathematical activities, lesson plan generation, and classroom-focused functionality. These tools make it easy to create curriculum-aligned mathematical content for various grade levels.

## 🎯 Overview

Educational tools enable:
- **Curriculum-aligned content** - Pre-built activities matching educational standards
- **Grade-level targeting** - Content appropriate for specific age groups and skill levels
- **Lesson plan generation** - Automated creation of comprehensive lesson plans
- **Interactive activities** - Engaging mathematical explorations for students

**Performance**: Educational tools respond in < 2000ms (typically 200-1000ms)

---

## 🔧 Tools

### `geogebra_list_educational_templates`

List all available educational templates with filtering by category and grade level.

#### Input Schema
```json
{
  "type": "object",
  "properties": {
    "category": {
      "type": "string",
      "enum": ["geometry", "algebra", "calculus", "statistics", "proofs"],
      "description": "Filter templates by category (optional)"
    },
    "gradeLevel": {
      "type": "string", 
      "description": "Filter by grade level (e.g., \"6-8\", \"9-12\", \"college\")"
    }
  },
  "required": []
}
```

#### Parameters
- **`category`** *(string, optional)*: Filter by mathematical category
  - `geometry` - Geometric constructions and spatial reasoning
  - `algebra` - Algebraic expressions and equations
  - `calculus` - Derivatives, integrals, and limits
  - `statistics` - Data analysis and probability
  - `proofs` - Mathematical reasoning and proofs
- **`gradeLevel`** *(string, optional)*: Target grade level (e.g., "6-8", "9-12", "college")

#### Response
```json
{
  "content": [{
    "type": "text",
    "text": "{
      \"success\": true,
      \"count\": 15,
      \"templates\": [
        {
          \"id\": \"basic-triangle-properties\",
          \"name\": \"Triangle Properties Explorer\",
          \"category\": \"geometry\",
          \"description\": \"Interactive exploration of triangle angle sum and side relationships\",
          \"gradeLevel\": \"6-8\",
          \"estimatedTime\": 25,
          \"objectives\": [
            \"Understand triangle angle sum property\",
            \"Explore side-angle relationships\"
          ]
        }
      ]
    }"
  }]
}
```

#### Usage Examples

**Browse All Templates:**
```javascript
const result = await mcpClient.call('tools/call', {
  name: 'geogebra_list_educational_templates',
  arguments: {}
});

const templates = JSON.parse(result.content[0].text);
console.log(`Found ${templates.count} templates available`);
```

**Filter by Category and Grade:**
```javascript
const result = await mcpClient.call('tools/call', {
  name: 'geogebra_list_educational_templates',
  arguments: {
    category: 'geometry',
    gradeLevel: '9-12'
  }
});

const templates = JSON.parse(result.content[0].text);
templates.templates.forEach(template => {
  console.log(`${template.name} - ${template.estimatedTime} minutes`);
});
```

#### Use Cases
- Curriculum planning and content discovery
- Finding age-appropriate mathematical activities
- Browsing available educational content
- Planning lesson sequences

---

### `geogebra_load_educational_template`

Load and execute a specific educational template, setting up the complete mathematical activity.

#### Input Schema
```json
{
  "type": "object",
  "properties": {
    "templateId": {
      "type": "string",
      "description": "The ID of the educational template to load"
    },
    "customizations": {
      "type": "object",
      "description": "Optional customizations for the template",
      "properties": {
        "colors": {
          "type": "object",
          "description": "Custom color scheme"
        },
        "parameters": {
          "type": "object",
          "description": "Custom parameter values"
        },
        "showLabels": {
          "type": "boolean",
          "description": "Whether to show object labels"
        }
      }
    }
  },
  "required": ["templateId"]
}
```

#### Parameters
- **`templateId`** *(string, required)*: ID of the template to load
- **`customizations`** *(object, optional)*: Template customization options
  - `colors` - Custom color scheme for objects
  - `parameters` - Override default parameter values
  - `showLabels` - Control label visibility

#### Response
```json
{
  "content": [{
    "type": "text",
    "text": "{
      \"success\": true,
      \"template\": {
        \"id\": \"basic-triangle-properties\",
        \"name\": \"Triangle Properties Explorer\",
        \"category\": \"geometry\",
        \"loaded\": true
      },
      \"objectives\": [
        \"Understand triangle angle sum property\",
        \"Explore side-angle relationships\"
      ],
      \"instructions\": \"Template 'Triangle Properties Explorer' loaded successfully. Estimated time: 25 minutes.\",
      \"result\": \"Construction ready for exploration\"
    }"
  }]
}
```

#### Usage Examples

**Load Basic Template:**
```javascript
const result = await mcpClient.call('tools/call', {
  name: 'geogebra_load_educational_template',
  arguments: {
    templateId: 'basic-triangle-properties'
  }
});

const template = JSON.parse(result.content[0].text);
console.log(`Loaded: ${template.template.name}`);
console.log(`Objectives: ${template.objectives.join(', ')}`);
```

**Load with Customizations:**
```javascript
const result = await mcpClient.call('tools/call', {
  name: 'geogebra_load_educational_template',
  arguments: {
    templateId: 'quadratic-function-explorer',
    customizations: {
      colors: {
        primary: '#FF6B6B',
        secondary: '#4ECDC4'
      },
      parameters: {
        initialA: 2,
        initialB: -3,
        initialC: 1
      },
      showLabels: true
    }
  }
});
```

#### Use Cases
- Setting up classroom activities
- Starting interactive mathematical explorations
- Providing structured learning experiences
- Creating consistent educational content

---

### `geogebra_create_lesson_plan`

Generate a comprehensive lesson plan using multiple educational templates and mathematical topics.

#### Input Schema
```json
{
  "type": "object",
  "properties": {
    "topic": {
      "type": "string",
      "description": "The mathematical topic for the lesson"
    },
    "gradeLevel": {
      "type": "string",
      "description": "Target grade level"
    },
    "duration": {
      "type": "number",
      "description": "Lesson duration in minutes"
    },
    "templateIds": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Specific template IDs to include in the lesson"
    }
  },
  "required": ["topic", "gradeLevel", "duration"]
}
```

#### Parameters
- **`topic`** *(string, required)*: Mathematical topic or learning objective
- **`gradeLevel`** *(string, required)*: Target grade level
- **`duration`** *(number, required)*: Total lesson duration in minutes
- **`templateIds`** *(array, optional)*: Specific templates to include (auto-selected if not provided)

#### Response
```json
{
  "content": [{
    "type": "text",
    "text": "{
      \"success\": true,
      \"lessonPlan\": {
        \"topic\": \"Triangle Properties\",
        \"gradeLevel\": \"8\",
        \"duration\": 45,
        \"templates\": [
          {
            \"id\": \"basic-triangle-properties\",
            \"name\": \"Triangle Properties Explorer\",
            \"estimatedTime\": 25,
            \"objectives\": [\"Understand triangle angle sum property\"]
          }
        ],
        \"totalTime\": 25,
        \"structure\": {
          \"warmUp\": \"5 minutes - Review previous geometry concepts\",
          \"introduction\": \"5 minutes - Introduce triangle properties\",
          \"mainActivity\": \"25 minutes - Interactive triangle exploration\",
          \"wrapUp\": \"10 minutes - Summarize findings and assign practice\"
        }
      }
    }"
  }]
}
```

#### Usage Examples

**Generate Automatic Lesson Plan:**
```javascript
const result = await mcpClient.call('tools/call', {
  name: 'geogebra_create_lesson_plan',
  arguments: {
    topic: 'Quadratic Functions',
    gradeLevel: '9-12',
    duration: 50
  }
});

const lesson = JSON.parse(result.content[0].text);
console.log(`Lesson: ${lesson.lessonPlan.topic}`);
console.log(`Templates: ${lesson.lessonPlan.templates.length}`);
console.log(`Structure: ${JSON.stringify(lesson.lessonPlan.structure, null, 2)}`);
```

**Create Custom Lesson Plan:**
```javascript
const result = await mcpClient.call('tools/call', {
  name: 'geogebra_create_lesson_plan',
  arguments: {
    topic: 'Advanced Geometry',
    gradeLevel: '11-12',
    duration: 90,
    templateIds: [
      'circle-theorems-explorer',
      'conic-sections-intro',
      'geometric-transformations'
    ]
  }
});
```

#### Use Cases
- Automated lesson planning
- Curriculum development
- Teacher preparation assistance
- Educational content structuring

---

## 📚 Available Template Categories

### Geometry Templates
**Target Grades:** 6-12, College
**Topics Covered:**
- Basic triangle properties and angle relationships
- Circle theorems and arc measurements  
- Polygon properties and area calculations
- Geometric transformations (rotation, reflection, translation)
- Coordinate geometry and distance formulas
- Conic sections and their properties

**Example Templates:**
- `basic-triangle-properties` - Triangle angle sum and side relationships
- `circle-theorems-explorer` - Interactive circle theorem demonstrations
- `polygon-area-calculator` - Area formulas for regular and irregular polygons
- `geometric-transformations` - Translation, rotation, and reflection activities

### Algebra Templates
**Target Grades:** 8-12, College
**Topics Covered:**
- Linear equations and graphing
- Quadratic functions and parabolas
- Exponential and logarithmic functions
- Systems of equations
- Polynomial operations
- Rational functions

**Example Templates:**
- `linear-function-explorer` - Slope-intercept form visualization
- `quadratic-function-explorer` - Parabola vertex and axis of symmetry
- `exponential-growth-decay` - Real-world exponential modeling
- `system-of-equations-solver` - Graphical and algebraic solutions

### Calculus Templates
**Target Grades:** 11-12, College
**Topics Covered:**
- Limits and continuity
- Derivative concepts and applications
- Integral calculus and area under curves
- Related rates problems
- Optimization problems
- Differential equations basics

**Example Templates:**
- `limit-concept-explorer` - Visual limit demonstrations
- `derivative-slope-visualizer` - Tangent lines and instantaneous rate of change
- `area-under-curve` - Riemann sums and definite integrals
- `optimization-problems` - Maximum and minimum value applications

### Statistics Templates
**Target Grades:** 9-12, College
**Topics Covered:**
- Data visualization and distributions
- Probability concepts and calculations
- Regression analysis and correlation
- Hypothesis testing basics
- Confidence intervals
- Statistical modeling

**Example Templates:**
- `data-distribution-explorer` - Histogram and box plot creation
- `probability-simulator` - Interactive probability experiments
- `regression-analysis` - Linear and non-linear curve fitting
- `hypothesis-testing-intro` - Basic statistical inference

## 🚀 Integration Patterns

### Classroom Activity Setup
```javascript
async function setupClassroomActivity(category, gradeLevel) {
  // Find appropriate templates
  const templatesResult = await mcpClient.call('tools/call', {
    name: 'geogebra_list_educational_templates',
    arguments: {
      category: category,
      gradeLevel: gradeLevel
    }
  });
  
  const templates = JSON.parse(templatesResult.content[0].text);
  
  if (templates.count === 0) {
    console.log('No templates found for criteria');
    return;
  }
  
  // Load the first suitable template
  const selectedTemplate = templates.templates[0];
  const loadResult = await mcpClient.call('tools/call', {
    name: 'geogebra_load_educational_template',
    arguments: {
      templateId: selectedTemplate.id
    }
  });
  
  const loaded = JSON.parse(loadResult.content[0].text);
  console.log(`Activity ready: ${loaded.template.name}`);
  console.log(`Learning objectives:`);
  loaded.objectives.forEach(obj => console.log(`- ${obj}`));
  
  return loaded;
}

// Usage
await setupClassroomActivity('geometry', '9-12');
```

### Automated Lesson Planning
```javascript
class LessonPlanner {
  constructor(mcpClient) {
    this.client = mcpClient;
  }
  
  async createWeeklyPlan(topic, gradeLevel, sessionsPerWeek = 3) {
    const sessions = [];
    const sessionDuration = 45; // 45 minutes per session
    
    for (let i = 0; i < sessionsPerWeek; i++) {
      const lessonResult = await this.client.call('tools/call', {
        name: 'geogebra_create_lesson_plan',
        arguments: {
          topic: `${topic} - Session ${i + 1}`,
          gradeLevel: gradeLevel,
          duration: sessionDuration
        }
      });
      
      const lesson = JSON.parse(lessonResult.content[0].text);
      sessions.push({
        session: i + 1,
        topic: lesson.lessonPlan.topic,
        duration: lesson.lessonPlan.duration,
        templates: lesson.lessonPlan.templates,
        structure: lesson.lessonPlan.structure
      });
    }
    
    return {
      weeklyTopic: topic,
      gradeLevel: gradeLevel,
      totalSessions: sessionsPerWeek,
      sessions: sessions
    };
  }
  
  async adaptLessonForDifferentLevel(originalTemplateId, newGradeLevel) {
    // Find similar templates for the new grade level
    const templatesResult = await this.client.call('tools/call', {
      name: 'geogebra_list_educational_templates',
      arguments: {
        gradeLevel: newGradeLevel
      }
    });
    
    const templates = JSON.parse(templatesResult.content[0].text);
    // Logic to find most similar template
    // Return adapted lesson plan
    
    return templates;
  }
}

// Usage
const planner = new LessonPlanner(mcpClient);
const weekPlan = await planner.createWeeklyPlan('Quadratic Functions', '10-12', 4);
```

### Interactive Classroom Management
```javascript
class ClassroomSession {
  constructor(mcpClient) {
    this.client = mcpClient;
    this.currentTemplate = null;
    this.sessionLog = [];
  }
  
  async startActivity(templateId) {
    const startTime = new Date();
    
    const result = await this.client.call('tools/call', {
      name: 'geogebra_load_educational_template',
      arguments: { templateId }
    });
    
    const template = JSON.parse(result.content[0].text);
    this.currentTemplate = template;
    
    this.sessionLog.push({
      action: 'activity_started',
      template: template.template.name,
      timestamp: startTime,
      objectives: template.objectives
    });
    
    console.log(`Activity started: ${template.template.name}`);
    console.log(`Estimated duration: ${template.template.estimatedTime} minutes`);
    
    return template;
  }
  
  async switchActivity(newTemplateId) {
    if (this.currentTemplate) {
      this.sessionLog.push({
        action: 'activity_switched',
        from: this.currentTemplate.template.name,
        timestamp: new Date()
      });
    }
    
    return await this.startActivity(newTemplateId);
  }
  
  getSessionSummary() {
    return {
      currentActivity: this.currentTemplate?.template.name,
      activitiesCompleted: this.sessionLog.filter(log => log.action === 'activity_started').length,
      sessionDuration: this.sessionLog.length > 0 ? 
        new Date() - this.sessionLog[0].timestamp : 0,
      log: this.sessionLog
    };
  }
}

// Usage
const session = new ClassroomSession(mcpClient);
await session.startActivity('basic-triangle-properties');

// Later in the lesson
await session.switchActivity('polygon-area-calculator');

const summary = session.getSessionSummary();
console.log('Session Summary:', summary);
```

## 🎓 Pedagogical Best Practices

### 1. **Age-Appropriate Content Selection**
- Use grade-level filtering to ensure appropriate complexity
- Consider prerequisite knowledge when selecting templates
- Balance challenge level with student capability

### 2. **Lesson Structure Optimization**
- Start with familiar concepts before introducing new material
- Include interactive exploration time
- Plan for wrap-up and reflection activities

### 3. **Engagement Strategies**
- Use visual and interactive elements effectively
- Encourage student discovery through guided exploration
- Provide multiple representations of mathematical concepts

### 4. **Assessment Integration**
- Use templates as formative assessment tools
- Observe student interactions with mathematical objects
- Create opportunities for mathematical discourse

## 🔗 Related Documentation

- [API Overview](README.md) - Complete API architecture
- [GeoGebra Tools](geogebra-tools.md) - Core mathematical functionality
- [Basic Usage Tutorial](../tutorials/basic-usage.md) - Getting started with tools
- [Teacher Guide](../educational/teacher-guide.md) - Pedagogical guidance

---

**Note**: Educational tools are designed to support mathematics education across multiple grade levels. Templates are continuously updated to align with current educational standards and best practices. 