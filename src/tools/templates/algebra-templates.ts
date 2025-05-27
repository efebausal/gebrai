import { EducationalTemplate } from '../educational-templates';
import { toolRegistry } from '../index';

/**
 * Algebra Educational Templates
 * Pre-built algebraic scenarios for common educational use cases
 */

export const algebraTemplates: EducationalTemplate[] = [
  {
    id: 'quadratic_explorer',
    name: 'Quadratic Function Explorer',
    category: 'algebra',
    description: 'Interactive exploration of quadratic functions, including vertex form, factored form, and transformations',
    gradeLevel: '9-12',
    objectives: [
      'Understand different forms of quadratic functions',
      'Explore the effects of parameters on graph shape and position',
      'Connect algebraic and geometric representations'
    ],
    prerequisites: ['Linear functions', 'Basic graphing skills', 'Algebraic manipulation'],
    estimatedTime: 20,
    setup: async () => {
      // Create parameter sliders for quadratic function y = ax² + bx + c
      await toolRegistry.executeTool('geogebra_create_slider', {
        name: 'a',
        min: -3,
        max: 3,
        value: 1,
        increment: 0.1,
        x: -8,
        y: 6,
        width: 120,
        caption: 'a coefficient'
      });

      await toolRegistry.executeTool('geogebra_create_slider', {
        name: 'b',
        min: -6,
        max: 6,
        value: 0,
        increment: 0.5,
        x: -8,
        y: 5,
        width: 120,
        caption: 'b coefficient'
      });

      await toolRegistry.executeTool('geogebra_create_slider', {
        name: 'c',
        min: -5,
        max: 5,
        value: 0,
        increment: 0.5,
        x: -8,
        y: 4,
        width: 120,
        caption: 'c coefficient'
      });

      // Create the quadratic function
      await toolRegistry.executeTool('geogebra_plot_function', {
        name: 'quadratic',
        expression: 'a*x^2 + b*x + c',
        color: '#FF0000',
        thickness: 3,
        style: 'solid'
      });

      // Calculate and show vertex
      await toolRegistry.executeTool('geogebra_create_point', {
        name: 'vertex',
        x: -0.5,  // Will be calculated as -b/(2a) in real implementation
        y: 0,     // Will be calculated as f(-b/(2a)) in real implementation
        color: '#00AA00',
        size: 6,
        label: 'Vertex'
      });

      // Show axis of symmetry
      await toolRegistry.executeTool('geogebra_create_line', {
        name: 'axisOfSymmetry',
        type: 'vertical',
        value: -0.5,  // x = -b/(2a)
        color: '#00AA00',
        thickness: 1,
        style: 'dashed'
      });

      // Create x-intercepts (if they exist)
      await toolRegistry.executeTool('geogebra_create_point', {
        name: 'yIntercept',
        x: 0,
        y: 0,  // Will be c in real implementation
        color: '#0000FF',
        size: 4,
        label: 'y-intercept'
      });

      // Add function equation display
      await toolRegistry.executeTool('geogebra_create_text', {
        text: '"f(x) = " + a + "x² + " + b + "x + " + c',
        x: -8,
        y: 2,
        fontSize: 16,
        color: '#FF0000',
        fontStyle: 'bold'
      });

      // Add vertex form display
      await toolRegistry.executeTool('geogebra_create_text', {
        text: '"Vertex Form: f(x) = " + a + "(x - " + (-b/(2*a)) + ")² + " + (c - b²/(4*a))',
        x: -8,
        y: 1,
        fontSize: 14,
        color: '#00AA00'
      });

      // Add discriminant information
      await toolRegistry.executeTool('geogebra_create_text', {
        text: '"Discriminant: Δ = " + (b² - 4*a*c)',
        x: -8,
        y: 0,
        fontSize: 14,
        color: '#0000FF'
      });

      // Add interpretation text
      await toolRegistry.executeTool('geogebra_create_text', {
        text: 'If[a > 0, "Opens upward", "Opens downward"]',
        x: 2,
        y: 6,
        fontSize: 12,
        color: '#AA00AA'
      });

      await toolRegistry.executeTool('geogebra_create_text', {
        text: 'If[b² - 4*a*c > 0, "Two real roots", If[b² - 4*a*c = 0, "One real root", "No real roots"]]',
        x: 2,
        y: 5,
        fontSize: 12,
        color: '#AA00AA'
      });

      return {
        construction: 'Interactive quadratic function with adjustable parameters',
        interactivity: 'Adjust sliders a, b, c to see how they affect the parabola',
        concepts: [
          'Parameter a controls opening direction and width',
          'Parameter b affects the axis of symmetry location',
          'Parameter c is the y-intercept',
          'Vertex form reveals transformations clearly',
          'Discriminant determines number of x-intercepts'
        ]
      };
    }
  },

  {
    id: 'linear_systems_graphical',
    name: 'Linear Systems: Graphical Solution',
    category: 'algebra',
    description: 'Visual exploration of linear systems of equations and their solutions through graphing',
    gradeLevel: '8-10',
    objectives: [
      'Understand that solutions are intersection points',
      'Explore different types of systems (consistent, inconsistent, dependent)',
      'Connect algebraic and geometric representations of systems'
    ],
    prerequisites: ['Linear equations', 'Graphing lines', 'Slope-intercept form'],
    estimatedTime: 18,
    setup: async () => {
      // Create sliders for first line: y = m1*x + b1
      await toolRegistry.executeTool('geogebra_create_slider', {
        name: 'm1',
        min: -3,
        max: 3,
        value: 1,
        increment: 0.25,
        x: -8,
        y: 6,
        width: 120,
        caption: 'Slope of Line 1'
      });

      await toolRegistry.executeTool('geogebra_create_slider', {
        name: 'b1',
        min: -5,
        max: 5,
        value: 2,
        increment: 0.5,
        x: -8,
        y: 5,
        width: 120,
        caption: 'y-intercept of Line 1'
      });

      // Create sliders for second line: y = m2*x + b2
      await toolRegistry.executeTool('geogebra_create_slider', {
        name: 'm2',
        min: -3,
        max: 3,
        value: -0.5,
        increment: 0.25,
        x: -8,
        y: 4,
        width: 120,
        caption: 'Slope of Line 2'
      });

      await toolRegistry.executeTool('geogebra_create_slider', {
        name: 'b2',
        min: -5,
        max: 5,
        value: -1,
        increment: 0.5,
        x: -8,
        y: 3,
        width: 120,
        caption: 'y-intercept of Line 2'
      });

      // Create the two lines
      await toolRegistry.executeTool('geogebra_plot_function', {
        name: 'line1',
        expression: 'm1*x + b1',
        color: '#FF0000',
        thickness: 3,
        style: 'solid'
      });

      await toolRegistry.executeTool('geogebra_plot_function', {
        name: 'line2',
        expression: 'm2*x + b2',
        color: '#0000FF',
        thickness: 3,
        style: 'solid'
      });

      // Calculate and show intersection point
      // In real implementation, this would be calculated automatically
      await toolRegistry.executeTool('geogebra_create_point', {
        name: 'intersection',
        x: 2,  // Will be (b2-b1)/(m1-m2) in real implementation
        y: 4,  // Will be m1*x + b1 at intersection in real implementation
        color: '#00AA00',
        size: 8,
        label: 'Solution'
      });

      // Add equation displays
      await toolRegistry.executeTool('geogebra_create_text', {
        text: '"Line 1: y = " + m1 + "x + " + b1',
        x: 3,
        y: 6,
        fontSize: 14,
        color: '#FF0000',
        fontStyle: 'bold'
      });

      await toolRegistry.executeTool('geogebra_create_text', {
        text: '"Line 2: y = " + m2 + "x + " + b2',
        x: 3,
        y: 5,
        fontSize: 14,
        color: '#0000FF',
        fontStyle: 'bold'
      });

      // Add solution display
      await toolRegistry.executeTool('geogebra_create_text', {
        text: 'If[m1 ≠ m2, "Solution: (" + (b2-b1)/(m1-m2) + ", " + (m1*(b2-b1)/(m1-m2) + b1) + ")", If[b1 = b2, "Infinitely many solutions", "No solution"]]',
        x: 3,
        y: 4,
        fontSize: 14,
        color: '#00AA00',
        fontStyle: 'bold'
      });

      // Add system type classification
      await toolRegistry.executeTool('geogebra_create_text', {
        text: 'If[m1 ≠ m2, "System Type: Consistent & Independent", If[b1 = b2, "System Type: Consistent & Dependent", "System Type: Inconsistent"]]',
        x: 3,
        y: 3,
        fontSize: 12,
        color: '#AA00AA'
      });

      // Add slope comparison
      await toolRegistry.executeTool('geogebra_create_text', {
        text: 'If[m1 = m2, "Lines are parallel", "Lines intersect"]',
        x: 3,
        y: 2,
        fontSize: 12,
        color: '#666666'
      });

      return {
        construction: 'Two adjustable linear functions with intersection point',
        interactivity: 'Adjust slopes and y-intercepts to explore different system types',
        systemTypes: [
          'Consistent & Independent: Different slopes → unique solution',
          'Consistent & Dependent: Same line → infinitely many solutions',
          'Inconsistent: Parallel but different → no solution'
        ]
      };
    }
  },

  {
    id: 'exponential_growth_decay',
    name: 'Exponential Functions: Growth and Decay',
    category: 'algebra',
    description: 'Interactive exploration of exponential functions, including growth, decay, and real-world applications',
    gradeLevel: '9-12',
    objectives: [
      'Understand exponential function behavior',
      'Distinguish between growth and decay',
      'Explore effects of base and initial value',
      'Connect to real-world scenarios'
    ],
    prerequisites: ['Function notation', 'Basic graphing', 'Exponent rules'],
    estimatedTime: 22,
    setup: async () => {
      // Create sliders for exponential function y = a * b^x
      await toolRegistry.executeTool('geogebra_create_slider', {
        name: 'a',
        min: 0.1,
        max: 5,
        value: 1,
        increment: 0.1,
        x: -8,
        y: 6,
        width: 120,
        caption: 'Initial Value (a)'
      });

      await toolRegistry.executeTool('geogebra_create_slider', {
        name: 'b',
        min: 0.1,
        max: 3,
        value: 2,
        increment: 0.1,
        x: -8,
        y: 5,
        width: 120,
        caption: 'Base (b)'
      });

      // Create the exponential function
      await toolRegistry.executeTool('geogebra_plot_function', {
        name: 'exponential',
        expression: 'a * b^x',
        color: '#FF0000',
        thickness: 3,
        xMin: -5,
        xMax: 5
      });

      // Add horizontal asymptote
      await toolRegistry.executeTool('geogebra_create_line', {
        name: 'asymptote',
        type: 'horizontal',
        value: 0,
        color: '#666666',
        thickness: 1,
        style: 'dashed'
      });

      // Add y-intercept point
      await toolRegistry.executeTool('geogebra_create_point', {
        name: 'yIntercept',
        x: 0,
        y: 1,  // Will be 'a' in real implementation
        color: '#00AA00',
        size: 6,
        label: 'y-intercept'
      });

      // Create comparison points to show growth/decay
      await toolRegistry.executeTool('geogebra_create_point', {
        name: 'point1',
        x: 1,
        y: 2,  // Will be a*b^1 in real implementation
        color: '#0000FF',
        size: 4,
        label: 'f(1)'
      });

      await toolRegistry.executeTool('geogebra_create_point', {
        name: 'point2',
        x: 2,
        y: 4,  // Will be a*b^2 in real implementation
        color: '#0000FF',
        size: 4,
        label: 'f(2)'
      });

      // Add function equation display
      await toolRegistry.executeTool('geogebra_create_text', {
        text: '"f(x) = " + a + " × " + b + "^x"',
        x: 3,
        y: 6,
        fontSize: 16,
        color: '#FF0000',
        fontStyle: 'bold'
      });

      // Add growth/decay classification
      await toolRegistry.executeTool('geogebra_create_text', {
        text: 'If[b > 1, "EXPONENTIAL GROWTH", If[b = 1, "CONSTANT FUNCTION", "EXPONENTIAL DECAY"]]',
        x: 3,
        y: 5,
        fontSize: 14,
        color: '#00AA00',
        fontStyle: 'bold'
      });

      // Add growth factor information
      await toolRegistry.executeTool('geogebra_create_text', {
        text: 'If[b > 1, "Growth Factor: " + b + " (increases by " + (100*(b-1)) + "% each unit)", "Decay Factor: " + b + " (decreases by " + (100*(1-b)) + "% each unit)"]',
        x: 3,
        y: 4,
        fontSize: 12,
        color: '#0000FF'
      });

      // Add doubling/halving time (approximate)
      await toolRegistry.executeTool('geogebra_create_text', {
        text: 'If[b > 1, "Doubling time ≈ " + ln(2)/ln(b) + " units", "Half-life ≈ " + ln(0.5)/ln(b) + " units"]',
        x: 3,
        y: 3,
        fontSize: 12,
        color: '#AA00AA'
      });

      // Add real-world examples
      await toolRegistry.executeTool('geogebra_create_text', {
        text: 'If[b > 1, "Examples: Population growth, compound interest, bacterial growth", "Examples: Radioactive decay, depreciation, cooling"]',
        x: 3,
        y: 2,
        fontSize: 11,
        color: '#666666'
      });

      return {
        construction: 'Interactive exponential function with adjustable parameters',
        interactivity: 'Adjust initial value (a) and base (b) to explore growth and decay',
        concepts: [
          'Base b > 1: exponential growth',
          'Base 0 < b < 1: exponential decay',
          'Parameter a determines y-intercept and scale',
          'Horizontal asymptote at y = 0',
          'Real-world applications vary by context'
        ]
      };
    }
  },

  {
    id: 'polynomial_factoring',
    name: 'Polynomial Factoring Visualizer',
    category: 'algebra',
    description: 'Visual exploration of polynomial factoring, showing the relationship between factors and zeros',
    gradeLevel: '9-12',
    objectives: [
      'Connect factored form to graph zeros',
      'Understand multiplicity effects on graph behavior',
      'Explore relationship between factors and x-intercepts'
    ],
    prerequisites: ['Polynomial basics', 'Factoring techniques', 'Function graphing'],
    estimatedTime: 20,
    setup: async () => {
      // Create sliders for factors (x - r1)(x - r2)(x - r3)
      await toolRegistry.executeTool('geogebra_create_slider', {
        name: 'r1',
        min: -5,
        max: 5,
        value: -2,
        increment: 0.5,
        x: -8,
        y: 6,
        width: 120,
        caption: 'Zero 1 (r₁)'
      });

      await toolRegistry.executeTool('geogebra_create_slider', {
        name: 'r2',
        min: -5,
        max: 5,
        value: 1,
        increment: 0.5,
        x: -8,
        y: 5,
        width: 120,
        caption: 'Zero 2 (r₂)'
      });

      await toolRegistry.executeTool('geogebra_create_slider', {
        name: 'r3',
        min: -5,
        max: 5,
        value: 3,
        increment: 0.5,
        x: -8,
        y: 4,
        width: 120,
        caption: 'Zero 3 (r₃)'
      });

      // Create leading coefficient slider
      await toolRegistry.executeTool('geogebra_create_slider', {
        name: 'leadCoeff',
        min: -2,
        max: 2,
        value: 1,
        increment: 0.25,
        x: -8,
        y: 3,
        width: 120,
        caption: 'Leading Coefficient'
      });

      // Create the polynomial function
      await toolRegistry.executeTool('geogebra_plot_function', {
        name: 'polynomial',
        expression: 'leadCoeff * (x - r1) * (x - r2) * (x - r3)',
        color: '#FF0000',
        thickness: 3,
        xMin: -6,
        xMax: 6
      });

      // Mark the zeros on the x-axis
      await toolRegistry.executeTool('geogebra_create_point', {
        name: 'zero1',
        x: -2,  // Will be r1 in real implementation
        y: 0,
        color: '#00AA00',
        size: 6,
        label: 'r₁'
      });

      await toolRegistry.executeTool('geogebra_create_point', {
        name: 'zero2',
        x: 1,   // Will be r2 in real implementation
        y: 0,
        color: '#00AA00',
        size: 6,
        label: 'r₂'
      });

      await toolRegistry.executeTool('geogebra_create_point', {
        name: 'zero3',
        x: 3,   // Will be r3 in real implementation
        y: 0,
        color: '#00AA00',
        size: 6,
        label: 'r₃'
      });

      // Add factored form display
      await toolRegistry.executeTool('geogebra_create_text', {
        text: '"Factored Form: f(x) = " + leadCoeff + "(x - " + r1 + ")(x - " + r2 + ")(x - " + r3 + ")"',
        x: 2,
        y: 6,
        fontSize: 14,
        color: '#FF0000',
        fontStyle: 'bold'
      });

      // Add zeros list
      await toolRegistry.executeTool('geogebra_create_text', {
        text: '"Zeros: x = " + r1 + ", x = " + r2 + ", x = " + r3',
        x: 2,
        y: 5,
        fontSize: 14,
        color: '#00AA00'
      });

      // Add degree and leading coefficient info
      await toolRegistry.executeTool('geogebra_create_text', {
        text: '"Degree: 3 (cubic polynomial)"',
        x: 2,
        y: 4,
        fontSize: 12,
        color: '#0000FF'
      });

      await toolRegistry.executeTool('geogebra_create_text', {
        text: 'If[leadCoeff > 0, "Leading coefficient positive: rises to right", "Leading coefficient negative: falls to right"]',
        x: 2,
        y: 3,
        fontSize: 12,
        color: '#0000FF'
      });

      // Add behavior description
      await toolRegistry.executeTool('geogebra_create_text', {
        text: '"The graph crosses the x-axis at each zero"',
        x: 2,
        y: 2,
        fontSize: 12,
        color: '#AA00AA'
      });

      return {
        construction: 'Cubic polynomial in factored form with adjustable zeros',
        interactivity: 'Move zeros r₁, r₂, r₃ and adjust leading coefficient',
        concepts: [
          'Zeros of polynomial are x-intercepts of graph',
          'Factored form directly shows zeros',
          'Leading coefficient affects vertical scaling and end behavior',
          'Number of zeros ≤ degree of polynomial'
        ]
      };
    }
  }
]; 