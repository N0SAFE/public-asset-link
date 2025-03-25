import { TsConfig } from './src/types';
import path from 'path';
import fs from 'fs';

/**
 * Asset Link TypeScript configuration with custom callbacks
 */
const config: TsConfig = {
  publicDir: './public',
  outputFile: './src/generated/assetPaths.ts',
  excludePatterns: ['**/node_modules/**'],
  groupByDirectory: true,
  
  /**
   * Custom variable naming function
   * This example creates PascalCase names and adds the file type as a prefix
   */
  pathToVariableName: (filePath, relativePath) => {
    console.log(`Processing file for variable name: ${filePath} (${relativePath})`);
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
    console.log(`Transform path value for: ${filePath}, extension: ${ext}`);
    
    // Check if it's an image file
    if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext)) {
      return `/images/${relativePath}`;
    }
    
    // Check if it's a document
    if (['.pdf', '.doc', '.docx', '.xls', '.xlsx'].includes(ext)) {
      return `/documents/${relativePath}`;
    }
    
    // JSON files special handling
    if (ext === '.json') {
      console.log(`JSON file detected: ${relativePath}`);
      return `/data/${relativePath}`;
    }
    
    // Default path
    return `/${relativePath}`;
  },
  
  /**
   * Custom file inclusion logic
   * This example only includes certain file types
   */
  shouldIncludeFile: (filePath, relativePath) => {
    console.log(`Checking file for inclusion: ${filePath}`);
    console.log(`File exists: ${fs.existsSync(filePath)}`);
    
    const ext = path.extname(relativePath).toLowerCase();
    console.log(`File extension: ${ext}`);
    
    // Include only specific file types
    const allowedExtensions = [
      '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg',
      '.pdf', '.doc', '.docx',
      '.json', '.xml'
    ];
    
    const shouldInclude = allowedExtensions.includes(ext);
    console.log(`Should include ${filePath}: ${shouldInclude} (extension: ${ext})`);
    return shouldInclude;
  }
};

// Print the public directory contents at startup
try {
  const publicDir = path.resolve(process.cwd(), './public');
  console.log(`Public directory: ${publicDir}`);
  console.log(`Public directory exists: ${fs.existsSync(publicDir)}`);
  if (fs.existsSync(publicDir)) {
    console.log('Files in public directory:');
    fs.readdirSync(publicDir).forEach(file => {
      console.log(` - ${file}`);
    });
  }
} catch (error) {
  console.error('Error reading public directory:', error);
}

export default config;