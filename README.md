# CSS Peak Pro

**Enhanced CSS navigation with smart scoping and customizable discovery modes**

CSS Peak Pro is a powerful VSCode extension that helps you navigate between your HTML/JS/TS files and their CSS styling. Unlike the original CSS Peak, it uses smart scoping to show only relevant CSS rules, reducing noise in large projects.

## Features

### 🎯 Smart CSS Discovery

-   **Hover** over any class, ID, or element to see its CSS properties
-   **Ctrl+Click** to jump to the CSS definition
-   **Find All References** (Shift+F12) from CSS files to see where selectors are used
-   **Smart Import Detection** - Automatically finds CSS linked via `<link>` tags in HTML or `import`/`require` statements in JS/TS

### 🧠 Intelligent Scoping Modes

#### Smart Mode (Recommended)

Finds CSS in this priority order:

1. **Explicitly linked files** (NEW!) - Checks `<link>` tags in HTML or `import`/`require` in JS/TS
2. Files matching your name patterns (e.g., `component.module.css` for `component.tsx`)
3. All CSS files in the same folder
4. CSS files in common directories (`css/`, `styles/`, `static/`, etc.)
5. Falls back to global search if nothing found

#### Other Modes

-   **Global**: Search entire workspace
-   **Folder**: Only CSS in the same directory
-   **Filename**: Only files with matching base names

### 🎨 Beautiful Hover Popups

Clean, syntax-highlighted CSS display with proper grouping by file.

### 🌍 Universal Language Support

Works with HTML, React, Vue, Svelte, PHP, Rust templates, and many more - fully configurable!

## Installation

