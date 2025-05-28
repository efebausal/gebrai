const { toolRegistry } = require('./dist/tools/index.js');

async function testBasicCommands() {
  try {
    console.log('Testing basic GeoGebra commands...');
    
    const commands = [
      'A = (1, 2)',
      'f(x) = x^2',
      'Derivative(x^2)',
      'Simplify(2x + 3x)',
      'Solve(x^2 = 4)',
      'NSolve(x^2 = 4)'
    ];
    
    for (let i = 0; i < commands.length; i++) {
      console.log(`\n${i + 1}. Testing command: ${commands[i]}`);
      try {
        const result = await toolRegistry.executeTool('geogebra_eval_command', {
          command: commands[i]
        });
        const parsed = JSON.parse(result.content[0].text);
        console.log('Success:', parsed.success);
        if (parsed.success) {
          console.log('Result:', parsed.result);
        } else {
          console.log('Error:', parsed.error);
        }
      } catch (error) {
        console.log('Error:', error.message);
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testBasicCommands().then(() => process.exit(0)); 