const { toolRegistry } = require('./dist/tools/index.js');

async function testIndividualSolve() {
  console.log('Testing individual equation solving...');
  
  try {
    // Test single equation solving which should work
    const result1 = await toolRegistry.executeTool('geogebra_solve_equation', {
      equation: 'x^2 = 4',
      variable: 'x'
    });
    console.log('Single equation result:', JSON.parse(result1.content[0].text));
    
    // Test another single equation
    const result2 = await toolRegistry.executeTool('geogebra_solve_equation', {
      equation: 'x + 3 = 7'
    });
    console.log('Linear equation result:', JSON.parse(result2.content[0].text));
    
    // Test manual system solving by substitution
    console.log('\nTesting manual system approach...');
    
    // First, create the equations as function definitions
    const cmd1 = await toolRegistry.executeTool('geogebra_eval_command', {
      command: 'eq1(x, y) = x + y - 5'
    });
    console.log('Equation 1 creation:', JSON.parse(cmd1.content[0].text));
    
    const cmd2 = await toolRegistry.executeTool('geogebra_eval_command', {
      command: 'eq2(x, y) = x - y - 1'
    });
    console.log('Equation 2 creation:', JSON.parse(cmd2.content[0].text));
    
    // Try to solve individual variables
    const solveX = await toolRegistry.executeTool('geogebra_solve_equation', {
      equation: 'x + y = 5',
      variable: 'x'
    });
    console.log('Solve for x:', JSON.parse(solveX.content[0].text));
    
    // Test if we can use CAS commands differently
    console.log('\nTesting different CAS approaches...');
    
    // Try solving from substitution: x + y = 5 => y = 5 - x, substitute into x - y = 1
    // So: x - (5 - x) = 1 => x - 5 + x = 1 => 2x = 6 => x = 3
    const substituteResult = await toolRegistry.executeTool('geogebra_solve_equation', {
      equation: '2*x - 5 = 1',
      variable: 'x'
    });
    console.log('Substitution solve:', JSON.parse(substituteResult.content[0].text));
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testIndividualSolve().then(() => process.exit(0)); 