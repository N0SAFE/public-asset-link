import fs from 'fs';
import path from 'path';
import { BaseConfig, JsonConfig, TsConfig, Config, isTsConfig } from './types';

// Default JSON configuration
export const DEFAULT_JSON_CONFIG: JsonConfig = {
  publicDir: './public',
  outputFile: './src/generated/assetPaths.ts',
  excludePatterns: ['**/.*', '**/node_modules/**'],
  namingStrategy: 'camelCase',
  includeExtensionsInNames: false,
  variablePrefix: '',
  groupByDirectory: true
};

/**
 * Default TypeScript configuration with callbacks
 */
export const DEFAULT_TS_CONFIG: TsConfig = {
  publicDir: './public',
  outputFile: './src/generated/assetPaths.ts',
  excludePatterns: ['**/.*', '**/node_modules/**'],
  groupByDirectory: true,
  
  // Custom function to convert file paths to variable names
  pathToVariableName: (filePath, relativePath) => {
    // Default implementation similar to the JSON config camelCase
    const fileName = path.basename(relativePath);
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
    
    // Convert to camelCase
    return nameWithoutExt
      .replace(/[^a-zA-Z0-9_]/g, '_')
      .split('_')
      .map((part, index) => index === 0 
        ? part.toLowerCase() 
        : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join('');
  },
  
  // Transform path value (default implementation)
  transformPathValue: (filePath, relativePath) => {
    return '/' + relativePath;
  }
};

/**
 * Loads configuration from a file (either JSON or TypeScript)
 */
export function loadConfig(configPath: string): Config {
  const configFile = path.resolve(process.cwd(), configPath);
  
  // Check if the file exists
  if (!fs.existsSync(configFile)) {
    console.warn(`Configuration file not found at ${configFile}, using default configuration.`);
    return DEFAULT_JSON_CONFIG;
  }
  
  // Check file extension - TypeScript or JSON?
  if (configFile.endsWith('.ts') || configFile.endsWith('.js')) {
    try {
      // Delete require cache to get fresh config if it changed
      delete require.cache[configFile];
      
      // Import TypeScript/JavaScript config
      const importedConfig = require(configFile);
      const config = importedConfig.default || importedConfig;
      
      if (isTsConfig(config)) {
        // It's a TypeScript configuration with callbacks
        return {
          ...DEFAULT_TS_CONFIG,
          ...config
        };
      } else {
        // It's a JSON-like configuration in TypeScript format
        return {
          ...DEFAULT_JSON_CONFIG,
          ...config
        };
      }
    } catch (error) {
      console.error(`Error loading TypeScript configuration file: ${error}`);
      console.warn('Using default configuration.');
      return DEFAULT_JSON_CONFIG;
    }
  } else {
    // Assume it's a JSON file
    try {
      const configContent = fs.readFileSync(configFile, 'utf8');
      const parsedConfig = JSON.parse(configContent);
      
      // Merge with default JSON config
      return {
        ...DEFAULT_JSON_CONFIG,
        ...parsedConfig
      };
    } catch (error) {
      console.error(`Error loading JSON configuration file: ${error}`);
      console.warn('Using default configuration.');
      return DEFAULT_JSON_CONFIG;
    }
  }
}