import { toolRegistry } from './src/tools/index';

// Test if the schema is compatible with Claude Sonnet 4
function testSchemaCompatibility() {
  console.log('🧪 Testing MCP Tool Schema Compatibility with Claude Sonnet 4\n');
  
  const tools = toolRegistry.getTools();
  
  let allPassed = true;
  let incompatibleTools: string[] = [];
  
  tools.forEach(tool => {
    console.log(`✅ Testing: ${tool.name}`);
    
    // Check for incompatible oneOf usage
    if ('oneOf' in tool.inputSchema && tool.inputSchema['oneOf']) {
      console.log(`  ❌ ERROR: Tool "${tool.name}" uses oneOf schema (incompatible with Claude Sonnet 4)`);
      incompatibleTools.push(tool.name);
      allPassed = false;
    } else {
      console.log(`  ✅ Schema structure: Compatible`);
    }
    
    // Check schema structure
    if (!tool.inputSchema.type || tool.inputSchema.type !== 'object') {
      console.log(`  ❌ ERROR: Tool "${tool.name}" missing or invalid type`);
      allPassed = false;
    }
    
    if (!tool.inputSchema.properties) {
      console.log(`  ❌ ERROR: Tool "${tool.name}" missing properties`);
      allPassed = false;
    }
    
    console.log(''); // Empty line for readability
  });
  
  console.log('📊 Schema Compatibility Summary:');
  console.log(`Total tools tested: ${tools.length}`);
  console.log(`Compatible: ${tools.length - incompatibleTools.length}`);
  console.log(`Incompatible: ${incompatibleTools.length}`);
  
  if (allPassed) {
    console.log('\n🎉 All tool schemas are compatible with Claude Sonnet 4!');
  } else {
    console.log('\n❌ Some tools have compatibility issues:');
    incompatibleTools.forEach(toolName => {
      console.log(`  - ${toolName}`);
    });
  }
  
  return allPassed;
}

// Run the test
testSchemaCompatibility(); 