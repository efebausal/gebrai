/**
 * GeoGebra Integration Types
 * Type definitions for GeoGebra Apps API integration
 */

// GeoGebra Instance Configuration
export interface GeoGebraConfig {
  appName?: 'graphing' | 'geometry' | '3d' | 'classic' | 'suite' | 'evaluator' | 'scientific' | 'notes';
  width?: number;
  height?: number;
  showMenuBar?: boolean;
  showToolBar?: boolean;
  showAlgebraInput?: boolean;
  showResetIcon?: boolean;
  enableRightClick?: boolean;
  enableLabelDrags?: boolean;
  enableShiftDragZoom?: boolean;
  language?: string;
  material_id?: string;
  filename?: string;
  ggbBase64?: string;
}

// GeoGebra Command Result
export interface GeoGebraCommandResult {
  success: boolean;
  result?: string | number | boolean;
  labels?: string[];
  error?: string;
  objects?: string[];
}

// GeoGebra Object Information
export interface GeoGebraObject {
  name: string;
  type: string;
  value?: string | number;
  visible: boolean;
  defined: boolean;
  x?: number;
  y?: number;
  z?: number;
  color?: string;
}

// GeoGebra Instance State
export interface GeoGebraInstanceState {
  id: string;
  isReady: boolean;
  objectCount: number;
  lastActivity: Date;
  config: GeoGebraConfig;
}

// GeoGebra Pool Configuration
export interface GeoGebraPoolConfig {
  maxInstances: number;
  instanceTimeout: number; // milliseconds
  maxIdleTime: number; // milliseconds
  headless: boolean;
  browserArgs?: string[];
}

// GeoGebra API Methods Interface
export interface GeoGebraAPI {
  // Core command execution
  evalCommand(command: string): Promise<GeoGebraCommandResult>;
  evalCommandGetLabels(command: string): Promise<string[]>;
  
  // Object management
  deleteObject(objName: string): Promise<boolean>;
  exists(objName: string): Promise<boolean>;
  isDefined(objName: string): Promise<boolean>;
  getAllObjectNames(type?: string): Promise<string[]>;
  getObjectInfo(objName: string): Promise<GeoGebraObject | null>;
  
  // Coordinate and value operations
  getXcoord(objName: string): Promise<number>;
  getYcoord(objName: string): Promise<number>;
  getZcoord(objName: string): Promise<number>;
  getValue(objName: string): Promise<number>;
  getValueString(objName: string): Promise<string>;
  
  // Construction management
  newConstruction(): Promise<void>;
  reset(): Promise<void>;
  refreshViews(): Promise<void>;
  
  // View configuration
  setCoordSystem(xmin: number, xmax: number, ymin: number, ymax: number): Promise<void>;
  setAxesVisible(xAxis: boolean, yAxis: boolean): Promise<void>;
  setGridVisible(visible: boolean): Promise<void>;
  
  // Animation methods
  setAnimating(objName: string, animate: boolean): Promise<void>;
  setAnimationSpeed(objName: string, speed: number): Promise<void>;
  startAnimation(): Promise<void>;
  stopAnimation(): Promise<void>;
  isAnimationRunning(): Promise<boolean>;
  setTrace(objName: string, flag: boolean): Promise<void>;
  setValue(objName: string, value: number): Promise<void>;
  
  // Instance management
  isReady(): Promise<boolean>;
  cleanup(): Promise<void>;
  
  // Export capabilities
  exportPNG(scale?: number, transparent?: boolean, dpi?: number, width?: number, height?: number): Promise<string>;
  exportSVG(): Promise<string>;
  exportPDF(): Promise<string>;
}

// Error types
export class GeoGebraError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'GeoGebraError';
  }
}

export class GeoGebraConnectionError extends GeoGebraError {
  constructor(message: string) {
    super(message, 'CONNECTION_ERROR');
    this.name = 'GeoGebraConnectionError';
  }
}

export class GeoGebraCommandError extends GeoGebraError {
  constructor(message: string, public command?: string) {
    super(message, 'COMMAND_ERROR');
    this.name = 'GeoGebraCommandError';
  }
} 