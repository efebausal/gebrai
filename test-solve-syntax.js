const { GeoGebraInstance } = require('./dist/utils/geogebra-instance');

async function testSolveSyntax() {
  console.log('=== Testing Different GeoGebra Solve Syntax ===');
  
  const instance = new GeoGebraInstance({
    appName: 'classic',
    width: 800,
    height: 600,
    showMenuBar: false,
    showToolBar: false,
    showAlgebraInput: false
  });

  try {
    console.log('Initializing GeoGebra instance...');
    await instance.initialize(true);
    
    console.log('Instance ready, testing different solve syntaxes...');
    
    const testCases = [
      // From GeoGebra documentation examples
      'sol1 = Solve({x = 4*x + y, y + x = 2}, {x, y})',
      'sol2 = Solve({2*a^2 + 5*a + 3 = b, a + b = 3}, {a, b})',
      
      // Try our equations in different formats
      'sol3 = Solve({x + y = 5, x - y = 1}, {x, y})',
      'sol4 = Solve({x + y - 5 = 0, x - y - 1 = 0}, {x, y})',
      'sol5 = Solve({x + y - 5, x - y - 1}, {x, y})',
      
      // Try with explicit variable isolation
      'sol6 = Solve({y = 5 - x, y = x - 1}, {x, y})',
      
      // Try single equation format
      'sol7 = Solve(x + y = 5 && x - y = 1, {x, y})',
      
      // Try NSolve instead
      'sol8 = NSolve({x + y = 5, x - y = 1}, {x, y})',
      'sol9 = NSolve({x + y - 5 = 0, x - y - 1 = 0}, {x, y})',
    ];
    
    for (let i = 0; i < testCases.length; i++) {
      const cmd = testCases[i];
      console.log(`\n${i + 1}. Testing: ${cmd}`);
      
      try {
        const result = await instance.evalCommand(cmd);
        console.log('Command result:', result);
        
        const objName = cmd.split(' = ')[0];
        const objExists = await instance.exists(objName);
        console.log(`Object "${objName}" exists:`, objExists);
        
        if (objExists) {
          const valueStr = await instance.getValueString(objName);
          console.log(`Value string:`, valueStr);
        }
      } catch (error) {
        console.log('Error:', error.message);
      }
    }
    
    // Test getting all objects to see what was created
    console.log('\n=== All objects in construction ===');
    const allObjects = await instance.getAllObjectNames();
    console.log('All objects:', allObjects);
    
    for (const objName of allObjects) {
      try {
        const valueStr = await instance.getValueString(objName);
        console.log(`${objName}: ${valueStr}`);
      } catch (e) {
        console.log(`${objName}: (could not get value)`);
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await instance.cleanup();
  }
}

testSolveSyntax().catch(console.error); 