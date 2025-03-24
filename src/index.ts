#!/usr/bin/env node

import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import chokidar from 'chokidar';
import { generateAssetVariables } from './generator';
import { loadConfig, DEFAULT_JSON_CONFIG, DEFAULT_TS_CONFIG } from './config';

const program = new Command();

program
  .name('public-asset-link')
  .description('A CLI tool for generating TypeScript variables from NextJS public assets')
  .version('1.0.0');

program
  .command('init')
  .description('Initialize a configuration file')
  .option('-t, --typescript', 'Create a TypeScript config file instead of JSON')
  .action((options) => {
    const configFile = path.join(
      process.cwd(), 
      options.typescript ? 'asset-link.config.ts' : 'asset-link.config.json'
    );
    
    if (fs.existsSync(configFile)) {
      console.log('Configuration file already exists');
      return;
    }
    
    if (options.typescript) {
      // Create TypeScript config template
      const tsConfigContent = `import { TsConfig } from './src/types';
import path from 'path';

/**
 * Asset Link TypeScript configuration
 */
const config: TsConfig = {
  publicDir: './public',
  outputFile: './src/generated/assetPaths.ts',
  excludePatterns: ['**/.*', '**/node_modules/**'],
  groupByDirectory: true,
  
  // Custom function to convert file paths to variable names
  pathToVariableName: (filePath, relativePath) => {
    // Extract just the filename without extension
    const fileName = path.basename(relativePath);
    const nameWithoutExt = fileName.replace(/\\.[^/.]+$/, '');
    
    // Convert to camelCase with custom logic
    // Example: convert 'my-awesome-image.png' to 'myAwesomeImage'
    return nameWithoutExt
      .replace(/[^a-zA-Z0-9_]/g, '_')
      .split('_')
      .map((part, index) => index === 0 
        ? part.toLowerCase() 
        : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join('');
  },
  
  // Optional: transform path value (modify the path string assigned to variables)
  transformPathValue: (filePath, relativePath) => {
    // Example: prepend with '/assets/' instead of just '/'
    return '/assets/' + relativePath;
  },
  
  // Optional: custom filter for files
  shouldIncludeFile: (filePath, relativePath) => {
    // Example: exclude all .map files
    if (relativePath.endsWith('.map')) {
      return false;
    }
    return true;
  }
};

export default config;
`;
      fs.writeFileSync(configFile, tsConfigContent);
    } else {
      // Create JSON config
      fs.writeFileSync(
        configFile,
        JSON.stringify(DEFAULT_JSON_CONFIG, null, 2)
      );
    }
    
    console.log(`Configuration file created at ${configFile}`);
  });

program
  .command('generate')
  .description('Generate TypeScript variables from public assets')
  .option('-c, --config <path>', 'path to config file', './asset-link.config.json')
  .action(async (options) => {
    const config = loadConfig(options.config);
    await generateAssetFiles(config);
    console.log('Asset variables generated successfully!');
  });

program
  .command('watch')
  .description('Watch for changes in public assets and regenerate variables')
  .option('-c, --config <path>', 'path to config file', './asset-link.config.json')
  .action((options) => {
    const config = loadConfig(options.config);
    console.log(`Watching for changes in ${config.publicDir}...`);
    
    // Initial generation
    generateAssetFiles(config);
    
    // Watch for changes
    const watcher = chokidar.watch(config.publicDir, {
      ignored: /(^|[\/\\])\../, // ignore dotfiles
      persistent: true
    });
    
    watcher
      .on('add', () => generateAssetFiles(config))
      .on('unlink', () => generateAssetFiles(config))
      .on('change', () => generateAssetFiles(config));
      
    console.log('Watching for file changes...');
  });

async function generateAssetFiles(config: any): Promise<void> {
  try {
    // Convert relative paths to absolute paths for reliable file operations
    const publicDirAbs = path.resolve(process.cwd(), config.publicDir);
    console.log(`Scanning for assets in: ${publicDirAbs}`);
    
    // Find all files in the public directory matching the patterns
    const files = await glob(`${publicDirAbs}/**/*`, {
      ignore: config.excludePatterns.map((pattern: string) => 
        `${publicDirAbs}/${pattern.replace(/^\*\*\//, '')}`
      ),
      nodir: true
    });
    
    console.log(`Found ${files.length} files to process`);
    if (files.length > 0) {
      console.log(`Sample file: ${files[0]}`);
    }
    
    // Generate TypeScript code from the assets
    const generatedCode = generateAssetVariables(files, config);
    
    // Write the output file
    const outputFileAbs = path.resolve(process.cwd(), config.outputFile);
    const outputDir = path.dirname(outputFileAbs);
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(outputFileAbs, generatedCode);
    console.log(`Generated asset paths file at: ${outputFileAbs}`);
  } catch (error) {
    console.error('Error generating asset files:', error);
  }
}

program.parse(process.argv);