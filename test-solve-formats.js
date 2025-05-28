const { toolRegistry } = require('./dist/tools/index.js');

async function testFormats() {
  try {
    console.log('Testing different GeoGebra Solve command formats...');
    
    const formats = [
      'Solve({x + y = 5, x - y = 1}, {x, y})',
      'Solve({x + y - 5 = 0, x - y - 1 = 0}, {x, y})',
      'Solve({x + y - 5, x - y - 1}, {x, y})',
      'Solve(x + y = 5 && x - y = 1, {x, y})'
    ];
    
    for (let i = 0; i < formats.length; i++) {
      console.log(`\n${i + 1}. Testing format: ${formats[i]}`);
      try {
        const result = await toolRegistry.executeTool('geogebra_eval_command', {
          command: formats[i]
        });
        console.log('Result:', JSON.parse(result.content[0].text));
      } catch (error) {
        console.log('Error:', error.message);
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testFormats().then(() => process.exit(0)); 