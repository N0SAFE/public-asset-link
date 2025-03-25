import { describe, it, expect, beforeEach, vi } from 'vitest';
import path from 'path';
import { generateAssetVariables } from '../generator';
import { JsonConfig, TsConfig } from '../types';

// Mock path module
vi.mock('path', () => ({
  basename: vi.fn((p) => p.split('/').pop()),
  relative: vi.fn((from, to) => {
    // Mock relative path calculation for tests
    return to.replace(from + '/', '');
  }),
  resolve: vi.fn((base, p) => p),
  join: vi.fn((...args) => args.join('/'))
}));

describe('Generator Module', () => {
  let jsonConfig: JsonConfig;
  let tsConfig: TsConfig;
  
  beforeEach(() => {
    // Reset configs before each test
    jsonConfig = {
      publicDir: './public',
      outputFile: './src/generated/assetPaths.ts',
      excludePatterns: ['**/.*'],
      namingStrategy: 'camelCase',
      includeExtensionsInNames: false,
      variablePrefix: '',
      groupByDirectory: true
    };

    tsConfig = {
      publicDir: './public',
      outputFile: './src/generated/assetPaths.ts',
      excludePatterns: ['**/.*'],
      groupByDirectory: true,
      pathToVariableName: (filePath, relativePath) => {
        return path.basename(relativePath).replace(/\.[^/.]+$/, '');
      }
    };
  });

  describe('JSON Config Generation', () => {
    it('should generate variables with camelCase naming', () => {
      const files = [
        '/path/to/public/image.png',
        '/path/to/public/my-icon.svg'
      ];

      const result = generateAssetVariables(files, jsonConfig);
      expect(result).toContain('export const image = \'/image.png\'');
      expect(result).toContain('export const myIcon = \'/my-icon.svg\'');
    });

    it('should generate variables with PascalCase naming', () => {
      jsonConfig.namingStrategy = 'PascalCase';
      const files = [
        '/path/to/public/image.png',
        '/path/to/public/my-icon.svg'
      ];

      const result = generateAssetVariables(files, jsonConfig);
      expect(result).toContain('export const Image = \'/image.png\'');
      expect(result).toContain('export const MyIcon = \'/my-icon.svg\'');
    });

    it('should generate variables with snake_case naming', () => {
      jsonConfig.namingStrategy = 'snake_case';
      const files = [
        '/path/to/public/image.png',
        '/path/to/public/my-icon.svg'
      ];

      const result = generateAssetVariables(files, jsonConfig);
      expect(result).toContain('export const image = \'/image.png\'');
      expect(result).toContain('export const my_icon = \'/my-icon.svg\'');
    });

    it('should include file extensions in variable names when configured', () => {
      jsonConfig.includeExtensionsInNames = true;
      const files = ['/path/to/public/image.png'];

      const result = generateAssetVariables(files, jsonConfig);
      expect(result).toContain('export const imagePng = \'/image.png\'');
    });

    it('should add variable prefix when configured', () => {
      jsonConfig.variablePrefix = 'asset_';
      const files = ['/path/to/public/image.png'];

      const result = generateAssetVariables(files, jsonConfig);
      expect(result).toContain('export const asset_image = \'/image.png\'');
    });
  });

  describe('TypeScript Config Generation', () => {
    it('should use custom pathToVariableName function', () => {
      tsConfig.pathToVariableName = (filePath, relativePath) => 'custom_' + path.basename(relativePath, '.png');
      const files = ['/path/to/public/image.png'];

      const result = generateAssetVariables(files, tsConfig);
      expect(result).toContain('export const custom_image = \'/image.png\'');
    });

    it('should use custom transformPathValue function', () => {
      tsConfig.transformPathValue = (filePath, relativePath) => '/assets/' + relativePath;
      const files = ['/path/to/public/image.png'];

      const result = generateAssetVariables(files, tsConfig);
      expect(result).toContain('export const image = \'/assets/image.png\'');
    });

    it('should respect shouldIncludeFile function', () => {
      tsConfig.shouldIncludeFile = (filePath) => !filePath.endsWith('.png');
      const files = [
        '/path/to/public/image.png',
        '/path/to/public/icon.svg'
      ];

      const result = generateAssetVariables(files, tsConfig);
      expect(result).not.toContain('image.png');
      expect(result).toContain('export const icon = \'/icon.svg\'');
    });
  });

  describe('Directory Structure', () => {
    it('should group assets by directory when enabled', () => {
      const files = [
        '/path/to/public/images/icon.png',
        '/path/to/public/images/logo.svg',
        '/path/to/public/docs/readme.md'
      ];

      const result = generateAssetVariables(files, jsonConfig);
      expect(result).toContain('export namespace images {');
      expect(result).toContain('export const icon = \'/images/icon.png\'');
      expect(result).toContain('export const logo = \'/images/logo.svg\'');
      expect(result).toContain('export namespace docs {');
      expect(result).toContain('export const readme = \'/docs/readme.md\'');
    });

    it('should generate flat structure when grouping is disabled', () => {
      jsonConfig.groupByDirectory = false;
      const files = [
        '/path/to/public/images/icon.png',
        '/path/to/public/docs/readme.md'
      ];

      const result = generateAssetVariables(files, jsonConfig);
      expect(result).not.toContain('export namespace');
      expect(result).toContain('export const icon = \'/images/icon.png\'');
      expect(result).toContain('export const readme = \'/docs/readme.md\'');
    });

    it('should handle deeply nested directories', () => {
      const files = [
        '/path/to/public/assets/images/icons/menu/home.png',
        '/path/to/public/assets/images/icons/menu/settings.png'
      ];

      const result = generateAssetVariables(files, jsonConfig);
      expect(result).toContain('export namespace assets {');
      expect(result).toContain('export namespace images {');
      expect(result).toContain('export namespace icons {');
      expect(result).toContain('export namespace menu {');
      expect(result).toContain('export const home = \'/assets/images/icons/menu/home.png\'');
      expect(result).toContain('export const settings = \'/assets/images/icons/menu/settings.png\'');
    });
  });

  describe('Edge Cases', () => {
    it('should handle files with special characters', () => {
      const files = [
        '/path/to/public/my@file.png',
        '/path/to/public/some space.jpg',
        '/path/to/public/dash-name.svg'
      ];

      const result = generateAssetVariables(files, jsonConfig);
      expect(result).toContain('export const myFile = \'/my@file.png\'');
      expect(result).toContain('export const someSpace = \'/some space.jpg\'');
      expect(result).toContain('export const dashName = \'/dash-name.svg\'');
    });

    it('should handle empty directories', () => {
      const files: string[] = [];
      const result = generateAssetVariables(files, jsonConfig);
      expect(result).toContain('auto-generated');
      expect(result.trim().split('\n').length).toBeGreaterThanOrEqual(1);
    });

    it('should handle files with same names in different directories', () => {
      const files = [
        '/path/to/public/images/icon.png',
        '/path/to/public/assets/icon.png'
      ];

      const result = generateAssetVariables(files, jsonConfig);
      expect(result).toContain('export namespace images {');
      expect(result).toContain('export namespace assets {');
      expect(result).toMatch(/export const icon = '\/images\/icon.png'/);
      expect(result).toMatch(/export const icon = '\/assets\/icon.png'/);
    });
  });
});