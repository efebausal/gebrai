# Claude Sonnet 4 Compatibility Fix

## Problem
The MCP tool argument schemas were incompatible with Claude Sonnet 4 due to the use of the `oneOf` JSON Schema keyword, which Claude Sonnet 4 doesn't support well.

## Root Cause
Two tools were using `oneOf` in their input schemas:
1. `geogebra_create_line` - for supporting both two-point and equation methods
2. `geogebra_create_circle` - for supporting both center-radius and three-point methods

The `oneOf` keyword was causing Claude Sonnet 4 to have difficulty understanding the tool schemas.

## Solution
### 1. Removed `oneOf` from Tool Schemas
- **Before**: Used `oneOf` to enforce mutually exclusive parameter sets
- **After**: Made all parameters optional and rely on runtime validation

### 2. Updated Tool Descriptions
Enhanced tool descriptions to clearly explain the alternative parameter combinations:
- `geogebra_create_line`: "Provide either point1 and point2 parameters for two-point method, OR equation parameter for equation method."
- `geogebra_create_circle`: "Provide either center and radius parameters for center-radius method, OR point1, point2, and point3 parameters for three-point method."

### 3. Updated Parameter Descriptions
Made parameter descriptions explicit about when they're optional:
- Added "Optional if using [other method]" to parameter descriptions
- Maintained clear guidance on which parameters work together

### 4. Updated Handler Code
Modified the tool handlers to properly handle optional parameters:
- Changed parameter types from `string` to `string | undefined`
- Enhanced runtime validation to provide clear error messages

### 5. Updated Type Definitions
Removed `oneOf` from the `McpTool` interface in `src/types/mcp.ts`

## Files Changed
1. `src/tools/geogebra-tools.ts` - Updated line and circle tool schemas and handlers
2. `src/types/mcp.ts` - Removed oneOf from McpTool interface
3. `tests/unit/new-tools.test.ts` - Updated tests to remove oneOf expectations

## Verification
Created and ran `test-schema-compatibility.ts` which confirmed:
- ✅ All 40 tools are now compatible with Claude Sonnet 4
- ✅ No tools use the problematic `oneOf` keyword
- ✅ All schemas follow the expected object structure

## Benefits
1. **Full Claude Sonnet 4 Compatibility**: All tools now work seamlessly with Claude Sonnet 4
2. **Maintained Functionality**: Both parameter methods still work as expected
3. **Better Error Messages**: Runtime validation provides clearer guidance
4. **Improved Documentation**: Tool descriptions are more explicit about usage patterns

## Testing
- All existing tests pass
- New compatibility test confirms Claude Sonnet 4 support
- Runtime validation ensures proper parameter combinations are still enforced 