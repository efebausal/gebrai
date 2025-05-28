const { toolRegistry } = require('./dist/tools/index.js');

async function checkGeoGebraVersion() {
  try {
    // Check what simple solve commands work
    console.log('Testing simple solve commands...');
    
    const result1 = await toolRegistry.executeTool('geogebra_eval_command', {
      command: 'Solve(x + 3 = 7)'
    });
    console.log('Simple solve:', JSON.parse(result1.content[0].text));
    
    const result2 = await toolRegistry.executeTool('geogebra_eval_command', {
      command: 'Solve(x^2 = 4)'
    });
    console.log('Quadratic solve:', JSON.parse(result2.content[0].text));
    
    // Try alternative syntax
    const result3 = await toolRegistry.executeTool('geogebra_eval_command', {
      command: 'Solutions(x^2 = 4)'
    });
    console.log('Solutions command:', JSON.parse(result3.content[0].text));
    
    // Try basic arithmetic
    const result4 = await toolRegistry.executeTool('geogebra_eval_command', {
      command: '2 + 3'
    });
    console.log('Basic arithmetic:', JSON.parse(result4.content[0].text));
    
    // Test what CAS functions are available
    const result5 = await toolRegistry.executeTool('geogebra_eval_command', {
      command: 'Factor(x^2 - 4)'
    });
    console.log('Factor command:', JSON.parse(result5.content[0].text));
    
    // Try linear system with matrix approach
    const result6 = await toolRegistry.executeTool('geogebra_eval_command', {
      command: 'SolveQuadratic(x^2 - 4)'
    });
    console.log('SolveQuadratic command:', JSON.parse(result6.content[0].text));
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkGeoGebraVersion().then(() => process.exit(0)); 