/**
 * Validation utilities for GeoGebra MCP tools
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate point name (GeoGebra naming conventions)
 */
export function validatePointName(name: string): ValidationResult {
  if (!name || typeof name !== 'string') {
    return { isValid: false, error: 'Point name must be a non-empty string' };
  }
  
  if (name.length === 0) {
    return { isValid: false, error: 'Point name cannot be empty' };
  }
  
  // GeoGebra naming rules: start with letter, can contain letters, numbers, underscore
  const namePattern = /^[a-zA-Z][a-zA-Z0-9_]*$/;
  if (!namePattern.test(name)) {
    return { isValid: false, error: 'Point name must start with a letter and contain only letters, numbers, and underscores' };
  }
  
  return { isValid: true };
}

/**
 * Validate object name (general GeoGebra naming conventions)
 */
export function validateObjectName(name: string): ValidationResult {
  return validatePointName(name); // Same rules apply
}

/**
 * Validate coordinates
 */
export function validateCoordinates(x: number, y: number): ValidationResult {
  if (typeof x !== 'number' || typeof y !== 'number') {
    return { isValid: false, error: 'Coordinates must be numbers' };
  }
  
  if (!isFinite(x) || !isFinite(y)) {
    return { isValid: false, error: 'Coordinates must be finite numbers' };
  }
  
  // Reasonable coordinate range for visualization
  const maxCoord = 1000000;
  if (Math.abs(x) > maxCoord || Math.abs(y) > maxCoord) {
    return { isValid: false, error: `Coordinates must be within range [-${maxCoord}, ${maxCoord}]` };
  }
  
  return { isValid: true };
}

/**
 * Validate radius
 */
export function validateRadius(radius: number): ValidationResult {
  if (typeof radius !== 'number') {
    return { isValid: false, error: 'Radius must be a number' };
  }
  
  if (!isFinite(radius)) {
    return { isValid: false, error: 'Radius must be a finite number' };
  }
  
  if (radius < 0) {
    return { isValid: false, error: 'Radius must be non-negative' };
  }
  
  if (radius > 1000000) {
    return { isValid: false, error: 'Radius must be reasonable (≤ 1,000,000)' };
  }
  
  return { isValid: true };
}

/**
 * Validate polygon vertices
 */
export function validatePolygonVertices(vertices: string[]): ValidationResult {
  if (!Array.isArray(vertices)) {
    return { isValid: false, error: 'Vertices must be an array' };
  }
  
  if (vertices.length < 3) {
    return { isValid: false, error: 'Polygon must have at least 3 vertices' };
  }
  
  if (vertices.length > 100) {
    return { isValid: false, error: 'Polygon cannot have more than 100 vertices' };
  }
  
  // Check for duplicate vertices
  const uniqueVertices = new Set(vertices);
  if (uniqueVertices.size !== vertices.length) {
    return { isValid: false, error: 'Polygon vertices must be unique' };
  }
  
  // Validate each vertex name
  for (let i = 0; i < vertices.length; i++) {
    const vertex = vertices[i];
    if (!vertex) {
      return { isValid: false, error: `Vertex ${i + 1} is undefined or empty` };
    }
    const validation = validatePointName(vertex);
    if (!validation.isValid) {
      return { isValid: false, error: `Vertex ${i + 1}: ${validation.error}` };
    }
  }
  
  return { isValid: true };
}

/**
 * Validate linear equation format
 */
export function validateLinearEquation(equation: string): ValidationResult {
  if (!equation || typeof equation !== 'string') {
    return { isValid: false, error: 'Equation must be a non-empty string' };
  }
  
  if (!equation.includes('=')) {
    return { isValid: false, error: 'Equation must contain an equals sign (=)' };
  }
  
  // Basic validation for common linear equation formats
  const patterns = [
    /^y\s*=\s*[+-]?\s*\d*\.?\d*\s*\*?\s*x\s*[+-]\s*\d+\.?\d*$/, // y = mx + b
    /^y\s*=\s*[+-]?\s*\d+\.?\d*\s*\*?\s*x$/, // y = mx
    /^y\s*=\s*[+-]?\s*\d+\.?\d*$/, // y = b (horizontal line)
    /^x\s*=\s*[+-]?\s*\d+\.?\d*$/, // x = a (vertical line)
    /^[+-]?\s*\d*\.?\d*\s*\*?\s*x\s*[+-]\s*\d*\.?\d*\s*\*?\s*y\s*=\s*[+-]?\s*\d+\.?\d*$/, // ax + by = c
  ];
  
  const normalizedEq = equation.replace(/\s+/g, ' ').trim();
  const isValidFormat = patterns.some(pattern => pattern.test(normalizedEq));
  
  if (!isValidFormat) {
    return { 
      isValid: false, 
      error: 'Equation format not recognized. Use formats like "y = 2x + 3", "x = 5", or "2x + 3y = 6"' 
    };
  }
  
  return { isValid: true };
}

