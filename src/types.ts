/**
 * Types for public-asset-link configuration
 */

export interface BaseConfig {
  /**
   * Directory containing public assets to scan (relative to project root)
   */
  publicDir: string;
  
  /**
   * Output TypeScript file path where asset variables will be generated
   */
  outputFile: string;
  
  /**
   * Patterns to exclude from asset scanning (glob patterns)
   */
  excludePatterns: string[];
  
  /**
   * Whether to group assets by subdirectory
   */
  groupByDirectory: boolean;
}

/**
 * JSON-based configuration (simplified)
 */
export interface JsonConfig extends BaseConfig {
  /**
   * Variable naming strategy
   * 'camelCase' | 'PascalCase' | 'snake_case'
   */
  namingStrategy: 'camelCase' | 'PascalCase' | 'snake_case';
  
  /**
   * Whether to add file extensions to variable names
   */
  includeExtensionsInNames: boolean;
  
  /**
   * Optional prefix to add to all variable names
   */
  variablePrefix: string;
}

/**
 * TypeScript-based configuration with advanced callbacks
 */
export interface TsConfig extends BaseConfig {
  /**
   * Custom function for converting file paths to variable names
   * @param filePath Path to the asset file
   * @param relativePath Path relative to the public directory
   * @returns The variable name to use
   */
  pathToVariableName: (filePath: string, relativePath: string) => string;
  
  /**
   * Optional function to modify the path value assigned to the variable
   * @param filePath Original path to the asset file
   * @param relativePath Path relative to the public directory
   * @returns The path value to assign to the variable
   */
  transformPathValue?: (filePath: string, relativePath: string) => string;
  
  /**
   * Optional function to determine if a file should be included
   * @param filePath Original path to the asset file
   * @param relativePath Path relative to the public directory
   * @returns True if the file should be included, false otherwise
   */
  shouldIncludeFile?: (filePath: string, relativePath: string) => boolean;
}

/**
 * Union type for all configuration types
 */
export type Config = JsonConfig | TsConfig;

/**
 * Type guard to check if a config is a TypeScript config
 */
export function isTsConfig(config: Config): config is TsConfig {
  return config !== null 
    && typeof config === 'object'
    && 'pathToVariableName' in config 
    && typeof config.pathToVariableName === 'function';
}