1. Download the latest `.vsix` from [Releases](https://github.com/DraconDev/css-peak-pro/releases)
2. In VSCode: Extensions → `...` → Install from VSIX
3. Or build from source: `npm install && npm run build`

## Configuration

All settings are under `CSS Peak Pro` in VSCode settings. Here are the key ones:

### Discovery & Scoping

**`cssPeakPro.scopingMode`** (default: `"smart"`)

-   Choose how CSS files are discovered: `smart`, `global`, `folder`, or `filename`

**`cssPeakPro.commonDirectories`** (default: `["css", "styles", "src/styles", "src/css", "assets/css", "static"]`)

-   Directories to search for global styles in Smart mode
-   Paths are relative to workspace root

**`cssPeakPro.fileNamePatterns`** (default: `["${filename}", "${filename}.module", "${filename}.styles"]`)

-   Patterns to match CSS files to source files
-   `${filename}` is replaced with the file's base name
-   Example: `component.tsx` will match `component.css`, `component.module.css`, `component.styles.css`

**`cssPeakPro.cssFileExtensions`** (default: `["css", "scss", "sass", "less"]`)

-   Which file extensions to treat as CSS

### Language Support

**`cssPeakPro.peekFromLanguages`**

-   **Default includes**: HTML, JavaScript, TypeScript, React, Vue, Rust, PHP, and many more
-   **🎯 FULLY CUSTOMIZABLE!** Add any language you want:
    1. Open VSCode Settings (`Ctrl+,`)
    2. Search for "CSS Peak Pro: Peek From Languages"
    3. Click "Edit in settings.json"
    4. Add your language ID to the array (e.g., `"go"`, `"zig"`, `"ruby"`)

**Finding Language IDs:**

-   Open a file in the target language
-   Run command: `Developer: Inspect Editor Tokens and Scopes`
-   Look for the `language` field in the output

**Example - Adding Go:**

```json
{
    "cssPeakPro.peekFromLanguages": [
        "html",
        "javascript",
        "typescript",
        "rust",
        "go" // ← Just add it here!
    ]
}
```

### Behavior

**`cssPeakPro.enableHover`** (default: `true`)

-   Show CSS on hover

**`cssPeakPro.hoverDelay`** (default: `300`ms)

-   Delay before showing hover tooltip

**`cssPeakPro.enableGoToDefinition`** (default: `true`)

-   Enable Ctrl+Click go-to-definition

**`cssPeakPro.enableFallbackToGlobal`** (default: `true`)

-   Fall back to global search when no scoped CSS found

**`cssPeakPro.maxRulesToShow`** (default: `10`)

-   Maximum CSS rules to show in hover

### Performance

**`cssPeakPro.scanDepth`** (default: `10`)

-   Maximum directory depth for scanning (1-20)

**`cssPeakPro.excludeDirectories`** (default: `["node_modules", ".git", "target", "dist", "build", ".vscode"]`)

-   Directories to skip when scanning

## Usage Examples

### Example 1: Smart Import Detection (NEW!)

```html
<!-- index.html -->
<html>
    <head>
        <link rel="stylesheet" href="theme.css" />
    </head>
    <body>
        <button class="primary">Click me</button>
    </body>
</html>
```

When you hover over `"primary"`, you'll see styles from `theme.css` **first**, even if there's a `index.css` in the same folder. The extension detects the `<link>` tag and prioritizes the linked file.

This also works with JS/TS imports:

```tsx
// Button.tsx
import "./Button.styles.css";

export function Button() {
    return <button className="primary">Click me</button>;
}
```

### Example 2: React with CSS Modules

```tsx
// Button.tsx
export function Button() {
    return <button className="primary">Click me</button>;
}
```

Hover over `"primary"` to see styles from:

1. Linked files (if any `<link>` or `import` is found)
2. `Button.module.css` (if pattern `${filename}.module` is enabled)
3. `Button.css`
4. Any CSS in the same folder
5. Common directories like `src/styles/`

### Example 3: Custom Patterns

Add to settings:

```json
{
    "cssPeakPro.fileNamePatterns": [
        "${filename}",
        "${filename}.styles",
        "${filename}-styles"
    ]
}
```

Now `HomePage.tsx` will also check for `HomePage-styles.css`!

### Example 4: Custom Common Directory

```json
{
    "cssPeakPro.commonDirectories": [
        "css",
        "styles",
        "public/stylesheets",
        "client/themes"
    ]
}
```

Smart mode will now also search these custom directories.

## Tips

-   **Performance**: Use `folder` or `filename` mode for very large projects
-   **Debugging**: Set `cssPeakPro.scopingMode` to `global` to see all available CSS
-   **Precision**: Use `filename` mode for strict file-to-file matching
-   **Flexibility**: Use `smart` mode (default) for the best balance

## Troubleshooting

### No CSS showing on hover

1. Check the file language matches one in `peekFromLanguages`
2. Verify CSS files exist in expected locations
3. Try `global` mode to see if CSS is found at all

### Wrong CSS showing

1. Adjust your `scopingMode`
2. Customize `fileNamePatterns` for your naming convention
3. Update `commonDirectories` for your project structure

### Performance issues

1. Reduce `scanDepth`
2. Add more directories to `excludeDirectories`
3. Use `folder` or `filename` mode instead of `smart`

## What's New in 2.0

-   ✨ **HTML Peak**: Find where CSS selectors are used (Shift+F12 from CSS files)
-   🎯 **Smart Import Detection**: Automatically prioritizes CSS files you actually import/link
-   🎨 **Better Formatting**: Clean, syntax-highlighted hover popups
-   🔧 **Configurable Patterns**: `fileNamePatterns` and `commonDirectories` settings
-   🐛 **Fixed Selector Matching**: No-prefix classes now work (e.g., hovering `container` finds `.container`)
-   📦 **Smaller Package**: Reduced from 10MB to 1.4MB
-   ⚡ **Related Rules**: Automatically includes pseudo-classes (`:hover`, `:focus`, etc.)

## Contributing

Found a bug or want a feature? [Open an issue](https://github.com/DraconDev/css-peak-pro/issues)!

## License

MIT - Feel free to use and modify for your needs.