/**
 * Validate that required parameters are provided for a given method
 */
export function validateRequiredParams(params: Record<string, unknown>, required: string[]): ValidationResult {
  for (const param of required) {
    if (!(param in params) || params[param] === undefined || params[param] === null) {
      return { isValid: false, error: `Missing required parameter: ${param}` };
    }
  }
  return { isValid: true };
}

/**
 * Validate function expression for standard functions f(x) = ...
 */
export function validateFunctionExpression(expression: string): ValidationResult {
  if (!expression || typeof expression !== 'string') {
    return { isValid: false, error: 'Function expression must be a non-empty string' };
  }

  const trimmed = expression.trim();
  if (trimmed.length === 0) {
    return { isValid: false, error: 'Function expression cannot be empty' };
  }

  // Basic validation for function expressions
  // Allow common mathematical functions and operators
  const allowedPattern = /^[x\d\+\-\*\/\^\(\)\.\s,sincotaglnbsqrtepie]*$/i;
  if (!allowedPattern.test(trimmed)) {
    return { isValid: false, error: 'Function expression contains invalid characters. Use only x, numbers, +, -, *, /, ^, (), sin, cos, tan, log, ln, sqrt, abs, e, pi' };
  }

  // Check for balanced parentheses
  let parenCount = 0;
  for (const char of trimmed) {
    if (char === '(') parenCount++;
    if (char === ')') parenCount--;
    if (parenCount < 0) {
      return { isValid: false, error: 'Unbalanced parentheses in function expression' };
    }
  }
  if (parenCount !== 0) {
    return { isValid: false, error: 'Unbalanced parentheses in function expression' };
  }

  return { isValid: true };
}

/**
 * Validate parametric function expressions
 */
export function validateParametricExpressions(xExpr: string, yExpr: string, parameter: string): ValidationResult {
  if (!parameter || typeof parameter !== 'string') {
    return { isValid: false, error: 'Parameter name must be a non-empty string' };
  }

  // Validate parameter name (typically t, u, s, etc.)
  const paramPattern = /^[a-zA-Z][a-zA-Z0-9]*$/;
  if (!paramPattern.test(parameter)) {
    return { isValid: false, error: 'Parameter name must start with a letter and contain only letters and numbers' };
  }

  // Validate x expression
  const xValidation = validateParametricExpression(xExpr, parameter);
  if (!xValidation.isValid) {
    return { isValid: false, error: `X expression: ${xValidation.error}` };
  }

  // Validate y expression
  const yValidation = validateParametricExpression(yExpr, parameter);
  if (!yValidation.isValid) {
    return { isValid: false, error: `Y expression: ${yValidation.error}` };
  }

  return { isValid: true };
}

/**
 * Validate a single parametric expression
 */
function validateParametricExpression(expression: string, parameter: string): ValidationResult {
  if (!expression || typeof expression !== 'string') {
    return { isValid: false, error: 'Expression must be a non-empty string' };
  }

  const trimmed = expression.trim();
  if (trimmed.length === 0) {
    return { isValid: false, error: 'Expression cannot be empty' };
  }

  // Allow the parameter variable and common mathematical functions
  const escapedParam = parameter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const allowedPattern = new RegExp(`^[${escapedParam}\\d\\+\\-\\*\\/\\^\\(\\)\\.\\s,sincotaglnbsqrtepie]*$`, 'i');
  
  if (!allowedPattern.test(trimmed)) {
    return { isValid: false, error: `Expression contains invalid characters. Use only ${parameter}, numbers, +, -, *, /, ^, (), sin, cos, tan, log, ln, sqrt, abs, e, pi` };
  }

  // Check for balanced parentheses
  let parenCount = 0;
  for (const char of trimmed) {
    if (char === '(') parenCount++;
    if (char === ')') parenCount--;
    if (parenCount < 0) {
      return { isValid: false, error: 'Unbalanced parentheses in expression' };
    }
  }
  if (parenCount !== 0) {
    return { isValid: false, error: 'Unbalanced parentheses in expression' };
  }

  return { isValid: true };
}

