import { TsConfig } from './src/types';
import path from 'path';

/**
 * Asset Link TypeScript configuration with custom callbacks
 */
const config: TsConfig = {
  publicDir: './public',
  outputFile: './src/generated/assetPaths.ts',
  excludePatterns: ['**/.*', '**/node_modules/**'],
  groupByDirectory: true,
  
  /**
   * Custom variable naming function
   * This example creates PascalCase names and adds the file type as a prefix
   */
  pathToVariableName: (filePath, relativePath) => {
    const fileName = path.basename(relativePath);
    const ext = path.extname(fileName).slice(1); // Get extension without the dot
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
    
    // Convert to PascalCase
    const pascalCaseName = nameWithoutExt
      .replace(/[^a-zA-Z0-9_]/g, '_')
      .split('_')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join('');
    
    // Add file type prefix if available
    return ext ? `${ext.toUpperCase()}${pascalCaseName}` : pascalCaseName;
  },
  
  /**
   * Custom path transformation
   * This example formats paths to be compatible with Next.js Image component
   */
  transformPathValue: (filePath, relativePath) => {
    const ext = path.extname(relativePath).toLowerCase();
    
    // Check if it's an image file
    if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext)) {
      return `/images/${relativePath}`;
    }
    
    // Check if it's a document
    if (['.pdf', '.doc', '.docx', '.xls', '.xlsx'].includes(ext)) {
      return `/documents/${relativePath}`;
    }
    
    // Default path
    return `/${relativePath}`;
  },
  
  /**
   * Custom file inclusion logic
   * This example only includes certain file types
   */
  shouldIncludeFile: (filePath, relativePath) => {
    const ext = path.extname(relativePath).toLowerCase();
    
    // Include only specific file types
    const allowedExtensions = [
      '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg',
      '.pdf', '.doc', '.docx',
      '.json', '.xml'
    ];
    
    return allowedExtensions.includes(ext);
  }
};

export default config;