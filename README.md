# vite-plugin-cssmodules-in-js

A Vite plugin that enables using CSS Modules directly in JavaScript/TypeScript files via tagged template literals.

## Features

- Write CSS Modules directly in your JS/TS files using the `css` tagged template literal
- Full TypeScript support
- Hot Module Replacement (HMR) support
- Static analysis to prevent runtime issues
- Automatic scoping of CSS class names

## Installation

Not published

## Usage

1. Add the plugin to your `vite.config.ts`:

```typescript
import { defineConfig } from "vite";
import cssModulesInJs from "vite-plugin-cssmodules-in-js";

export default defineConfig({
  plugins: [cssModulesInJs()],
});
```

2. Use the `css` tagged template literal in your code:

```typescript
const styles = css`
  .container {
    padding: 20px;
    background: #f5f5f5;
  }

  .title {
    color: #333;
    font-size: 24px;
  }
`;

function MyComponent() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Hello World</h1>
    </div>
  );
}
```

## How it Works

The plugin transforms CSS tagged template literals into separate CSS Module files during the build process. It:

1. Extracts CSS content from tagged template literals
2. Creates virtual CSS Module files
3. Replaces the original CSS template literal with an import of the generated CSS Module
4. Handles hot module replacement for seamless development

## Limitations

- Only static CSS content is supported (no dynamic values in template literals)
- CSS tagged template literals must be assigned to a variable
- Cannot use CSS tagged template literals inside loops
- Each CSS tagged template literal must have unique variable names within its scope

## Error Messages

The plugin provides clear error messages for common issues:

- "css タグは静的な内容のみサポートしています" - CSS tags only support static content
- "ループ内での css タグの使用はサポートしていません" - CSS tags cannot be used inside loops
- "変数名が重複しています" - Duplicate variable names detected
- "不正なスコープで css タグが使用されています" - Invalid scope for CSS tag usage

## Development

This plugin is built with:

- TypeScript
- Babel for AST manipulation
- Vite plugin API

## License

MIT
