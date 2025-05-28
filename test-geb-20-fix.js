const { toolRegistry } = require('./dist/tools/index.js');

async function testGEB20Fix() {
  console.log('=== Testing GEB-20 Fix: Solve System Tool ===');
  
  try {
    // Test the solve_system tool
    console.log('\n1. Testing solve_system tool...');
    const solveSystemTool = toolRegistry.getTool('geogebra_solve_system');
    
    if (!solveSystemTool) {
      throw new Error('solve_system tool not found');
    }
    
    const solveResult = await solveSystemTool.handler({
      equations: ['x + y = 5', 'x - y = 1'],
      variables: ['x', 'y']
    });
    
    console.log('Solve system result:', JSON.stringify(solveResult, null, 2));
    
    // Test the differentiate tool
    console.log('\n2. Testing differentiate tool...');
    const differentiateTool = toolRegistry.getTool('geogebra_differentiate');
    
    if (!differentiateTool) {
      throw new Error('differentiate tool not found');
    }
    
    const differentiateResult = await differentiateTool.handler({
      expression: 'x^2 + 3x + 2',
      variable: 'x'
    });
    
    console.log('Differentiate result:', JSON.stringify(differentiateResult, null, 2));
    
    // Test the integrate tool
    console.log('\n3. Testing integrate tool...');
    const integrateTool = toolRegistry.getTool('geogebra_integrate');
    
    if (!integrateTool) {
      throw new Error('integrate tool not found');
    }
    
    const integrateResult = await integrateTool.handler({
      expression: '2x + 1',
      variable: 'x'
    });
    
    console.log('Integrate result:', JSON.stringify(integrateResult, null, 2));
    
    // Test the simplify tool
    console.log('\n4. Testing simplify tool...');
    const simplifyTool = toolRegistry.getTool('geogebra_simplify');
    
    if (!simplifyTool) {
      throw new Error('simplify tool not found');
    }
    
    const simplifyResult = await simplifyTool.handler({
      expression: 'x^2 + 2x + 1'
    });
    
    console.log('Simplify result:', JSON.stringify(simplifyResult, null, 2));
    
    console.log('\n=== All tests completed ===');
    
  } catch (error) {
    console.error('Test failed:', error);
    console.error('Stack:', error.stack);
  }
}

testGEB20Fix().then(() => {
  console.log('Test finished');
  process.exit(0);
}).catch(error => {
  console.error('Test error:', error);
  process.exit(1);
}); 