# public-asset-link

A powerful CLI tool that transforms NextJS public assets into TypeScript variables. This tool helps maintain type safety when referencing assets in your NextJS application by automatically generating TypeScript variables for all assets in your public directory.

## Features

- 🔄 Transforms file paths in your public directory into TypeScript variables
- 🔍 Automatically detects file changes with watch mode
- 🌲 Supports nested directory structures with namespaces
- ⚙️ Highly configurable with JSON or TypeScript configurations
- 🧩 Supports custom naming strategies and path transformations
- 📝 Generates clean, maintainable TypeScript code

## Installation

### Local Installation (Recommended)

```bash
# Install as a dev dependency in your NextJS project
npm install --save-dev public-asset-link

# Or using yarn
yarn add -D public-asset-link
```

### Global Installation

```bash
# Install globally
npm install -g public-asset-link
```

## Quick Start

1. Initialize a configuration file:

```bash
npx public-asset-link init
```

2. Generate TypeScript variables from your public assets:

```bash
npx public-asset-link generate
```

3. Import and use the generated variables in your code:

```typescript
import { logo } from './generated/assetPaths';

// Now you can use the asset path with type safety
const MyComponent = () => <img src={logo} alt="Logo" />;
```

## Configuration

### JSON Configuration (Basic)

The default configuration file (`asset-link.config.json`) provides simple but effective options:

```json
{
  "publicDir": "./public",
  "outputFile": "./src/generated/assetPaths.ts",
  "excludePatterns": ["**/.*", "**/node_modules/**"],
  "namingStrategy": "camelCase",
  "includeExtensionsInNames": false,
  "variablePrefix": "",
  "groupByDirectory": true
}
```

### TypeScript Configuration (Advanced)

For more advanced use cases, initialize a TypeScript configuration:

```bash
npx public-asset-link init --typescript
```

This creates an `asset-link.config.ts` file with powerful callback functions:

```typescript
import { TsConfig } from './src/types';
import path from 'path';

const config: TsConfig = {
  publicDir: './public',
  outputFile: './src/generated/assetPaths.ts',
  excludePatterns: ['**/.*', '**/node_modules/**'],
  groupByDirectory: true,
  
  // Custom variable naming function
  pathToVariableName: (filePath, relativePath) => {
    // Your custom logic to convert file paths to variable names
    // ...
  },
  
  // Custom path transformation
  transformPathValue: (filePath, relativePath) => {
    // Your custom logic to transform the path value
    // ...
  },
  
  // Custom file filtering
  shouldIncludeFile: (filePath, relativePath) => {
    // Your custom logic to determine if a file should be included
    // ...
  }
};

export default config;
```

## Configuration Options

### Base Options (Both JSON and TypeScript)

| Option | Type | Description |
|--------|------|-------------|
| `publicDir` | string | Directory containing public assets to scan (relative to project root) |
| `outputFile` | string | Output TypeScript file path where asset variables will be generated |
| `excludePatterns` | string[] | Patterns to exclude from asset scanning (glob patterns) |
| `groupByDirectory` | boolean | Whether to group assets by subdirectory as namespaces |

### JSON-Only Options

| Option | Type | Values | Description |
|--------|------|--------|-------------|
| `namingStrategy` | string | `'camelCase'`, `'PascalCase'`, `'snake_case'` | Variable naming convention |
| `includeExtensionsInNames` | boolean | `true`, `false` | Whether to include file extensions in variable names |
| `variablePrefix` | string | Any string | Optional prefix to add to all variable names |

### TypeScript Configuration Callbacks

| Callback | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `pathToVariableName` | `(filePath, relativePath)` | string | Custom function for converting file paths to variable names |
| `transformPathValue` | `(filePath, relativePath)` | string | Optional function to modify the path value assigned to the variable |
| `shouldIncludeFile` | `(filePath, relativePath)` | boolean | Optional function to determine if a file should be included |

## Usage

### Commands

| Command | Description |
|---------|-------------|
| `init` | Initialize a configuration file |
| `generate` | Generate TypeScript variables from public assets |
| `watch` | Watch for changes in public assets and regenerate variables |

### Options

| Option | Alias | Description |
|--------|-------|-------------|
| `--config <path>` | `-c` | Path to config file (default: `./asset-link.config.json`) |
| `--typescript` | `-t` | Create a TypeScript config file instead of JSON (with `init` command) |

### Examples

```bash
# Initialize with TypeScript configuration
npx public-asset-link init --typescript

# Generate using a specific config file
npx public-asset-link generate --config ./custom-config.ts

# Watch for file changes using specific config
npx public-asset-link watch --config ./custom-config.json
```

## Generated Output Example

```typescript
/**
 * This file is auto-generated by public-asset-link.
 * Do not edit this file directly.
 */

export const logo = '/logo.svg';

export namespace images {
  export const banner = '/images/banner.jpg';
  export const profilePic = '/images/profile-pic.png';
  
  export namespace icons {
    export const home = '/images/icons/home.svg';
    export const settings = '/images/icons/settings.svg';
  }
}
```

## Use Cases

- **Next.js Image Component**: Type-safe paths for the Image component
- **CSS/SCSS Modules**: Import asset paths in your style modules
- **Static Assets**: Ensure all references to static assets are type-checked

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT