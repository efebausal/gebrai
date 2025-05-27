import { ToolRegistry } from '../../src/tools';
import { GeoGebraInstance } from '../../src/utils/geogebra-instance';

// Mock GeoGebraInstance for performance testing
jest.mock('../../src/utils/geogebra-instance');

// Mock logger
jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  debug: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

describe('Performance Tests - Response Time Requirements', () => {
  let registry: ToolRegistry;
  let mockGeoGebraInstance: jest.Mocked<GeoGebraInstance>;

  // PRD requirement: <2 second response time
  const MAX_RESPONSE_TIME = 2000; // 2 seconds in milliseconds

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock GeoGebra instance with realistic delays
    mockGeoGebraInstance = {
      evalCommand: jest.fn(),
      getAllObjectNames: jest.fn(),
      getObjectInfo: jest.fn(),
      newConstruction: jest.fn(),
      exportPNG: jest.fn(),
      exportSVG: jest.fn(),
      exportPDF: jest.fn(),
      isReady: jest.fn(),
      cleanup: jest.fn(),
      getState: jest.fn(),
    } as any;

    // Mock the GeoGebraInstance constructor
    (GeoGebraInstance as jest.MockedClass<typeof GeoGebraInstance>).mockImplementation(() => mockGeoGebraInstance);
    
    registry = new ToolRegistry();
  });

  /**
   * Helper function to measure execution time
   */
  const measureExecutionTime = async <T>(operation: () => Promise<T>): Promise<{ result: T; executionTime: number }> => {
    const startTime = performance.now();
    const result = await operation();
    const endTime = performance.now();
    const executionTime = endTime - startTime;
    
    return { result, executionTime };
  };

  describe('Basic Tool Operations', () => {
    it('ping tool should respond within performance requirements', async () => {
      const { executionTime } = await measureExecutionTime(async () => {
        return await registry.executeTool('ping', {});
      });

      expect(executionTime).toBeLessThan(MAX_RESPONSE_TIME);
      expect(executionTime).toBeLessThan(100); // Ping should be very fast
    });

    it('geogebra_instance_status should respond within performance requirements', async () => {
      mockGeoGebraInstance.isReady.mockResolvedValue(true);
      mockGeoGebraInstance.getState.mockReturnValue({
        id: 'test-id',
        isReady: true,
        lastActivity: new Date(),
        config: { appName: 'graphing' }
      });

      const { executionTime } = await measureExecutionTime(async () => {
        return await registry.executeTool('geogebra_instance_status', {});
      });

      expect(executionTime).toBeLessThan(MAX_RESPONSE_TIME);
    });
  });

  describe('Command Execution Performance', () => {
    it('simple command execution should meet performance requirements', async () => {
             const mockResult = {
         success: true,
         result: 'ok'
       };
      
      // Simulate realistic GeoGebra response time (typically 50-200ms)
      mockGeoGebraInstance.evalCommand.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockResult), 100))
      );

      const { executionTime } = await measureExecutionTime(async () => {
        return await registry.executeTool('geogebra_eval_command', {
          command: 'A = (1, 2)'
        });
      });

      expect(executionTime).toBeLessThan(MAX_RESPONSE_TIME);
    });

    it('complex command execution should meet performance requirements', async () => {
             const mockResult = {
         success: true,
         result: 'ok'
       };
      
      // Simulate more complex operation (typically 200-500ms)
      mockGeoGebraInstance.evalCommand.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockResult), 300))
      );

      const { executionTime } = await measureExecutionTime(async () => {
        return await registry.executeTool('geogebra_eval_command', {
          command: 'Polygon((0,0), (1,0), (1,1), (0,1))'
        });
      });

      expect(executionTime).toBeLessThan(MAX_RESPONSE_TIME);
    });
  });

  describe('Object Management Performance', () => {
    it('getting all objects should meet performance requirements', async () => {
      const mockObjects = Array.from({ length: 50 }, (_, i) => `Object${i}`);
      
      // Simulate realistic object retrieval time
      mockGeoGebraInstance.getAllObjectNames.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockObjects), 150))
      );
      
      mockGeoGebraInstance.getObjectInfo.mockImplementation((name: string) => 
        new Promise(resolve => setTimeout(() => resolve({
          name,
          type: 'point',
          visible: true,
          defined: true
        }), 10))
      );

      const { executionTime } = await measureExecutionTime(async () => {
        return await registry.executeTool('geogebra_get_objects', {});
      });

      expect(executionTime).toBeLessThan(MAX_RESPONSE_TIME);
    });

    it('clearing construction should meet performance requirements', async () => {
      // Simulate realistic clear operation time
      mockGeoGebraInstance.newConstruction.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(), 200))
      );

      const { executionTime } = await measureExecutionTime(async () => {
        return await registry.executeTool('geogebra_clear_construction', {});
      });

      expect(executionTime).toBeLessThan(MAX_RESPONSE_TIME);
    });
  });

  describe('Export Operations Performance', () => {
    it('PNG export should meet performance requirements', async () => {
      const mockBase64 = 'base64-encoded-image-data';
      
      // Simulate realistic PNG export time (typically 500-1500ms)
      mockGeoGebraInstance.exportPNG.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockBase64), 800))
      );

      const { executionTime } = await measureExecutionTime(async () => {
        return await registry.executeTool('geogebra_export_png', { scale: 1 });
      });

      expect(executionTime).toBeLessThan(MAX_RESPONSE_TIME);
    });

    it('SVG export should meet performance requirements', async () => {
      const mockSVG = '<svg>...</svg>';
      
      // Simulate realistic SVG export time (typically 300-800ms)
      mockGeoGebraInstance.exportSVG.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockSVG), 500))
      );

      const { executionTime } = await measureExecutionTime(async () => {
        return await registry.executeTool('geogebra_export_svg', {});
      });

      expect(executionTime).toBeLessThan(MAX_RESPONSE_TIME);
    });

    it('PDF export should meet performance requirements', async () => {
      const mockPDF = 'base64-encoded-pdf-data';
      
      // Simulate realistic PDF export time (typically 800-1800ms)
      mockGeoGebraInstance.exportPDF.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockPDF), 1200))
      );

      const { executionTime } = await measureExecutionTime(async () => {
        return await registry.executeTool('geogebra_export_pdf', {});
      });

      expect(executionTime).toBeLessThan(MAX_RESPONSE_TIME);
    });
  });

  describe('Concurrent Operations Performance', () => {
    it('multiple simultaneous operations should not exceed performance requirements', async () => {
      // Setup mock responses
             mockGeoGebraInstance.evalCommand.mockImplementation(() => 
         new Promise(resolve => setTimeout(() => resolve({
           success: true,
           result: 'ok'
         }), 200))
       );

      const operations = Array.from({ length: 5 }, (_, i) => 
        measureExecutionTime(async () => {
          return await registry.executeTool('geogebra_eval_command', {
            command: `Point${i} = (${i}, ${i})`
          });
        })
      );

      const results = await Promise.all(operations);

      // Each individual operation should meet requirements
      results.forEach(({ executionTime }) => {
        expect(executionTime).toBeLessThan(MAX_RESPONSE_TIME);
      });

      // Average response time should be reasonable
      const averageTime = results.reduce((sum, { executionTime }) => sum + executionTime, 0) / results.length;
      expect(averageTime).toBeLessThan(MAX_RESPONSE_TIME);
    });
  });

  describe('Performance Benchmarks', () => {
    it('should establish baseline performance metrics', async () => {
      const benchmarks: Record<string, number> = {};

      // Benchmark ping
      const pingResult = await measureExecutionTime(async () => {
        return await registry.executeTool('ping', {});
      });
      benchmarks['ping'] = pingResult.executionTime;

             // Benchmark simple command
       mockGeoGebraInstance.evalCommand.mockResolvedValue({
         success: true,
         result: 'ok'
       });

      const commandResult = await measureExecutionTime(async () => {
        return await registry.executeTool('geogebra_eval_command', {
          command: 'A = (1, 2)'
        });
      });
      benchmarks['simpleCommand'] = commandResult.executionTime;

      // Benchmark status check
      mockGeoGebraInstance.isReady.mockResolvedValue(true);
      mockGeoGebraInstance.getState.mockReturnValue({
        id: 'test-id',
        isReady: true,
        lastActivity: new Date(),
        config: { appName: 'graphing' }
      });

      const statusResult = await measureExecutionTime(async () => {
        return await registry.executeTool('geogebra_instance_status', {});
      });
      benchmarks['status'] = statusResult.executionTime;

      // Log benchmarks for monitoring
      console.log('Performance Benchmarks:', benchmarks);

      // Verify all benchmarks meet requirements
      Object.entries(benchmarks).forEach(([, time]) => {
        expect(time).toBeLessThan(MAX_RESPONSE_TIME);
      });

      // Store benchmarks for performance regression testing
      expect(benchmarks).toBeDefined();
    });
  });
}); 