const { toolRegistry } = require('./dist/tools/index.js');

async function debugSolveSystem() {
  console.log('=== Debugging Solve System Tool ===\n');
  
  try {
    // First, let's test what happens when we use direct Solve commands
    console.log('1. Testing direct Solve commands...');
    
    const directSolve1 = await toolRegistry.executeTool('geogebra_eval_command', {
      command: 'solution1 = Solve(2*x = 6)'
    });
    console.log('Direct solve 2*x = 6:', JSON.parse(directSolve1.content[0].text));
    
    const directSolve2 = await toolRegistry.executeTool('geogebra_eval_command', {
      command: 'solution2 = Solve(2*y = 4)'
    });
    console.log('Direct solve 2*y = 4:', JSON.parse(directSolve2.content[0].text));
    
    // Check if these objects exist and what their values are
    console.log('\n2. Checking object existence and values...');
    
    const checkSol1 = await toolRegistry.executeTool('geogebra_eval_command', {
      command: 'solution1'
    });
    console.log('solution1 object value:', JSON.parse(checkSol1.content[0].text));
    
    const checkSol2 = await toolRegistry.executeTool('geogebra_eval_command', {
      command: 'solution2'
    });
    console.log('solution2 object value:', JSON.parse(checkSol2.content[0].text));
    
    // Try to get the solutions using different approaches
    console.log('\n3. Testing alternative solve syntax...');
    
    const altSolve1 = await toolRegistry.executeTool('geogebra_eval_command', {
      command: 'alt1 = Solve(x = 3)'
    });
    console.log('Alternative solve x = 3:', JSON.parse(altSolve1.content[0].text));
    
    const altSolve2 = await toolRegistry.executeTool('geogebra_eval_command', {
      command: 'alt2 = Solve(y = 2)'
    });
    console.log('Alternative solve y = 2:', JSON.parse(altSolve2.content[0].text));
    
    // Check what happens with simple arithmetic
    console.log('\n4. Testing simple arithmetic...');
    
    const arithTest1 = await toolRegistry.executeTool('geogebra_eval_command', {
      command: 'result1 = 6 / 2'
    });
    console.log('6 / 2 =', JSON.parse(arithTest1.content[0].text));
    
    const arithTest2 = await toolRegistry.executeTool('geogebra_eval_command', {
      command: 'result2 = 4 / 2'
    });
    console.log('4 / 2 =', JSON.parse(arithTest2.content[0].text));
    
    // Test the actual solve_system tool now
    console.log('\n5. Testing solve_system tool...');
    
    const systemResult = await toolRegistry.executeTool('geogebra_solve_system', {
      equations: ['x + y = 5', 'x - y = 1'],
      variables: ['x', 'y']
    });
    console.log('System solve result:', JSON.parse(systemResult.content[0].text));
    
    console.log('\n6. Testing what objects exist in the workspace...');
    
    const allObjects = await toolRegistry.executeTool('geogebra_get_objects', {});
    console.log('All objects:', JSON.parse(allObjects.content[0].text));
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

debugSolveSystem().then(() => process.exit(0)); 