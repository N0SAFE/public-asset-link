import path from 'path';
import { Config, isTsConfig } from './types';

interface AssetGroup {
  [key: string]: string | AssetGroup;
}

/**
 * Gets the relative path from a file path
 */
function getRelativePath(filePath: string, config: Config): string {
  const normalizedPath = filePath.replace(/\\/g, '/');
  const publicDirPattern = new RegExp(`^${config.publicDir.replace(/\\/g, '/').replace(/^\.\//, '')}/?`);
  return normalizedPath.replace(publicDirPattern, '');
}

/**
 * Converts a file path to a variable name according to the configuration
 */
function pathToVariableName(filePath: string, config: Config): string {
  const relativePath = getRelativePath(filePath, config);
  
  if (isTsConfig(config)) {
    // Use the custom function provided in the TypeScript config
    return config.pathToVariableName(filePath, relativePath);
  }
  
  // JSON config - use standard naming strategy
  // Extract just the filename part
  const fileName = path.basename(relativePath);
  let processedName = fileName;
  
  // Remove file extension if configured
  if (!config.includeExtensionsInNames) {
    processedName = fileName.replace(/\.[^/.]+$/, '');
  }
  
  // Replace invalid characters with underscores
  processedName = processedName.replace(/[^a-zA-Z0-9_]/g, '_');
  
  // Apply naming strategy
  let variableName = processedName;
  
  switch (config.namingStrategy) {
    case 'camelCase':
      variableName = processedName
        .split('_')
        .map((part, index) => index === 0 
          ? part.toLowerCase() 
          : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join('');
      break;
    case 'PascalCase':
      variableName = processedName
        .split('_')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join('');
      break;
    case 'snake_case':
      variableName = processedName.toLowerCase();
      break;
  }
  
  // Add prefix if specified
  if (config.variablePrefix) {
    variableName = config.variablePrefix + variableName;
  }
  
  return variableName;
}

/**
 * Transform the path value based on configuration
 */
function transformPathValue(filePath: string, config: Config): string {
  const relativePath = getRelativePath(filePath, config);
  
  if (isTsConfig(config) && config.transformPathValue) {
    // Use custom transform function if provided
    return config.transformPathValue(filePath, relativePath);
  }
  
  // Default behavior - prepend with /
  return '/' + relativePath;
}

/**
 * Determines if a file should be included based on configuration
 */
function shouldIncludeFile(filePath: string, config: Config): boolean {
  const relativePath = getRelativePath(filePath, config);
  
  // Check exclude patterns first (for both config types)
  if (config.excludePatterns.some(pattern => 
    new RegExp(pattern.replace(/\*/g, '.*')).test(relativePath))) {
    return false;
  }
  
  // If using TS config with custom inclusion function, use it
  if (isTsConfig(config) && config.shouldIncludeFile) {
    return config.shouldIncludeFile(filePath, relativePath);
  }
  
  // Otherwise include the file
  return true;
}

/**
 * Groups assets by directory structure
 */
function groupAssetsByDirectory(files: string[], config: Config): AssetGroup {
  const result: AssetGroup = {};
  
  files.forEach(file => {
    // Check if file should be included
    if (!shouldIncludeFile(file, config)) {
      return;
    }
    
    // Get relative path
    const relativePath = getRelativePath(file, config);
    
    if (config.groupByDirectory) {
      // Handle directory structure
      const parts = relativePath.split('/');
      const fileName = parts.pop() || '';
      
      // Build the nested structure
      let current = result;
      for (const part of parts) {
        if (!part) continue;
        
        // Convert directory name to proper case
        const dirVarName = pathToVariableName(part, config);
        
        if (!current[dirVarName]) {
          current[dirVarName] = {};
        }
        current = current[dirVarName] as AssetGroup;
      }
      
      // Add the file at the appropriate level
      const varName = pathToVariableName(file, config);
      current[varName] = transformPathValue(file, config);
    } else {
      // Flat structure - just use the file name with transformed path value
      const varName = pathToVariableName(file, config);
      result[varName] = transformPathValue(file, config);
    }
  });
  
  return result;
}

/**
 * Generates TypeScript code from the asset group
 */
function generateCode(group: AssetGroup, indentation = 0): string {
  const indent = ' '.repeat(indentation);
  let code = '';
  
  Object.entries(group).forEach(([key, value]) => {
    if (typeof value === 'string') {
      // It's a file path
      code += `${indent}export const ${key} = '${value}';\n`;
    } else {
      // It's a group/directory
      code += `${indent}export namespace ${key} {\n`;
      code += generateCode(value, indentation + 2);
      code += `${indent}}\n`;
    }
  });
  
  return code;
}

/**
 * Main function to generate asset variables code
 */
export function generateAssetVariables(files: string[], config: Config): string {
  // Group the assets
  const assetGroups = groupAssetsByDirectory(files, config);
  
  // Generate the code
  let generatedCode = `/**
 * This file is auto-generated by public-asset-link.
 * Do not edit this file directly.
 */

`;
  
  generatedCode += generateCode(assetGroups);
  
  return generatedCode;
}