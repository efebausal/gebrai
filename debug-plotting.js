#!/usr/bin/env node

const { toolRegistry } = require('./src/tools');

async function debugPlottingTools() {
  console.log('🔍 Debugging plotting tools...\n');

  try {
    // Test plot_function
    console.log('Testing geogebra_plot_function...');
    const functionResult = await toolRegistry.executeTool('geogebra_plot_function', {
      name: 'f',
      expression: 'x^2'
    });
    
    const functionResponse = JSON.parse(functionResult.content[0]?.text);
    console.log('Function result:', JSON.stringify(functionResponse, null, 2));
    
    // Test plot_parametric
    console.log('\nTesting geogebra_plot_parametric...');
    const parametricResult = await toolRegistry.executeTool('geogebra_plot_parametric', {
      name: 'circle',
      xExpression: 'cos(t)',
      yExpression: 'sin(t)',
      parameter: 't',
      tMin: 0,
      tMax: 6.28
    });
    
    const parametricResponse = JSON.parse(parametricResult.content[0]?.text);
    console.log('Parametric result:', JSON.stringify(parametricResponse, null, 2));
    
    // Test plot_implicit
    console.log('\nTesting geogebra_plot_implicit...');
    const implicitResult = await toolRegistry.executeTool('geogebra_plot_implicit', {
      name: 'circle',
      expression: 'x^2 + y^2 - 4'
    });
    
    const implicitResponse = JSON.parse(implicitResult.content[0]?.text);
    console.log('Implicit result:', JSON.stringify(implicitResponse, null, 2));
    
  } catch (error) {
    console.error('Debug failed:', error);
  }
}

debugPlottingTools(); 