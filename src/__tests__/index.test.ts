import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import chokidar from 'chokidar';

// Mock all external modules
vi.mock('fs');
vi.mock('path');
vi.mock('glob');
vi.mock('chokidar');

// Mock the generator module
vi.mock('../generator', () => ({
  generateAssetVariables: vi.fn().mockReturnValue('// Generated content')
}));

describe('CLI Module', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    
    // Default mock implementations
    vi.mocked(path.resolve).mockImplementation((...args) => args.join('/'));
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(glob).mockResolvedValue([
      '/path/to/public/image.png',
      '/path/to/public/icon.svg'
    ]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('generate command', () => {
    it('should handle file not found gracefully', async () => {
      // Mock file not found
      vi.mocked(fs.existsSync).mockReturnValue(false);
      
      // Import the command after mocking
      const { generateAssetFiles } = await import('../index');
      await generateAssetFiles({
        publicDir: './non-existent',
        outputFile: './output.ts',
        excludePatterns: []
      });
      
      // Should try to check directory existence
      expect(fs.existsSync).toHaveBeenCalled();
      // Should not try to write output file
      expect(fs.writeFileSync).not.toHaveBeenCalled();
    });

    it('should handle glob errors gracefully', async () => {
      // Mock glob error
      vi.mocked(glob).mockRejectedValue(new Error('Glob error'));
      
      const { generateAssetFiles } = await import('../index');
      await generateAssetFiles({
        publicDir: './public',
        outputFile: './output.ts',
        excludePatterns: []
      });
      
      // Should not write output on error
      expect(fs.writeFileSync).not.toHaveBeenCalled();
    });

    it('should create output directory if it does not exist', async () => {
      // Mock output directory not existing
      vi.mocked(fs.existsSync)
        .mockReturnValueOnce(true)  // public dir exists
        .mockReturnValueOnce(false); // output dir doesn't exist
      
      const { generateAssetFiles } = await import('../index');
      await generateAssetFiles({
        publicDir: './public',
        outputFile: './output/assetPaths.ts',
        excludePatterns: []
      });
      
      // Should create output directory
      expect(fs.mkdirSync).toHaveBeenCalledWith(expect.any(String), { recursive: true });
    });

    it('should correctly handle exclude patterns', async () => {
      const { generateAssetFiles } = await import('../index');
      await generateAssetFiles({
        publicDir: './public',
        outputFile: './output.ts',
        excludePatterns: ['**/*.test.*', '**/.*']
      });
      
      // Should pass exclude patterns to glob
      expect(glob).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          ignore: expect.arrayContaining([
            expect.stringContaining('**/*.test.*'),
            expect.stringContaining('**/.*')
          ])
        })
      );
    });
  });

  describe('watch command', () => {
    it('should set up file watchers correctly', async () => {
      const mockWatcher = {
        on: vi.fn().mockReturnThis()
      };
      
      vi.mocked(chokidar.watch).mockReturnValue(mockWatcher as any);
      
      const { watchAssetFiles } = await import('../index');
      await watchAssetFiles({
        publicDir: './public',
        outputFile: './output.ts',
        excludePatterns: []
      });
      
      // Should set up watcher with correct events
      expect(mockWatcher.on).toHaveBeenCalledWith('add', expect.any(Function));
      expect(mockWatcher.on).toHaveBeenCalledWith('unlink', expect.any(Function));
      expect(mockWatcher.on).toHaveBeenCalledWith('change', expect.any(Function));
    });

    it('should ignore dot files in watch mode', async () => {
      const { watchAssetFiles } = await import('../index');
      await watchAssetFiles({
        publicDir: './public',
        outputFile: './output.ts',
        excludePatterns: []
      });
      
      // Should configure chokidar to ignore dot files
      expect(chokidar.watch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          ignored: /(^|[\/\\])\../
        })
      );
    });
  });

  describe('init command', () => {
    it('should create JSON config file if it does not exist', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      
      const { initConfig } = await import('../index');
      await initConfig({ typescript: false });
      
      // Should write JSON config file
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('asset-link.config.json'),
        expect.any(String)
      );
    });

    it('should create TypeScript config file if specified', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      
      const { initConfig } = await import('../index');
      await initConfig({ typescript: true });
      
      // Should write TypeScript config file
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('asset-link.config.ts'),
        expect.any(String)
      );
    });

    it('should not overwrite existing config files', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      
      const { initConfig } = await import('../index');
      await initConfig({ typescript: false });
      
      // Should not write file if it exists
      expect(fs.writeFileSync).not.toHaveBeenCalled();
    });
  });
});