#!/usr/bin/env node

/**
 * Educational Templates Demo - GEB-8 Implementation
 * 
 * This demo showcases the educational templates functionality implemented for Linear Issue GEB-8.
 * It demonstrates:
 * - Listing available educational templates by category
 * - Loading specific templates for different grade levels
 * - Creating complete lesson plans using templates
 * - Exploring geometry and algebra template categories
 */

import { toolRegistry } from '../src/tools';

async function demonstrateEducationalTemplates() {
  console.log('📚 GeoGebra Educational Templates Demo (GEB-8)\n');

  try {
    // Demo 1: List All Available Templates
    console.log('📋 Demo 1: Listing All Educational Templates');
    
    const allTemplates = await toolRegistry.executeTool('geogebra_list_educational_templates', {});
    const allTemplatesData = JSON.parse(allTemplates.content[0]?.text!);
    
    console.log(`   📊 Total templates available: ${allTemplatesData.count}`);
    console.log('   📁 Template categories:');
    
    const categories = [...new Set(allTemplatesData.templates.map((t: any) => t.category))];
    categories.forEach(category => {
      const categoryCount = allTemplatesData.templates.filter((t: any) => t.category === category).length;
      console.log(`      • ${category}: ${categoryCount} templates`);
    });
    console.log();

    // Demo 2: Explore Geometry Templates
    console.log('📐 Demo 2: Geometry Templates for Middle School');
    
    const geometryTemplates = await toolRegistry.executeTool('geogebra_list_educational_templates', {
      category: 'geometry',
      gradeLevel: '6-8'
    });
    
    const geometryData = JSON.parse(geometryTemplates.content[0]?.text!);
    console.log(`   📊 Found ${geometryData.count} geometry templates for grades 6-8:`);
    
    geometryData.templates.forEach((template: any) => {
      console.log(`      • ${template.name} (${template.estimatedTime} min)`);
      console.log(`        📝 ${template.description}`);
      console.log(`        🎯 Objectives: ${template.objectives.slice(0, 2).join(', ')}...`);
    });
    console.log();

    // Demo 3: Load Triangle Fundamentals Template
    console.log('🔺 Demo 3: Loading Triangle Fundamentals Template');
    
    const triangleTemplate = await toolRegistry.executeTool('geogebra_load_educational_template', {
      templateId: 'triangle_basics',
      customizations: {
        colors: {
          points: '#FF0000',
          lines: '#0000FF'
        },
        showLabels: true
      }
    });
    
    const triangleData = JSON.parse(triangleTemplate.content[0]?.text!);
    console.log(`   ✅ Template loaded: ${triangleData.template.name}`);
    console.log(`   📊 Category: ${triangleData.template.category}`);
    console.log(`   🎯 Learning objectives:`);
    triangleData.objectives.forEach((obj: string) => {
      console.log(`      • ${obj}`);
    });
    console.log(`   📋 ${triangleData.instructions}`);
    console.log();

    // Demo 4: Explore Algebra Templates for High School
    console.log('📈 Demo 4: Algebra Templates for High School');
    
    const algebraTemplates = await toolRegistry.executeTool('geogebra_list_educational_templates', {
      category: 'algebra',
      gradeLevel: '9-12'
    });
    
    const algebraData = JSON.parse(algebraTemplates.content[0]?.text!);
    console.log(`   📊 Found ${algebraData.count} algebra templates for grades 9-12:`);
    
    algebraData.templates.forEach((template: any) => {
      console.log(`      • ${template.name} (${template.estimatedTime} min)`);
      console.log(`        📈 Focus: ${template.description.substring(0, 60)}...`);
    });
    console.log();

    // Demo 5: Load Quadratic Explorer Template
    console.log('📊 Demo 5: Loading Quadratic Function Explorer');
    
    const quadraticTemplate = await toolRegistry.executeTool('geogebra_load_educational_template', {
      templateId: 'quadratic_explorer'
    });
    
    const quadraticData = JSON.parse(quadraticTemplate.content[0]?.text!);
    console.log(`   ✅ Template loaded: ${quadraticData.template.name}`);
    console.log(`   🎯 Educational objectives:`);
    quadraticData.objectives.forEach((obj: string) => {
      console.log(`      • ${obj}`);
    });
    console.log();

    // Demo 6: Create Complete Lesson Plan
    console.log('📚 Demo 6: Creating Complete Lesson Plan');
    
    const lessonPlan = await toolRegistry.executeTool('geogebra_create_lesson_plan', {
      topic: 'Functions and Graphing',
      gradeLevel: '9-12',
      duration: 50,
      templateIds: ['quadratic_explorer', 'linear_systems_graphical']
    });
    
    const lessonData = JSON.parse(lessonPlan.content[0]?.text!);
    console.log(`   📋 Lesson Plan: ${lessonData.topic}`);
    console.log(`   🎓 Grade Level: ${lessonData.gradeLevel}`);
    console.log(`   ⏱️  Duration: ${lessonData.duration} minutes`);
    console.log(`   📊 Total Activity Time: ${lessonData.totalTime} minutes`);
    console.log();
    console.log('   📚 Lesson Structure:');
    console.log(`      📖 Introduction: ${lessonData.structure.introduction}`);
    lessonData.structure.activities.forEach((activity: string, index: number) => {
      console.log(`      🔬 ${activity}`);
    });
    console.log(`      📝 Conclusion: ${lessonData.structure.conclusion}`);
    console.log();

    // Demo 7: Auto-Generated Lesson Plan
    console.log('🤖 Demo 7: Auto-Generated Lesson Plan');
    
    const autoLessonPlan = await toolRegistry.executeTool('geogebra_create_lesson_plan', {
      topic: 'Geometry Foundations',
      gradeLevel: '6-8',
      duration: 45
    });
    
    const autoLessonData = JSON.parse(autoLessonPlan.content[0]?.text!);
    console.log(`   🎯 Auto-selected ${autoLessonData.templates.length} templates for geometry lesson:`);
    autoLessonData.templates.forEach((template: any) => {
      console.log(`      • ${template.name} (${template.estimatedTime} min)`);
      console.log(`        Prerequisites: ${template.prerequisites.join(', ')}`);
    });
    console.log();

    // Demo 8: Template Categories Summary
    console.log('📊 Demo 8: Template System Summary');
    
    console.log('   📚 Educational Template Categories:');
    console.log('      📐 Geometry: Interactive geometric constructions and proofs');
    console.log('      📈 Algebra: Function exploration and equation systems');
    console.log('      📊 Calculus: Derivatives, integrals, and limit visualizations');
    console.log('      📉 Statistics: Data analysis and probability demonstrations');
    console.log('      📝 Proofs: Step-by-step mathematical proof assistance');
    console.log();
    console.log('   🎯 Key Features:');
    console.log('      ✅ Grade-level appropriate content');
    console.log('      ✅ Estimated time requirements');
    console.log('      ✅ Clear learning objectives');
    console.log('      ✅ Prerequisite tracking');
    console.log('      ✅ Interactive parameter adjustment');
    console.log('      ✅ Customizable visual elements');
    console.log('      ✅ Automatic lesson plan generation');
    console.log();

    console.log('🎉 Educational Templates Demo Completed Successfully!');
    console.log('📋 Summary:');
    console.log(`   • ${allTemplatesData.count} total templates available`);
    console.log('   • Multiple grade levels supported (6-8, 9-12, college)');
    console.log('   • Comprehensive lesson planning tools');
    console.log('   • Interactive mathematical explorations');
    console.log('   • Ready for classroom implementation');

  } catch (error) {
    console.error('❌ Demo failed:', error);
    process.exit(1);
  }
}

// Run the demo
if (require.main === module) {
  demonstrateEducationalTemplates()
    .then(() => {
      console.log('\n✅ Demo completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Demo failed:', error);
      process.exit(1);
    });
}

export { demonstrateEducationalTemplates }; 