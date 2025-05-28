const { toolRegistry } = require('./dist/tools/index.js');

async function testSolveSystem() {
  try {
    console.log('Testing solve_system tool...');
    const result = await toolRegistry.executeTool('geogebra_solve_system', {
      equations: ['x + y = 5', 'x - y = 1'],
      variables: ['x', 'y']
    });
    console.log('Success:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testSolveSystem().then(() => process.exit(0)); 