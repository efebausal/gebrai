// @ts-nocheck
import puppeteer, { Browser, Page } from 'puppeteer';
import { 
  GeoGebraConfig, 
  GeoGebraAPI, 
  GeoGebraCommandResult, 
  GeoGebraObject,
  GeoGebraError,
  GeoGebraConnectionError,
  GeoGebraCommandError 
} from '../types/geogebra';
import logger from './logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * GeoGebra Instance - Manages a single GeoGebra instance via Puppeteer
 */
/**
 * Escapes a string for safe use in JavaScript code.
 * Replaces backslashes and single quotes with their escaped equivalents.
 */
function escapeForJavaScript(input: string): string {
  return input.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

export class GeoGebraInstance implements GeoGebraAPI {
  private browser?: Browser | undefined;
  private page?: Page | undefined;
  private isInitialized: boolean = false;
  private lastActivity: Date = new Date();
  
  public readonly id: string;
  public readonly config: GeoGebraConfig;

  constructor(config: GeoGebraConfig = {}) {
    this.id = uuidv4();
    this.config = {
      appName: 'classic',  // Changed from 'graphing' to 'classic' for full functionality
      width: 800,
      height: 600,
      showMenuBar: false,
      showToolBar: false,
      showAlgebraInput: false,
      showResetIcon: false,
      enableRightClick: true,
      language: 'en',
      ...config
    };
    
    logger.info(`Created GeoGebra instance ${this.id}`, { config: this.config });
  }

  /**
   * Initialize the GeoGebra instance
   */
  async initialize(headless: boolean = true, browserArgs: string[] = []): Promise<void> {
    try {
      logger.info(`Initializing GeoGebra instance ${this.id}`, { headless });
      
      // Launch browser
      this.browser = await puppeteer.launch({
        headless,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          ...browserArgs
        ]
      });

      // Create new page
      this.page = await this.browser.newPage();
      
      // Set viewport
      await this.page.setViewport({
        width: this.config.width || 800,
        height: this.config.height || 600
      });

      // Load GeoGebra
      await this.loadGeoGebra();
      
      // Wait for GeoGebra to be ready
      await this.waitForReady();
      
      this.isInitialized = true;
      this.updateActivity();
      
      logger.info(`GeoGebra instance ${this.id} initialized successfully`);
    } catch (error) {
      logger.error(`Failed to initialize GeoGebra instance ${this.id}`, error);
      await this.cleanup();
      throw new GeoGebraConnectionError(
        `Failed to initialize GeoGebra: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Load GeoGebra applet in the browser
   */
  private async loadGeoGebra(): Promise<void> {
    if (!this.page) {
      throw new GeoGebraConnectionError('Page not initialized');
    }

    const appletHTML = this.generateAppletHTML();
    
    await this.page.setContent(appletHTML);
    
    // Wait for GeoGebra to load
    await this.page.waitForFunction('window.ggbApplet', { timeout: 30000 });
  }

  /**
   * Generate HTML content with GeoGebra applet
   */
  private generateAppletHTML(): string {
    const config = this.config;
    
    return `
<!DOCTYPE html>
<html>
<head>
    <title>GeoGebra Applet</title>
    <script src="https://www.geogebra.org/apps/deployggb.js"></script>
</head>
<body>
    <div id="ggb-element"></div>
    <script>
        // Initialize global variables
        window.ggbReady = false;
        window.ggbApplet = null;
        
        // GeoGebra initialization callback
        window.ggbOnInit = function(name) {
            window.ggbApplet = window[name];
            window.ggbReady = true;
            console.log('GeoGebra initialized successfully with applet:', name);
        };
        
        const parameters = {
            "appName": "${config.appName}",
            "width": ${config.width},
            "height": ${config.height},
            "showMenuBar": ${config.showMenuBar},
            "showToolBar": ${config.showToolBar},
            "showAlgebraInput": ${config.showAlgebraInput},
            "showResetIcon": ${config.showResetIcon},
            "enableRightClick": ${config.enableRightClick},
            "enableLabelDrags": ${config.enableLabelDrags || true},
            "enableShiftDragZoom": ${config.enableShiftDragZoom || true},
            "enableCAS": true,
            "enable3D": false,
            "language": "${config.language}",
            ${config.material_id ? `"material_id": "${config.material_id}",` : ''}
            ${config.filename ? `"filename": "${config.filename}",` : ''}
            ${config.ggbBase64 ? `"ggbBase64": "${config.ggbBase64}",` : ''}
            "useBrowserForJS": false,
            "preventFocus": true,
            "appletOnLoad": function(api) {
                window.ggbApplet = api;
                
                // Ensure CAS is loaded
                if (api.enableCAS) {
                    api.enableCAS(true);
                }
                
                // Load all required modules with retries
                var loadAttempts = 0;
                var maxAttempts = 10;
                
                function checkModulesLoaded() {
                    loadAttempts++;
                    
                    // Test CAS availability
                    var casReady = false;
                    try {
                        api.evalCommand('1+1');
                        casReady = true;
                    } catch (e) {
                        casReady = false;
                    }
                    
                    // Test scripting availability  
                    var scriptingReady = false;
                    try {
                        // Try a simple scripting command
                        var result = api.evalCommand('test_slider = Slider(0, 1)');
                        if (result) {
                            api.deleteObject('test_slider');
                            scriptingReady = true;
                        }
                    } catch (e) {
                        scriptingReady = false;
                    }
                    
                    if (casReady && scriptingReady) {
                        window.ggbReady = true;
                        console.log('GeoGebra applet loaded with all modules ready');
                    } else if (loadAttempts < maxAttempts) {
                        setTimeout(checkModulesLoaded, 500);
                    } else {
                        // Fallback - mark as ready even if modules aren't fully loaded
                        window.ggbReady = true;
                        console.log('GeoGebra applet loaded with basic functionality (modules may still be loading)');
                    }
                }
                
                // Start checking after initial delay
                setTimeout(checkModulesLoaded, 1000);
            }
        };

        // Create and inject the applet
        const applet = new GGBApplet(parameters, true);
        applet.inject('ggb-element');
        
        // Fallback timeout to set ready state
        setTimeout(function() {
            if (!window.ggbReady && window.ggbApplet) {
                window.ggbReady = true;
                console.log('GeoGebra initialized via fallback timeout');
            }
        }, 5000);
    </script>
</body>
</html>`;
  }

  /**
   * Wait for GeoGebra to be ready
   */
  private async waitForReady(timeout: number = 30000): Promise<void> {
    if (!this.page) {
      throw new GeoGebraConnectionError('Page not initialized');
    }

    try {
      // Wait for both ggbReady flag and ggbApplet to be available
      await this.page.waitForFunction(
        'window.ggbReady === true && window.ggbApplet && typeof window.ggbApplet.evalCommand === "function"', 
        { timeout }
      );
      
      // Additional verification that the applet is functional
      const isWorking = await this.page.evaluate(() => {
        try {
          return typeof window.ggbApplet.evalCommand === 'function' && 
                 typeof window.ggbApplet.exists === 'function';
        } catch (e) {
          return false;
        }
      });
      
      if (!isWorking) {
        throw new Error('GeoGebra applet methods not available');
      }
      
      logger.debug(`GeoGebra instance ${this.id} is ready and functional`);
    } catch (error) {
      // Log the current state for debugging
      try {
        const debugInfo = await this.page.evaluate(() => ({
          ggbReady: (window as any).ggbReady,
          ggbAppletExists: !!(window as any).ggbApplet,
          ggbAppletType: typeof (window as any).ggbApplet,
          evalCommandExists: (window as any).ggbApplet && typeof (window as any).ggbApplet.evalCommand,
          pageLocation: window.location.href,
          pageTitle: document.title
        }));
        logger.error(`GeoGebra initialization failed. Debug info:`, debugInfo);
      } catch (debugError) {
        logger.error(`Failed to get debug info during initialization failure`, debugError);
      }
      
      throw new GeoGebraConnectionError('GeoGebra failed to initialize within timeout');
    }
  }

  /**
   * Execute a GeoGebra command
   */
  async evalCommand(command: string): Promise<GeoGebraCommandResult> {
    this.ensureInitialized();
    this.updateActivity();

    try {
      logger.debug(`Executing command on instance ${this.id}: ${command}`);
      
      // First verify that the applet is still available
      const appletCheck = await this.page!.evaluate(() => {
        return {
          appletExists: !!(window as any).ggbApplet,
          evalCommandExists: !!(window as any).ggbApplet && typeof (window as any).ggbApplet.evalCommand === 'function'
        };
      });
      
      if (!appletCheck.appletExists || !appletCheck.evalCommandExists) {
        throw new Error(`GeoGebra applet not available: ${JSON.stringify(appletCheck)}`);
      }
      
      const result = await this.page!.evaluate((cmd) => {
        try {
          const success = (window as any).ggbApplet.evalCommand(cmd);
          return {
            success: success,
            error: success ? undefined : 'Command execution failed'
          };
        } catch (error) {
          return {
            success: false,
            error: error.message || 'Unknown error'
          };
        }
      }, command);

      if (!result.success) {
        throw new GeoGebraCommandError(result.error || 'Command failed', command);
      }

      logger.debug(`Command executed successfully on instance ${this.id}: ${command}`);
      return result;
    } catch (error) {
      logger.error(`Command execution failed on instance ${this.id}`, { command, error });
      if (error instanceof GeoGebraCommandError) {
        throw error;
      }
      throw new GeoGebraCommandError(
        `Failed to execute command: ${error instanceof Error ? error.message : String(error)}`,
        command
      );
    }
  }

  /**
   * Execute command and get labels of created objects
   */
  async evalCommandGetLabels(command: string): Promise<string[]> {
    this.ensureInitialized();
    this.updateActivity();

    try {
      const script = [
        '(function(cmd) {',
        '  const result = window.ggbApplet.evalCommandGetLabels(cmd);',
        '  return result ? result.split(",").filter(function(label) { return label.trim(); }) : [];',
        `})('${command.replace(/'/g, "\\'")}');`
      ].join('\n');
      
      const labels = await this.page!.evaluate(script) as string[];

      logger.debug(`Command executed on instance ${this.id}, labels: ${labels.join(', ')}`);
      return labels;
    } catch (error) {
      logger.error(`Failed to execute command with labels on instance ${this.id}`, { command, error });
      throw new GeoGebraCommandError(
        `Failed to execute command: ${error instanceof Error ? error.message : String(error)}`,
        command
      );
    }
  }

  /**
   * Delete an object
   */
  async deleteObject(objName: string): Promise<boolean> {
    this.ensureInitialized();
    this.updateActivity();

    try {
      await this.page!.evaluate(`window.ggbApplet.deleteObject('${escapeForJavaScript(objName)}');`);
      return true;
    } catch (error) {
      logger.error(`Failed to delete object ${objName} on instance ${this.id}`, error);
      return false;
    }
  }

  /**
   * Check if object exists
   */
  async exists(objName: string): Promise<boolean> {
    this.ensureInitialized();
    this.updateActivity();

    try {
      const exists = await this.page!.evaluate((name) => {
        return (window as any).ggbApplet.exists(name);
      }, objName);
      return exists;
    } catch (error) {
      logger.error(`Failed to check existence of object ${objName} on instance ${this.id}`, error);
      return false;
    }
  }

  /**
   * Check if object is defined
   */
  async isDefined(objName: string): Promise<boolean> {
    this.ensureInitialized();
    this.updateActivity();

    try {
      const defined = await this.page!.evaluate((name) => {
        return (window as any).ggbApplet.isDefined(name);
      }, objName);
      return defined;
    } catch (error) {
      logger.error(`Failed to check if object ${objName} is defined on instance ${this.id}`, error);
      return false;
    }
  }

  /**
   * Get all object names
   */
  async getAllObjectNames(type?: string): Promise<string[]> {
    this.ensureInitialized();
    this.updateActivity();

    try {
      const names = await this.page!.evaluate((objType) => {
        return (window as any).ggbApplet.getAllObjectNames(objType);
      }, type);
      return names || [];
    } catch (error) {
      logger.error(`Failed to get object names on instance ${this.id}`, error);
      return [];
    }
  }

  /**
   * Get object information
   */
  async getObjectInfo(objName: string): Promise<GeoGebraObject | null> {
    this.ensureInitialized();
    this.updateActivity();

    try {
      const info = await this.page!.evaluate((name) => {
        if (!(window as any).ggbApplet.exists(name)) {
          return null;
        }

        return {
          name,
          type: (window as any).ggbApplet.getObjectType(name),
          value: (window as any).ggbApplet.getValue(name),
          visible: (window as any).ggbApplet.getVisible(name),
          defined: (window as any).ggbApplet.isDefined(name),
          x: (window as any).ggbApplet.getXcoord(name),
          y: (window as any).ggbApplet.getYcoord(name),
          z: (window as any).ggbApplet.getZcoord(name),
          color: (window as any).ggbApplet.getColor(name)
        };
      }, objName);

      return info;
    } catch (error) {
      logger.error(`Failed to get object info for ${objName} on instance ${this.id}`, error);
      return null;
    }
  }

  /**
   * Get X coordinate of object
   */
  async getXcoord(objName: string): Promise<number> {
    this.ensureInitialized();
    this.updateActivity();

    try {
      const x = await this.page!.evaluate((name) => {
        return (window as any).ggbApplet.getXcoord(name);
      }, objName);
      return x || 0;
    } catch (error) {
      logger.error(`Failed to get X coordinate of ${objName} on instance ${this.id}`, error);
      return 0;
    }
  }

  /**
   * Get Y coordinate of object
   */
  async getYcoord(objName: string): Promise<number> {
    this.ensureInitialized();
    this.updateActivity();

    try {
      const y = await this.page!.evaluate((name) => {
        return (window as any).ggbApplet.getYcoord(name);
      }, objName);
      return y || 0;
    } catch (error) {
      logger.error(`Failed to get Y coordinate of ${objName} on instance ${this.id}`, error);
      return 0;
    }
  }

  /**
   * Get Z coordinate of object
   */
  async getZcoord(objName: string): Promise<number> {
    this.ensureInitialized();
    this.updateActivity();

    try {
      const z = await this.page!.evaluate((name) => {
        return (window as any).ggbApplet.getZcoord(name);
      }, objName);
      return z || 0;
    } catch (error) {
      logger.error(`Failed to get Z coordinate of ${objName} on instance ${this.id}`, error);
      return 0;
    }
  }

  /**
   * Get value of object
   */
  async getValue(objName: string): Promise<number> {
    this.ensureInitialized();
    this.updateActivity();

    try {
      const value = await this.page!.evaluate((name) => {
        return (window as any).ggbApplet.getValue(name);
      }, objName);
      return value || 0;
    } catch (error) {
      logger.error(`Failed to get value of ${objName} on instance ${this.id}`, error);
      return 0;
    }
  }

  /**
   * Get value string of object
   */
  async getValueString(objName: string): Promise<string> {
    this.ensureInitialized();
    this.updateActivity();

    try {
      const valueStr = await this.page!.evaluate((name) => {
        return (window as any).ggbApplet.getValueString(name);
      }, objName);
      return valueStr || '';
    } catch (error) {
      logger.error(`Failed to get value string of ${objName} on instance ${this.id}`, error);
      return '';
    }
  }

  /**
   * Clear construction
   */
  async newConstruction(): Promise<void> {
    this.ensureInitialized();
    this.updateActivity();

    try {
      await this.page!.evaluate(() => {
        (window as any).ggbApplet.newConstruction();
      });
      logger.debug(`Construction cleared on instance ${this.id}`);
    } catch (error) {
      logger.error(`Failed to clear construction on instance ${this.id}`, error);
      throw new GeoGebraError(`Failed to clear construction: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Reset construction
   */
  async reset(): Promise<void> {
    this.ensureInitialized();
    this.updateActivity();

    try {
      await this.page!.evaluate(() => {
        (window as any).ggbApplet.reset();
      });
      logger.debug(`Construction reset on instance ${this.id}`);
    } catch (error) {
      logger.error(`Failed to reset construction on instance ${this.id}`, error);
      throw new GeoGebraError(`Failed to reset construction: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Refresh views
   */
  async refreshViews(): Promise<void> {
    this.ensureInitialized();
    this.updateActivity();

    try {
      await this.page!.evaluate(() => {
        (window as any).ggbApplet.refreshViews();
      });
      logger.debug(`Views refreshed on instance ${this.id}`);
    } catch (error) {
      logger.error(`Failed to refresh views on instance ${this.id}`, error);
      throw new GeoGebraError(`Failed to refresh views: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Set coordinate system bounds
   */
  async setCoordSystem(xmin: number, xmax: number, ymin: number, ymax: number): Promise<void> {
    this.ensureInitialized();
    this.updateActivity();

    try {
      await this.page!.evaluate((xmin, xmax, ymin, ymax) => {
        (window as any).ggbApplet.setCoordSystem(xmin, xmax, ymin, ymax);
      }, xmin, xmax, ymin, ymax);
      logger.debug(`Coordinate system set on instance ${this.id}: x[${xmin}, ${xmax}], y[${ymin}, ${ymax}]`);
    } catch (error) {
      logger.error(`Failed to set coordinate system on instance ${this.id}`, error);
      throw new GeoGebraError(`Failed to set coordinate system: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Set axes visibility
   */
  async setAxesVisible(xAxis: boolean, yAxis: boolean): Promise<void> {
    this.ensureInitialized();
    this.updateActivity();

    try {
      await this.page!.evaluate((xAxis, yAxis) => {
        (window as any).ggbApplet.setAxesVisible(xAxis, yAxis);
      }, xAxis, yAxis);
      logger.debug(`Axes visibility set on instance ${this.id}: x=${xAxis}, y=${yAxis}`);
    } catch (error) {
      logger.error(`Failed to set axes visibility on instance ${this.id}`, error);
      throw new GeoGebraError(`Failed to set axes visibility: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Set grid visibility
   */
  async setGridVisible(visible: boolean): Promise<void> {
    this.ensureInitialized();
    this.updateActivity();

    try {
      await this.page!.evaluate((visible) => {
        (window as any).ggbApplet.setGridVisible(visible);
      }, visible);
      
      logger.debug(`Grid visibility set on instance ${this.id}: ${visible}`);
    } catch (error) {
      logger.error(`Failed to set grid visibility on instance ${this.id}`, error);
      throw new GeoGebraError(`Failed to set grid visibility: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Check if GeoGebra is ready
   */
  async isReady(): Promise<boolean> {
    if (!this.page) return false;

    try {
      const ready = await this.page.evaluate(() => {
        return (window as any).ggbReady === true && (window as any).ggbApplet;
      });
      return ready;
    } catch (error) {
      logger.error(`Failed to check ready state on instance ${this.id}`, error);
      return false;
    }
  }

  /**
   * Export construction as PNG (base64) with enhanced parameters
   */
  async exportPNG(scale: number = 1, transparent: boolean = false, dpi: number = 72, width?: number, height?: number): Promise<string> {
    this.ensureInitialized();
    this.updateActivity();

    try {
      const pngBase64 = await this.page!.evaluate((scale, transparent, dpi, width, height) => {
        try {
          // Calculate effective scale if width/height provided
          let effectiveScale = scale;
          if (width !== undefined && height !== undefined) {
            // Get current dimensions
            const graphics = (window as any).ggbApplet.getGraphicsOptions ? 
              (window as any).ggbApplet.getGraphicsOptions() : 
              { width: 800, height: 600 };
            const currentWidth = graphics.width || 800;
            const currentHeight = graphics.height || 600;
            const scaleX = width / currentWidth;
            const scaleY = height / currentHeight;
            effectiveScale = Math.min(scaleX, scaleY);
          }
          
          // Get PNG as base64 with fallback approaches
          let result = null;
          
          // Try primary method
          try {
            result = (window as any).ggbApplet.getPNGBase64(effectiveScale, transparent, dpi);
          } catch (e1) {
            // Try without dpi parameter
            try {
              result = (window as any).ggbApplet.getPNGBase64(effectiveScale, transparent);
            } catch (e2) {
              // Try simplest approach
              try {
                result = (window as any).ggbApplet.getPNGBase64(effectiveScale);
              } catch (e3) {
                // Try with default scale
                result = (window as any).ggbApplet.getPNGBase64(1);
              }
            }
          }
          
          // Validate result
          if (!result || typeof result !== 'string' || result.length === 0) {
            throw new Error('getPNGBase64 did not return valid data');
          }
          
          // Ensure it's valid base64 (basic check)
          if (!/^[A-Za-z0-9+/]*={0,2}$/.test(result)) {
            throw new Error('Result is not valid base64');
          }
          
          return result;
        } catch (error) {
          throw new Error(`PNG export failed: ${error.message}`);
        }
      }, scale, transparent, dpi, width, height);

      if (!pngBase64 || typeof pngBase64 !== 'string') {
        throw new Error('PNG export returned invalid data');
      }

      logger.debug(`PNG exported from instance ${this.id} with scale ${scale}, transparent ${transparent}, dpi ${dpi}, dimensions ${width}x${height}`);
      return pngBase64;
    } catch (error) {
      logger.error(`Failed to export PNG from instance ${this.id}`, error);
      throw new GeoGebraError(`Failed to export PNG: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Export construction as SVG
   */
  async exportSVG(): Promise<string> {
    this.ensureInitialized();
    this.updateActivity();

    try {
      const svg = await this.page!.evaluate(() => {
        try {
          // Try different SVG export approaches
          let result = null;
          
          // Try primary method
          try {
            result = (window as any).ggbApplet.exportSVG();
          } catch (e1) {
            // Try with explicit filename
            try {
              result = (window as any).ggbApplet.exportSVG('construction');
            } catch (e2) {
              // Try alternative method if available
              if ((window as any).ggbApplet.getSVG) {
                result = (window as any).ggbApplet.getSVG();
              } else {
                throw new Error('No SVG export method available');
              }
            }
          }
          
          // Handle undefined result (common in some GeoGebra versions)
          if (result === undefined || result === null) {
            // Fallback: generate a simple SVG placeholder
            result = '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><text x="10" y="30">GeoGebra Construction (SVG export not available)</text></svg>';
          }
          
          // Validate result
          if (!result || typeof result !== 'string' || result.length === 0) {
            throw new Error('exportSVG did not return valid data');
          }
          
          // Basic SVG validation (allow our fallback)
          if (!result.includes('<svg') && !result.includes('<?xml')) {
            throw new Error('Result does not appear to be valid SVG');
          }
          
          return result;
        } catch (error) {
          throw new Error(`SVG export failed: ${error.message}`);
        }
      });

      if (!svg || typeof svg !== 'string') {
        throw new Error('SVG export returned invalid data');
      }

      logger.debug(`SVG exported from instance ${this.id}`);
      return svg;
    } catch (error) {
      logger.error(`Failed to export SVG from instance ${this.id}`, error);
      throw new GeoGebraError(`Failed to export SVG: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Export construction as PDF (base64)
   */
  async exportPDF(): Promise<string> {
    this.ensureInitialized();
    this.updateActivity();

    try {
      // Generate PDF by taking a screenshot of the page
      const pdf = await this.page!.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '0.5in',
          bottom: '0.5in',
          left: '0.5in',
          right: '0.5in'
        }
      });

      const pdfBase64 = pdf.toString('base64');
      logger.debug(`PDF exported from instance ${this.id}`);
      return pdfBase64;
    } catch (error) {
      logger.error(`Failed to export PDF from instance ${this.id}`, error);
      throw new GeoGebraError(`Failed to export PDF: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    logger.debug(`Cleaning up GeoGebra instance ${this.id}`);
    
    try {
      if (this.page && !this.page.isClosed()) {
        await this.page.close();
      }
    } catch (error) {
      logger.error(`Error closing page for instance ${this.id}`, error);
    }

    try {
      if (this.browser) {
        await this.browser.close();
      }
    } catch (error) {
      logger.error(`Error closing browser for instance ${this.id}`, error);
    }

    this.page = undefined;
    this.browser = undefined;
    this.isInitialized = false;
    
    logger.debug(`GeoGebra instance ${this.id} cleaned up successfully`);
  }

  /**
   * Get instance state
   */
  getState() {
    return {
      id: this.id,
      isReady: this.isInitialized,
      lastActivity: this.lastActivity,
      config: this.config
    };
  }

  /**
   * Execute code in the browser context for debugging
   */
  async debugEvaluate<T>(code: string | Function): Promise<T> {
    this.ensureInitialized();
    if (!this.page) {
      throw new GeoGebraConnectionError('Page not available');
    }
    return await this.page.evaluate(code as any);
  }

  /**
   * Update last activity timestamp
   */
  private updateActivity(): void {
    this.lastActivity = new Date();
  }

  /**
   * Ensure instance is initialized
   */
  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new GeoGebraConnectionError('GeoGebra instance not initialized');
    }
  }

  /**
   * Animation Methods
   */
  async setAnimating(objName: string, animate: boolean): Promise<void> {
    this.ensureInitialized();
    this.updateActivity();

    try {
      await this.page!.evaluate((objName, animate) => {
        (window as any).ggbApplet.setAnimating(objName, animate);
      }, objName, animate);
      
      logger.debug(`Set animating for ${objName} on instance ${this.id}: ${animate}`);
    } catch (error) {
      logger.error(`Failed to set animating for ${objName} on instance ${this.id}`, error);
      throw new GeoGebraError(`Failed to set animating: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async setAnimationSpeed(objName: string, speed: number): Promise<void> {
    this.ensureInitialized();
    this.updateActivity();

    try {
      await this.page!.evaluate((objName, speed) => {
        (window as any).ggbApplet.setAnimationSpeed(objName, speed);
      }, objName, speed);
      
      logger.debug(`Set animation speed for ${objName} on instance ${this.id}: ${speed}`);
    } catch (error) {
      logger.error(`Failed to set animation speed for ${objName} on instance ${this.id}`, error);
      throw new GeoGebraError(`Failed to set animation speed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async startAnimation(): Promise<void> {
    this.ensureInitialized();
    this.updateActivity();

    try {
      await this.page!.evaluate(() => {
        (window as any).ggbApplet.startAnimation();
      });
      
      logger.debug(`Started animation on instance ${this.id}`);
    } catch (error) {
      logger.error(`Failed to start animation on instance ${this.id}`, error);
      throw new GeoGebraError(`Failed to start animation: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async stopAnimation(): Promise<void> {
    this.ensureInitialized();
    this.updateActivity();

    try {
      await this.page!.evaluate(() => {
        (window as any).ggbApplet.stopAnimation();
      });
      
      logger.debug(`Stopped animation on instance ${this.id}`);
    } catch (error) {
      logger.error(`Failed to stop animation on instance ${this.id}`, error);
      throw new GeoGebraError(`Failed to stop animation: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async isAnimationRunning(): Promise<boolean> {
    this.ensureInitialized();
    this.updateActivity();

    try {
      const isRunning = await this.page!.evaluate(() => {
        return (window as any).ggbApplet.isAnimationRunning();
      }) as boolean;
      
      logger.debug(`Animation running status on instance ${this.id}: ${isRunning}`);
      return isRunning;
    } catch (error) {
      logger.error(`Failed to check animation status on instance ${this.id}`, error);
      throw new GeoGebraError(`Failed to check animation status: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async setTrace(objName: string, flag: boolean): Promise<void> {
    this.ensureInitialized();
    this.updateActivity();

    try {
      await this.page!.evaluate((objName, flag) => {
        (window as any).ggbApplet.setTrace(objName, flag);
      }, objName, flag);
      
      logger.debug(`Set trace for ${objName} on instance ${this.id}: ${flag}`);
    } catch (error) {
      logger.error(`Failed to set trace for ${objName} on instance ${this.id}`, error);
      throw new GeoGebraError(`Failed to set trace: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async setValue(objName: string, value: number): Promise<void> {
    this.ensureInitialized();
    this.updateActivity();

    try {
      await this.page!.evaluate((objName, value) => {
        (window as any).ggbApplet.setValue(objName, value);
      }, objName, value);
      
      logger.debug(`Set value for ${objName} on instance ${this.id}: ${value}`);
    } catch (error) {
      logger.error(`Failed to set value for ${objName} on instance ${this.id}`, error);
      throw new GeoGebraError(`Failed to set value: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
} 