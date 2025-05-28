/**
 * Gemini Compatibility Utilities
 * 
 * Gemini 2.5 Pro Preview requires stricter JSON Schema compliance:
 * - All properties MUST have explicit "type" fields
 * - No support for oneOf/anyOf/allOf constructs
 * - Type must be specified for all parameter properties
 */

export interface GeminiCompatibleSchema {
  type: 'object';
  properties: Record<string, {
    type: 'string' | 'number' | 'boolean' | 'integer' | 'array' | 'object';
    description?: string;
    minimum?: number;
    maximum?: number;
    items?: any;
    properties?: any;
    required?: string[];
    [key: string]: any;
  }>;
  required?: string[];
  [key: string]: any;
}

/**
 * Transform a schema to be compatible with Gemini 2.5 Pro Preview
 */
export function makeGeminiCompatible(schema: any): GeminiCompatibleSchema {
  if (!schema || typeof schema !== 'object') {
    return {
      type: 'object',
      properties: {},
      required: []
    };
  }

  const result: GeminiCompatibleSchema = {
    type: 'object',
    properties: {},
    required: schema.required || []
  };

  // Ensure all properties have explicit types
  if (schema.properties && typeof schema.properties === 'object') {
    for (const [key, prop] of Object.entries(schema.properties as Record<string, any>)) {
      if (!prop || typeof prop !== 'object') {
        continue;
      }

      const transformedProp: any = { ...prop };

      // Ensure type is explicitly set
      if (!transformedProp.type) {
        // Infer type from other properties or default to string
        if (transformedProp.minimum !== undefined || transformedProp.maximum !== undefined) {
          transformedProp.type = 'number';
        } else if (transformedProp.items !== undefined) {
          transformedProp.type = 'array';
        } else if (transformedProp.properties !== undefined) {
          transformedProp.type = 'object';
        } else {
          transformedProp.type = 'string';
        }
      }

      // Remove any oneOf/anyOf/allOf constructs as Gemini doesn't support them
      delete transformedProp.oneOf;
      delete transformedProp.anyOf;
      delete transformedProp.allOf;

      // Recursively transform nested objects
      if (transformedProp.type === 'object' && transformedProp.properties) {
        transformedProp.properties = makeGeminiCompatible({
          type: 'object',
          properties: transformedProp.properties,
          required: transformedProp.required
        }).properties;
      }

      // Transform array items if present
      if (transformedProp.type === 'array' && transformedProp.items) {
        if (typeof transformedProp.items === 'object' && !transformedProp.items.type) {
          transformedProp.items = makeGeminiCompatible(transformedProp.items);
        }
      }

      result.properties[key] = transformedProp;
    }
  }

  return result;
}

/**
 * Check if a schema needs Gemini compatibility fixes
 */
export function needsGeminiCompatibility(schema: any): boolean {
  if (!schema || typeof schema !== 'object') {
    return false;
  }

  // Check for missing type at root level
  if (!schema.type) {
    return true;
  }

  // Check for oneOf/anyOf/allOf constructs
  if (schema.oneOf || schema.anyOf || schema.allOf) {
    return true;
  }

  // Check properties for missing types
  if (schema.properties && typeof schema.properties === 'object') {
    for (const prop of Object.values(schema.properties as Record<string, any>)) {
      if (prop && typeof prop === 'object' && !prop.type) {
        return true;
      }
      
      // Check for oneOf/anyOf/allOf in properties
      if (prop && (prop.oneOf || prop.anyOf || prop.allOf)) {
        return true;
      }

      // Recursively check nested objects
      if (prop && prop.type === 'object' && prop.properties && needsGeminiCompatibility(prop)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Validate that a schema is Gemini-compatible
 */
export function validateGeminiCompatibility(schema: any): { 
  isCompatible: boolean; 
  issues: string[];
} {
  const issues: string[] = [];

  if (!schema || typeof schema !== 'object') {
    issues.push('Schema is not an object');
    return { isCompatible: false, issues };
  }

  if (!schema.type) {
    issues.push('Root schema missing type field');
  }

  if (schema.oneOf) {
    issues.push('Root schema uses oneOf (not supported by Gemini)');
  }

  if (schema.anyOf) {
    issues.push('Root schema uses anyOf (not supported by Gemini)');
  }

  if (schema.allOf) {
    issues.push('Root schema uses allOf (not supported by Gemini)');
  }

  if (schema.properties && typeof schema.properties === 'object') {
    for (const [key, prop] of Object.entries(schema.properties as Record<string, any>)) {
      if (!prop || typeof prop !== 'object') {
        continue;
      }

      if (!prop.type) {
        issues.push(`Property "${key}" missing type field`);
      }

      if (prop.oneOf) {
        issues.push(`Property "${key}" uses oneOf (not supported by Gemini)`);
      }

      if (prop.anyOf) {
        issues.push(`Property "${key}" uses anyOf (not supported by Gemini)`);
      }

      if (prop.allOf) {
        issues.push(`Property "${key}" uses allOf (not supported by Gemini)`);
      }
    }
  }

  return {
    isCompatible: issues.length === 0,
    issues
  };
} 