/**
 * Validate implicit function expression
 */
export function validateImplicitExpression(expression: string): ValidationResult {
  if (!expression || typeof expression !== 'string') {
    return { isValid: false, error: 'Implicit expression must be a non-empty string' };
  }

  const trimmed = expression.trim();
  if (trimmed.length === 0) {
    return { isValid: false, error: 'Implicit expression cannot be empty' };
  }

  // Must contain both x and y variables
  if (!trimmed.includes('x') || !trimmed.includes('y')) {
    return { isValid: false, error: 'Implicit expression must contain both x and y variables' };
  }

  // Allow x, y, numbers, and mathematical functions
  const allowedPattern = /^[xy\d\+\-\*\/\^\(\)\.\s,sincotaglnbsqrtepie=]*$/i;
  if (!allowedPattern.test(trimmed)) {
    return { isValid: false, error: 'Implicit expression contains invalid characters. Use only x, y, numbers, +, -, *, /, ^, (), sin, cos, tan, log, ln, sqrt, abs, e, pi, =' };
  }

  // Check for balanced parentheses
  let parenCount = 0;
  for (const char of trimmed) {
    if (char === '(') parenCount++;
    if (char === ')') parenCount--;
    if (parenCount < 0) {
      return { isValid: false, error: 'Unbalanced parentheses in implicit expression' };
    }
  }
  if (parenCount !== 0) {
    return { isValid: false, error: 'Unbalanced parentheses in implicit expression' };
  }

  return { isValid: true };
}

/**
 * Validate domain range parameters
 */
export function validateDomainRange(min: number, max: number, paramName: string = 'parameter'): ValidationResult {
  if (typeof min !== 'number' || typeof max !== 'number') {
    return { isValid: false, error: `${paramName} range bounds must be numbers` };
  }

  if (!isFinite(min) || !isFinite(max)) {
    return { isValid: false, error: `${paramName} range bounds must be finite numbers` };
  }

  if (min >= max) {
    return { isValid: false, error: `${paramName} minimum must be less than maximum` };
  }

  // Reasonable range limits
  const maxRange = 1000000;
  if (Math.abs(min) > maxRange || Math.abs(max) > maxRange) {
    return { isValid: false, error: `${paramName} range must be within [-${maxRange}, ${maxRange}]` };
  }

  const rangeDiff = max - min;
  if (rangeDiff < 0.001) {
    return { isValid: false, error: `${paramName} range must be at least 0.001 units wide` };
  }

  if (rangeDiff > maxRange * 2) {
    return { isValid: false, error: `${paramName} range cannot exceed ${maxRange * 2} units wide` };
  }

  return { isValid: true };
}

/**
 * Validate function styling parameters
 */
