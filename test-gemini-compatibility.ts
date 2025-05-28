/**
 * Test for Gemini 2.5 Pro Preview compatibility with GeoGebra MCP tools
 * 
 * This test validates that the tool schemas are compatible with Gemini's
 * JSON Schema requirements, specifically checking for invalid properties
 * like 'optional' that cause compatibility issues.
 */

import { toolRegistry } from './src/tools';

interface JSONSchemaProperty {
  type: string;
  description?: string;
  minimum?: number;
  maximum?: number;
  enum?: string[];
  items?: any;
  properties?: Record<string, any>;
  required?: string[];
  additionalProperties?: boolean;
}

interface JSONSchema {
  type: string;
  properties: Record<string, JSONSchemaProperty>;
  required: string[];
  [key: string]: any;
}

function validateSchema(schema: JSONSchema, toolName: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const invalidProperties = ['optional']; // Properties that break Gemini compatibility
  
  // Check for invalid top-level properties
  for (const invalidProp of invalidProperties) {
    if (invalidProp in schema) {
      errors.push(`Tool ${toolName}: Invalid schema property '${invalidProp}' found at top level`);
    }
  }
  
  // Check properties for invalid fields
  if (schema.properties) {
    Object.entries(schema.properties).forEach(([propName, propSchema]) => {
      for (const invalidProp of invalidProperties) {
        if (invalidProp in propSchema) {
          errors.push(`Tool ${toolName}: Invalid schema property '${invalidProp}' found in property '${propName}'`);
        }
      }
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

async function testGeminiCompatibility() {
  console.log('🧪 Testing Gemini 2.5 Pro Preview Compatibility\n');
  
  const allTools = toolRegistry.getTools();
  const exportTools = allTools.filter(tool => tool.name.includes('export'));
  
  let totalErrors = 0;
  const problematicTools: string[] = [];
  
  console.log(`Found ${exportTools.length} export tools to validate:\n`);
  
  for (const tool of exportTools) {
    console.log(`📋 Validating: ${tool.name}`);
    
    const validation = validateSchema(tool.inputSchema as JSONSchema, tool.name);
    
    if (validation.isValid) {
      console.log(`   ✅ Schema is Gemini-compatible`);
    } else {
      console.log(`   ❌ Schema has compatibility issues:`);
      validation.errors.forEach(error => {
        console.log(`      - ${error}`);
      });
      totalErrors += validation.errors.length;
      problematicTools.push(tool.name);
    }
    console.log();
  }
  
  // Summary
  console.log('📊 Validation Summary:');
  console.log(`   Total tools validated: ${exportTools.length}`);
  console.log(`   Compatible tools: ${exportTools.length - problematicTools.length}`);
  console.log(`   Problematic tools: ${problematicTools.length}`);
  console.log(`   Total errors: ${totalErrors}\n`);
  
  if (problematicTools.length > 0) {
    console.log('❌ Tools with compatibility issues:');
    problematicTools.forEach(tool => console.log(`   - ${tool}`));
    console.log('\nThese tools need schema fixes for Gemini compatibility.');
    process.exit(1);
  } else {
    console.log('✅ All export tools are compatible with Gemini 2.5 Pro Preview!');
    console.log('The MCP server should now work correctly with Gemini.');
  }
}

// Run the test
testGeminiCompatibility().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
}); 