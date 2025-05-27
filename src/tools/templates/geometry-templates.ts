import { EducationalTemplate } from '../educational-templates';
import { toolRegistry } from '../index';

/**
 * Geometry Educational Templates
 * Pre-built geometric scenarios for common educational use cases
 */

export const geometryTemplates: EducationalTemplate[] = [
  {
    id: 'triangle_basics',
    name: 'Triangle Fundamentals',
    category: 'geometry',
    description: 'Interactive exploration of triangle properties, including angles, sides, and basic relationships',
    gradeLevel: '6-8',
    objectives: [
      'Understand triangle angle sum property',
      'Explore relationship between side lengths and angles',
      'Classify triangles by sides and angles'
    ],
    prerequisites: ['Basic angle concepts', 'Measurement skills'],
    estimatedTime: 15,
    setup: async () => {
      // Create three points for a triangle
      await toolRegistry.executeTool('geogebra_create_point', {
        name: 'A',
        x: 0,
        y: 0,
        color: '#FF0000',
        size: 4
      });

      await toolRegistry.executeTool('geogebra_create_point', {
        name: 'B', 
        x: 4,
        y: 0,
        color: '#FF0000',
        size: 4
      });

      await toolRegistry.executeTool('geogebra_create_point', {
        name: 'C',
        x: 2,
        y: 3,
        color: '#FF0000',
        size: 4,
        moveable: true
      });

      // Create triangle sides
      await toolRegistry.executeTool('geogebra_create_line_segment', {
        name: 'AB',
        point1: 'A',
        point2: 'B',
        color: '#0000FF',
        thickness: 2
      });

      await toolRegistry.executeTool('geogebra_create_line_segment', {
        name: 'BC',
        point1: 'B', 
        point2: 'C',
        color: '#0000FF',
        thickness: 2
      });

      await toolRegistry.executeTool('geogebra_create_line_segment', {
        name: 'CA',
        point1: 'C',
        point2: 'A',
        color: '#0000FF',
        thickness: 2
      });

      // Create angle measurements
      await toolRegistry.executeTool('geogebra_create_angle', {
        name: 'angleA',
        vertex: 'A',
        point1: 'B',
        point2: 'C',
        showLabel: true,
        color: '#00AA00'
      });

      await toolRegistry.executeTool('geogebra_create_angle', {
        name: 'angleB',
        vertex: 'B', 
        point1: 'C',
        point2: 'A',
        showLabel: true,
        color: '#00AA00'
      });

      await toolRegistry.executeTool('geogebra_create_angle', {
        name: 'angleC',
        vertex: 'C',
        point1: 'A', 
        point2: 'B',
        showLabel: true,
        color: '#00AA00'
      });

      // Add dynamic text showing angle sum
      await toolRegistry.executeTool('geogebra_create_text', {
        text: '"Angle Sum: " + angleA + angleB + angleC',
        x: 5,
        y: 2,
        fontSize: 16,
        color: '#AA0000'
      });

      return {
        construction: 'Triangle with interactive point C and angle measurements',
        interactivity: 'Drag point C to see how angles change while sum remains 180°',
        learningPoints: [
          'Triangle angle sum is always 180°',
          'Larger angles are opposite longer sides',
          'Moving vertices changes individual angles but not their sum'
        ]
      };
    }
  },

  {
    id: 'circle_theorems',
    name: 'Circle Theorems Explorer',
    category: 'geometry',
    description: 'Interactive demonstration of fundamental circle theorems including inscribed angles and tangent properties',
    gradeLevel: '9-12',
    objectives: [
      'Understand inscribed angle theorem',
      'Explore tangent-chord relationships',
      'Investigate central vs inscribed angles'
    ],
    prerequisites: ['Circle basics', 'Angle measurement', 'Basic proofs'],
    estimatedTime: 20,
    setup: async () => {
      // Create center and circle
      await toolRegistry.executeTool('geogebra_create_point', {
        name: 'O',
        x: 0,
        y: 0,
        color: '#000000',
        size: 4,
        label: 'Center'
      });

      await toolRegistry.executeTool('geogebra_create_circle', {
        name: 'circle',
        center: 'O',
        radius: 3,
        color: '#0000FF',
        thickness: 2
      });

      // Create points on circle for inscribed angle
      await toolRegistry.executeTool('geogebra_create_point_on_object', {
        name: 'A',
        object: 'circle',
        color: '#FF0000',
        size: 4,
        moveable: true
      });

      await toolRegistry.executeTool('geogebra_create_point_on_object', {
        name: 'B',
        object: 'circle', 
        color: '#FF0000',
        size: 4,
        moveable: true
      });

      await toolRegistry.executeTool('geogebra_create_point_on_object', {
        name: 'C',
        object: 'circle',
        color: '#FF0000',
        size: 4,
        moveable: true
      });

      // Create chords
      await toolRegistry.executeTool('geogebra_create_line_segment', {
        name: 'AB',
        point1: 'A',
        point2: 'B',
        color: '#00AA00',
        thickness: 2
      });

      await toolRegistry.executeTool('geogebra_create_line_segment', {
        name: 'AC',
        point1: 'A',
        point2: 'C', 
        color: '#00AA00',
        thickness: 2
      });

      await toolRegistry.executeTool('geogebra_create_line_segment', {
        name: 'BC',
        point1: 'B',
        point2: 'C',
        color: '#00AA00',
        thickness: 2
      });

      // Create central angle
      await toolRegistry.executeTool('geogebra_create_line_segment', {
        name: 'OB',
        point1: 'O',
        point2: 'B',
        color: '#AA00AA',
        thickness: 1,
        style: 'dashed'
      });

      await toolRegistry.executeTool('geogebra_create_line_segment', {
        name: 'OC',
        point1: 'O',
        point2: 'C',
        color: '#AA00AA', 
        thickness: 1,
        style: 'dashed'
      });

      // Create angles
      await toolRegistry.executeTool('geogebra_create_angle', {
        name: 'inscribedAngle',
        vertex: 'A',
        point1: 'B',
        point2: 'C',
        showLabel: true,
        color: '#FF8800'
      });

      await toolRegistry.executeTool('geogebra_create_angle', {
        name: 'centralAngle',
        vertex: 'O',
        point1: 'B',
        point2: 'C',
        showLabel: true,
        color: '#8800FF'
      });

      // Add relationship text
      await toolRegistry.executeTool('geogebra_create_text', {
        text: '"Inscribed: " + inscribedAngle + " Central: " + centralAngle + " Ratio: " + centralAngle/inscribedAngle',
        x: 4,
        y: 2,
        fontSize: 14,
        color: '#000000'
      });

      return {
        construction: 'Circle with inscribed and central angles',
        interactivity: 'Move points A, B, C around the circle to see angle relationships',
        theorems: [
          'Inscribed angle = 1/2 × Central angle (for same arc)',
          'Inscribed angles subtending same arc are equal',
          'Angle in semicircle is 90°'
        ]
      };
    }
  },

  {
    id: 'pythagorean_proof',
    name: 'Pythagorean Theorem Visual Proof',
    category: 'geometry',
    description: 'Interactive visual proof of the Pythagorean theorem using area relationships',
    gradeLevel: '8-10',
    objectives: [
      'Understand Pythagorean theorem relationship',
      'Visualize proof through area',
      'Apply theorem to solve problems'
    ],
    prerequisites: ['Area of squares and triangles', 'Right angle recognition'],
    estimatedTime: 25,
    setup: async () => {
      // Create right triangle
      await toolRegistry.executeTool('geogebra_create_point', {
        name: 'A',
        x: 0,
        y: 0,
        color: '#FF0000',
        size: 4
      });

      await toolRegistry.executeTool('geogebra_create_point', {
        name: 'B',
        x: 3,
        y: 0,
        color: '#FF0000',
        size: 4
      });

      await toolRegistry.executeTool('geogebra_create_point', {
        name: 'C',
        x: 0,
        y: 4,
        color: '#FF0000',
        size: 4,
        moveable: true
      });

      // Create triangle
      await toolRegistry.executeTool('geogebra_create_polygon', {
        name: 'triangle',
        points: ['A', 'B', 'C'],
        color: '#CCCCCC',
        fillOpacity: 0.3
      });

      // Create squares on each side
      // Square on side AB (horizontal)
      await toolRegistry.executeTool('geogebra_create_point', {
        name: 'B1',
        x: 3,
        y: -3,
        color: '#0000FF',
        size: 3
      });

      await toolRegistry.executeTool('geogebra_create_point', {
        name: 'A1', 
        x: 0,
        y: -3,
        color: '#0000FF',
        size: 3
      });

      await toolRegistry.executeTool('geogebra_create_polygon', {
        name: 'squareAB',
        points: ['A', 'B', 'B1', 'A1'],
        color: '#CCDDFF',
        fillOpacity: 0.5
      });

      // Square on side AC (vertical)
      await toolRegistry.executeTool('geogebra_create_point', {
        name: 'A2',
        x: -4,
        y: 0,
        color: '#00AA00',
        size: 3
      });

      await toolRegistry.executeTool('geogebra_create_point', {
        name: 'C2',
        x: -4,
        y: 4,
        color: '#00AA00',
        size: 3
      });

      await toolRegistry.executeTool('geogebra_create_polygon', {
        name: 'squareAC',
        points: ['A', 'C', 'C2', 'A2'],
        color: '#CCFFCC',
        fillOpacity: 0.5
      });

      // Square on hypotenuse BC
      // Calculate perpendicular direction
      await toolRegistry.executeTool('geogebra_create_point', {
        name: 'C3',
        x: 5.4,
        y: 6.8,
        color: '#AA0000',
        size: 3
      });

      await toolRegistry.executeTool('geogebra_create_point', {
        name: 'B3',
        x: 1.4,
        y: 2.8,
        color: '#AA0000',
        size: 3
      });

      await toolRegistry.executeTool('geogebra_create_polygon', {
        name: 'squareBC',
        points: ['B', 'C', 'C3', 'B3'],
        color: '#FFCCCC',
        fillOpacity: 0.5
      });

      // Add measurements and calculations
      await toolRegistry.executeTool('geogebra_create_text', {
        text: '"a = " + Length[AB] + ", a² = " + Length[AB]²',
        x: 1.5,
        y: -1.5,
        fontSize: 12,
        color: '#0000FF'
      });

      await toolRegistry.executeTool('geogebra_create_text', {
        text: '"b = " + Length[AC] + ", b² = " + Length[AC]²',
        x: -3,
        y: 2,
        fontSize: 12,
        color: '#00AA00'
      });

      await toolRegistry.executeTool('geogebra_create_text', {
        text: '"c = " + Length[BC] + ", c² = " + Length[BC]²',
        x: 4,
        y: 3,
        fontSize: 12,
        color: '#AA0000'
      });

      await toolRegistry.executeTool('geogebra_create_text', {
        text: '"a² + b² = " + (Length[AB]² + Length[AC]²)',
        x: 5,
        y: 1,
        fontSize: 14,
        color: '#000000',
        fontStyle: 'bold'
      });

      return {
        construction: 'Right triangle with squares on all three sides',
        interactivity: 'Move point C to change triangle dimensions',
        proof: 'Visual demonstration that area of square on hypotenuse equals sum of areas on other two sides',
        verification: 'Drag point C to verify a² + b² = c² for different right triangles'
      };
    }
  },

  {
    id: 'similarity_triangles',
    name: 'Triangle Similarity Explorer',
    category: 'geometry', 
    description: 'Interactive exploration of similar triangles, scale factors, and corresponding parts',
    gradeLevel: '9-12',
    objectives: [
      'Understand triangle similarity criteria (AA, SAS, SSS)',
      'Calculate scale factors and corresponding measurements',
      'Apply similarity in problem solving'
    ],
    prerequisites: ['Angle measurement', 'Proportional reasoning', 'Basic triangle properties'],
    estimatedTime: 18,
    setup: async () => {
      // Create original triangle
      await toolRegistry.executeTool('geogebra_create_point', {
        name: 'A',
        x: 0,
        y: 0,
        color: '#FF0000',
        size: 4
      });

      await toolRegistry.executeTool('geogebra_create_point', {
        name: 'B',
        x: 6,
        y: 0,
        color: '#FF0000',
        size: 4
      });

      await toolRegistry.executeTool('geogebra_create_point', {
        name: 'C',
        x: 2,
        y: 4,
        color: '#FF0000',
        size: 4,
        moveable: true
      });

      await toolRegistry.executeTool('geogebra_create_polygon', {
        name: 'originalTriangle',
        points: ['A', 'B', 'C'],
        color: '#FF6666',
        fillOpacity: 0.3
      });

      // Create scale factor slider
      await toolRegistry.executeTool('geogebra_create_slider', {
        name: 'scaleFactor',
        min: 0.3,
        max: 2.0,
        value: 0.7,
        increment: 0.1,
        x: 8,
        y: 4,
        width: 150,
        caption: 'Scale Factor'
      });

      // Create similar triangle using scale factor
      await toolRegistry.executeTool('geogebra_create_point', {
        name: 'A2',
        x: 8,
        y: -2,
        color: '#0000FF',
        size: 4
      });

      // Note: In real implementation, these would use the scale factor
      // For now, creating approximate similar triangle
      await toolRegistry.executeTool('geogebra_create_point', {
        name: 'B2',
        x: 12.2,
        y: -2,
        color: '#0000FF',
        size: 4
      });

      await toolRegistry.executeTool('geogebra_create_point', {
        name: 'C2',
        x: 9.4,
        y: 0.8,
        color: '#0000FF',
        size: 4
      });

      await toolRegistry.executeTool('geogebra_create_polygon', {
        name: 'similarTriangle',
        points: ['A2', 'B2', 'C2'],
        color: '#6666FF',
        fillOpacity: 0.3
      });

      // Add corresponding angle markings
      await toolRegistry.executeTool('geogebra_create_angle', {
        name: 'angleA1',
        vertex: 'A',
        point1: 'B',
        point2: 'C',
        showLabel: true,
        color: '#00AA00'
      });

      await toolRegistry.executeTool('geogebra_create_angle', {
        name: 'angleA2',
        vertex: 'A2',
        point1: 'B2',
        point2: 'C2',
        showLabel: true,
        color: '#00AA00'
      });

      // Add measurements and ratios
      await toolRegistry.executeTool('geogebra_create_text', {
        text: '"Original Triangle ABC"',
        x: 1,
        y: 5,
        fontSize: 14,
        color: '#FF0000',
        fontStyle: 'bold'
      });

      await toolRegistry.executeTool('geogebra_create_text', {
        text: '"Similar Triangle A\'B\'C\'"',
        x: 8,
        y: 2,
        fontSize: 14,
        color: '#0000FF',
        fontStyle: 'bold'
      });

      await toolRegistry.executeTool('geogebra_create_text', {
        text: '"AB = " + Length[AB] + ", A\'B\' = " + Length[A2B2]',
        x: 1,
        y: -3,
        fontSize: 12,
        color: '#000000'
      });

      await toolRegistry.executeTool('geogebra_create_text', {
        text: '"Scale Factor = " + scaleFactor',
        x: 8,
        y: 1,
        fontSize: 14,
        color: '#AA00AA',
        fontStyle: 'bold'
      });

      await toolRegistry.executeTool('geogebra_create_text', {
        text: '"Ratio Check: A\'B\'/AB = " + Length[A2B2]/Length[AB]',
        x: 1,
        y: -4,
        fontSize: 12,
        color: '#AA00AA'
      });

      return {
        construction: 'Two similar triangles with adjustable scale factor',
        interactivity: 'Move point C and adjust scale factor to explore similarity',
        concepts: [
          'Similar triangles have equal corresponding angles',
          'Corresponding sides are proportional',
          'Scale factor applies to all linear measurements',
          'Areas scale by square of the scale factor'
        ]
      };
    }
  }
]; 