export function validateFunctionStyling(color?: string, thickness?: number, style?: string): ValidationResult {
  if (color !== undefined) {
    if (typeof color !== 'string') {
      return { isValid: false, error: 'Color must be a string' };
    }
    
    // Basic color validation (hex, named colors, rgb)
    const colorPattern = /^(#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}|rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)|[a-zA-Z]+)$/;
    if (!colorPattern.test(color.trim())) {
      return { isValid: false, error: 'Color must be a valid hex color (#RRGGBB), RGB value (rgb(r,g,b)), or color name' };
    }
  }

  if (thickness !== undefined) {
    if (typeof thickness !== 'number') {
      return { isValid: false, error: 'Line thickness must be a number' };
    }
    
    if (!isFinite(thickness)) {
      return { isValid: false, error: 'Line thickness must be a finite number' };
    }
    
    if (thickness < 1 || thickness > 10) {
      return { isValid: false, error: 'Line thickness must be between 1 and 10' };
    }
  }

  if (style !== undefined) {
    if (typeof style !== 'string') {
      return { isValid: false, error: 'Line style must be a string' };
    }
    
    const validStyles = ['solid', 'dashed', 'dotted'];
    if (!validStyles.includes(style.toLowerCase())) {
      return { isValid: false, error: `Line style must be one of: ${validStyles.join(', ')}` };
    }
  }

  return { isValid: true };
}

/**
 * Validate algebraic expression for CAS operations
 */
export function validateAlgebraicExpression(expression: string): ValidationResult {
  if (!expression || typeof expression !== 'string') {
    return { isValid: false, error: 'Expression must be a non-empty string' };
  }

  const trimmed = expression.trim();
  if (trimmed.length === 0) {
    return { isValid: false, error: 'Expression cannot be empty' };
  }

  // Allow common mathematical symbols, variables, and functions
  const allowedPattern = /^[a-zA-Z\d\+\-\*\/\^\(\)\.\s,=]*$/;
  if (!allowedPattern.test(trimmed)) {
          return { 
        isValid: false, 
        error: 'Expression contains invalid characters. Use only variables, numbers, +, -, *, /, ^, =, ()' 
      };
  }

  // Check for balanced parentheses
  let parenCount = 0;
  for (const char of trimmed) {
    if (char === '(') parenCount++;
    if (char === ')') parenCount--;
    if (parenCount < 0) {
      return { isValid: false, error: 'Unbalanced parentheses in expression' };
    }
  }
  if (parenCount !== 0) {
    return { isValid: false, error: 'Unbalanced parentheses in expression' };
  }

  return { isValid: true };
}

/**
 * Validate equation format for solving
 */
export function validateEquation(equation: string): ValidationResult {
  if (!equation || typeof equation !== 'string') {
    return { isValid: false, error: 'Equation must be a non-empty string' };
  }

  const trimmed = equation.trim();
  if (trimmed.length === 0) {
    return { isValid: false, error: 'Equation cannot be empty' };
  }

  // Check if equation contains exactly one equals sign
  const equalsSigns = (trimmed.match(/=/g) || []).length;
  if (equalsSigns === 0) {
    return { isValid: false, error: 'Equation must contain an equals sign (=)' };
  }
  if (equalsSigns > 1) {
    return { isValid: false, error: 'Equation cannot contain multiple equals signs' };
  }

  // Validate both sides of the equation
  const parts = trimmed.split('=');
  const leftSide = parts[0]?.trim() || '';
  const rightSide = parts[1]?.trim() || '';
  
  const leftValidation = validateAlgebraicExpression(leftSide);
  if (!leftValidation.isValid) {
    return { isValid: false, error: `Left side of equation: ${leftValidation.error}` };
  }

  const rightValidation = validateAlgebraicExpression(rightSide);
  if (!rightValidation.isValid) {
    return { isValid: false, error: `Right side of equation: ${rightValidation.error}` };
  }

  return { isValid: true };
}

/**
 * Validate variable name for CAS operations
 */
export function validateVariableName(variable: string): ValidationResult {
  if (!variable || typeof variable !== 'string') {
    return { isValid: false, error: 'Variable name must be a non-empty string' };
  }

  const trimmed = variable.trim();
  if (trimmed.length === 0) {
    return { isValid: false, error: 'Variable name cannot be empty' };
  }

  // Variable must be a single letter or letter followed by digits/underscores
  const variablePattern = /^[a-zA-Z][a-zA-Z0-9_]*$/;
  if (!variablePattern.test(trimmed)) {
    return { 
      isValid: false, 
      error: 'Variable name must start with a letter and contain only letters, numbers, and underscores' 
    };
  }

  // Check for reserved function names
  const reservedNames = ['sin', 'cos', 'tan', 'log', 'ln', 'abs', 'sqrt', 'exp', 'pi', 'e'];
  if (reservedNames.includes(trimmed.toLowerCase())) {
    return { isValid: false, error: `"${trimmed}" is a reserved function name and cannot be used as a variable` };
  }

  return { isValid: true };
}

/**
 * Validate system of equations
 */
export function validateSystemOfEquations(equations: string[]): ValidationResult {
  if (!Array.isArray(equations)) {
    return { isValid: false, error: 'Equations must be provided as an array' };
  }

  if (equations.length === 0) {
    return { isValid: false, error: 'At least one equation must be provided' };
  }

  if (equations.length > 10) {
    return { isValid: false, error: 'Cannot solve more than 10 equations simultaneously' };
  }

  // Validate each equation
  for (let i = 0; i < equations.length; i++) {
    const equation = equations[i];
    if (equation === undefined || equation === null) {
      return { isValid: false, error: `Equation ${i + 1} is undefined or null` };
    }
    const validation = validateEquation(equation);
    if (!validation.isValid) {
      return { isValid: false, error: `Equation ${i + 1}: ${validation.error}` };
    }
  }

  return { isValid: true };
}

/**
 * Validate variables list for system solving
 */
export function validateVariablesList(variables: string[]): ValidationResult {
  if (!Array.isArray(variables)) {
    return { isValid: false, error: 'Variables must be provided as an array' };
  }

  if (variables.length === 0) {
    return { isValid: false, error: 'At least one variable must be specified' };
  }

  if (variables.length > 10) {
    return { isValid: false, error: 'Cannot solve for more than 10 variables simultaneously' };
  }

  // Validate each variable name
  for (let i = 0; i < variables.length; i++) {
    const variable = variables[i];
    if (variable === undefined || variable === null) {
      return { isValid: false, error: `Variable ${i + 1} is undefined or null` };
    }
    const validation = validateVariableName(variable);
    if (!validation.isValid) {
      return { isValid: false, error: `Variable ${i + 1}: ${validation.error}` };
    }
  }

  // Check for duplicate variables
  const uniqueVars = new Set(variables);
  if (uniqueVars.size !== variables.length) {
    return { isValid: false, error: 'Variables list cannot contain duplicates' };
  }

  return { isValid: true };
}

/**
 * Validates slider parameters for creation
 */
export function validateSliderParameters(
  name: string, 
  min: number, 
  max: number, 
  increment?: number,
  defaultValue?: number
): ValidationResult {
  // Validate name
  const nameValidation = validateObjectName(name);
  if (!nameValidation.isValid) {
    return nameValidation;
  }
  
  // Validate range
  if (min >= max) {
    return { isValid: false, error: 'Minimum value must be less than maximum value' };
  }
  
  // Validate increment
  if (increment !== undefined && increment <= 0) {
    return { isValid: false, error: 'Increment must be positive' };
  }
  
  // Validate default value
  if (defaultValue !== undefined && (defaultValue < min || defaultValue > max)) {
    return { isValid: false, error: 'Default value must be within the specified range' };
  }
  
  return { isValid: true };
}

/**
 * Validates animation speed parameter
 */
export function validateAnimationSpeed(speed: number): ValidationResult {
  if (speed <= 0) {
    return { isValid: false, error: 'Animation speed must be positive' };
  }
  
  if (speed > 10) {
    return { isValid: false, error: 'Animation speed should not exceed 10 for reasonable performance' };
  }
  
  return { isValid: true };
}

/**
 * Validates animation direction parameter
 */
export function validateAnimationDirection(direction?: string): ValidationResult {
  if (direction && !['forward', 'backward', 'oscillating'].includes(direction)) {
    return { isValid: false, error: 'Animation direction must be "forward", "backward", or "oscillating"' };
  }
  
  return { isValid: true };
}

/**
 * Validates parameters for animation export
 */
export function validateAnimationExportParameters(
  frameCount: number,
  frameDelay: number,
  totalDuration?: number
): ValidationResult {
  if (frameCount <= 0 || !Number.isInteger(frameCount)) {
    return { isValid: false, error: 'Frame count must be a positive integer' };
  }
  
  if (frameCount > 300) {
    return { isValid: false, error: 'Frame count should not exceed 300 for reasonable file size' };
  }
  
  if (frameDelay <= 0) {
    return { isValid: false, error: 'Frame delay must be positive' };
  }
  
  if (totalDuration !== undefined && totalDuration <= 0) {
    return { isValid: false, error: 'Total duration must be positive' };
  }
  
  return { isValid: true };
} 