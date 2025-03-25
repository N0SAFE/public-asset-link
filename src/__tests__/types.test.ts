import { describe, it, expect } from 'vitest';
import { isTsConfig } from '../types';
import { DEFAULT_JSON_CONFIG, DEFAULT_TS_CONFIG } from '../config';

describe('Types Module', () => {
  describe('isTsConfig', () => {
    it('should identify TypeScript configs correctly', () => {
      expect(isTsConfig(DEFAULT_TS_CONFIG)).toBe(true);
    });

    it('should identify JSON configs correctly', () => {
      expect(isTsConfig(DEFAULT_JSON_CONFIG)).toBe(false);
    });

    it('should handle partial configs correctly', () => {
      const partialTsConfig = {
        ...DEFAULT_TS_CONFIG,
        pathToVariableName: undefined,
        
      };
      expect(isTsConfig(partialTsConfig)).toBe(false);
    });

    it('should handle configs with non-function pathToVariableName', () => {
      const invalidConfig = {
        ...DEFAULT_TS_CONFIG,
        pathToVariableName: 'not a function'
      };
      expect(isTsConfig(invalidConfig as any)).toBe(false);
    });
  });

  describe('Type Validation', () => {
    it('should validate JsonConfig structure', () => {
      const validJsonConfig = {
        ...DEFAULT_JSON_CONFIG,
        namingStrategy: 'camelCase' as const,
        includeExtensionsInNames: true,
        variablePrefix: 'asset_'
      };
      
      // TypeScript will ensure this compiles
      expect(validJsonConfig.namingStrategy).toBeTypeOf('string');
      expect(validJsonConfig.includeExtensionsInNames).toBeTypeOf('boolean');
      expect(validJsonConfig.variablePrefix).toBeTypeOf('string');
    });

    it('should validate TsConfig structure', () => {
      const validTsConfig = {
        ...DEFAULT_TS_CONFIG,
        transformPathValue: (filePath: string, relativePath: string) => filePath,
        shouldIncludeFile: (filePath: string, relativePath: string) => true
      };
      
      // TypeScript will ensure this compiles
      expect(validTsConfig.pathToVariableName).toBeTypeOf('function');
      expect(validTsConfig.transformPathValue).toBeTypeOf('function');
      expect(validTsConfig.shouldIncludeFile).toBeTypeOf('function');
    });

    it('should validate BaseConfig shared properties', () => {
      const configs = [DEFAULT_JSON_CONFIG, DEFAULT_TS_CONFIG];
      
      configs.forEach(config => {
        expect(config.publicDir).toBeTypeOf('string');
        expect(config.outputFile).toBeTypeOf('string');
        expect(Array.isArray(config.excludePatterns)).toBe(true);
        expect(config.groupByDirectory).toBeTypeOf('boolean');
      });
    });
  });
});