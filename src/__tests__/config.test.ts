import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { loadConfig, DEFAULT_JSON_CONFIG, DEFAULT_TS_CONFIG } from '../config';
import { Config, JsonConfig, TsConfig } from '../types';

// Mock fs and path modules
vi.mock('fs');
vi.mock('path');

describe('Config Module', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.resetAllMocks();
    
    // Default mock implementations
    vi.mocked(path.resolve).mockImplementation((...args) => args.join('/'));
    vi.mocked(fs.existsSync).mockReturnValue(true);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('loadConfig', () => {
    it('should load JSON configuration file correctly', () => {
      const mockConfig: JsonConfig = {
        ...DEFAULT_JSON_CONFIG,
        publicDir: './custom-public',
        excludePatterns: ['**/*.test.*']
      };

      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockConfig));

      const config = loadConfig('asset-link.config.json');
      expect(config).toEqual(mockConfig);
    });

    it('should load TypeScript configuration file correctly', () => {
      const mockTsConfig: TsConfig = {
        ...DEFAULT_TS_CONFIG,
        publicDir: './custom-public',
        pathToVariableName: (filePath, relativePath) => 'customName'
      };

      // Mock require to return our mock config
      vi.mock('mock-config.ts', () => ({
        default: mockTsConfig,
      }));

      const config = loadConfig('mock-config.ts');
      expect(config).toEqual(mockTsConfig);
    });

    it('should return default JSON config when file not found', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const config = loadConfig('non-existent.json');
      expect(config).toEqual(DEFAULT_JSON_CONFIG);
    });

    it('should handle JSON parsing errors gracefully', () => {
      vi.mocked(fs.readFileSync).mockReturnValue('invalid json');

      const config = loadConfig('invalid.json');
      expect(config).toEqual(DEFAULT_JSON_CONFIG);
    });

    it('should merge partial JSON config with defaults', () => {
      const partialConfig = {
        publicDir: './custom-public'
      };

      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(partialConfig));

      const config = loadConfig('partial.json');
      expect(config.publicDir).toBe('./custom-public');
      expect(config).toHaveProperty('excludePatterns');
      expect(config).toHaveProperty('outputFile');
    });

    it('should handle TypeScript import errors gracefully', () => {
      // Mock require to throw an error
      vi.mock('error-config.ts', () => {
        throw new Error('Import error');
      });

      const config = loadConfig('error-config.ts');
      expect(config).toEqual(DEFAULT_JSON_CONFIG);
    });
  });

  describe('Default Configurations', () => {
    it('should have valid DEFAULT_JSON_CONFIG', () => {
      expect(DEFAULT_JSON_CONFIG).toHaveProperty('publicDir');
      expect(DEFAULT_JSON_CONFIG).toHaveProperty('outputFile');
      expect(DEFAULT_JSON_CONFIG).toHaveProperty('excludePatterns');
      expect(DEFAULT_JSON_CONFIG).toHaveProperty('namingStrategy');
      expect(DEFAULT_JSON_CONFIG.excludePatterns).toContain('**/.*');
    });

    it('should have valid DEFAULT_TS_CONFIG', () => {
      expect(DEFAULT_TS_CONFIG).toHaveProperty('publicDir');
      expect(DEFAULT_TS_CONFIG).toHaveProperty('outputFile');
      expect(DEFAULT_TS_CONFIG).toHaveProperty('excludePatterns');
      expect(DEFAULT_TS_CONFIG).toHaveProperty('pathToVariableName');
      expect(typeof DEFAULT_TS_CONFIG.pathToVariableName).toBe('function');
    });

    it('should generate valid variable names with DEFAULT_TS_CONFIG', () => {
      const result = DEFAULT_TS_CONFIG.pathToVariableName(
        '/path/to/my-file.png',
        'my-file.png'
      );
      expect(result).toBe('myFile');
    });

    it('should transform paths correctly with DEFAULT_TS_CONFIG', () => {
      const result = DEFAULT_TS_CONFIG.transformPathValue?.(
        '/path/to/my-file.png',
        'my-file.png'
      );
      expect(result).toBe('/my-file.png');
    });
  });
});