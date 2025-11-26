# CSS Peak Pro

An improved VSCode extension based on CSS Peak that provides smart CSS scoping and hover functionality.

## Key Differences from CSS Peak

### 🎯 Smart Scoping

**CSS Peak**: Shows ALL CSS rules across the entire workspace, making it difficult to find the relevant rules when you have multiple files with the same class names (e.g., 20+ `container` classes across different pages).

**CSS Peak Pro**: Only shows CSS rules from:

1. **Same folder** - CSS files in the same directory as your current file
2. **Same name** - CSS files with the same filename (e.g., `index.html` → `index.css`)
3. **Common directories** - Standard CSS directories like `css/`, `styles/`, `src/css/`

### 📱 Hover Support

- **Inline hover** - Hover over class names, IDs, or HTML elements to see CSS properties
- **Command-based viewing** - Select text and use `Ctrl+Shift+C` (Cmd+Shift+C on Mac) for detailed CSS display
- **Webview display** - Rich, formatted CSS display in a separate panel

### ⚙️ Configurable Settings

- Toggle hover functionality on/off
- Configure maximum number of rules to display
- Show/hide status bar indicator

## Installation

### From Source

1. Clone this repository
2. Run `npm install`
3. Run `npm run compile`
4. Press `F5` in VSCode to open a new Extension Development Host window
5. In the new window, run the extension from the Extension view

### Development

```bash
npm install
npm run compile
# Press F5 in VSCode to start debugging
```

## Usage

### Hover Functionality

1. Open an HTML, JSX, TSX, or Vue file
2. Hover over any of the following:
   - Class names (`.my-class`)
   - ID selectors (`#my-id`)
   - HTML elements (`div`, `span`, `button`, etc.)
   - React components (`MyComponent`)

### Command Mode

1. Select any text (class name, element, etc.)
2. Press `Ctrl+Shift+C` (Cmd+Shift+C on Mac)
3. Or run "CSS Peak Pro: Show CSS for this element" from the command palette
4. A detailed panel will open showing all matching CSS rules

## Smart Scoping Examples

### Scenario 1: Same Name Files

```
project/
├── index.html
├── index.css     ← Priority: HIGH
├── about.html
├── about.css     ← Priority: HIGH
└── styles/
    └── global.css ← Priority: MEDIUM
```

When viewing `index.html`:

- `index.css` rules are shown FIRST
- `global.css` rules are shown AFTER
- `about.css` rules are NOT shown (different file)

### Scenario 2: Folder Structure

```
components/
├── button/
│   ├── button.html
│   ├── button.css  ← Priority: HIGH
│   └── styles.css  ← Priority: MEDIUM
└── styles/
    └── global.css  ← Priority: LOW
```

When viewing `button.html`:

- `button.css` rules are shown FIRST (same name, same folder)
- `styles.css` rules are shown SECOND (same folder)
- `global.css` rules are shown LAST (different folder)

### Scenario 3: Common CSS Directories

```
src/
├── components/
│   └── Header.jsx
├── css/
│   └── header.css     ← Priority: HIGH (common directory)
└── styles/
    └── global.css     ← Priority: MEDIUM (common directory)
```

## Configuration

The extension adds the following settings to VSCode:

- **`cssPeakPro.enableHover`** (default: `true`) - Enable CSS hover functionality
- **`cssPeakPro.maxRulesToShow`** (default: `10`) - Maximum number of CSS rules to display
- **`cssPeakPro.showInStatusBar`** (default: `true`) - Show CSS Peak Pro in status bar

## Features

### ✅ What's Implemented

- [x] Hover support for classes, IDs, and elements
- [x] Command-based CSS viewing with `Ctrl+Shift+C`
- [x] Smart file scoping (same folder, same name, common directories)
- [x] Multiple language support (HTML, JSX, TSX, Vue)
- [x] Webview display for detailed CSS viewing
- [x] Configuration options
- [x] Status bar integration
- [x] CSS caching for performance

### 🎯 Smart Scoping Priority

1. **Highest**: CSS file with same name in same folder (e.g., `index.html` → `index.css`)
2. **High**: CSS files in same folder (any name)
3. **Medium**: SCSS/SASS files with same name in same folder
4. **Medium**: CSS files in common directories (`css/`, `styles/`, `src/css/`, etc.)
5. **Low**: SCSS/SASS files in common directories

### 🌍 Supported Languages

- HTML
- React (JSX/TSX)
- Vue.js
- PHP (basic support)
- And many more through configurable language list

## Project Structure

```
css-peak-pro/
├── src/
│   ├── extension.ts          # Main extension entry point
│   ├── cssParser.ts         # CSS parsing and rule extraction
│   └── cssPeakProProvider.ts # Hover and command provider
├── out/                     # Compiled JavaScript (generated)
├── test-project/            # Test project for demonstration
│   ├── index.html           # Test HTML file
│   ├── index.css            # Same-name CSS (high priority)
│   ├── about.html           # Another test file
│   ├── about.css            # Another same-name CSS
│   └── styles/
│       ├── global.css       # Global styles (medium priority)
│       └── components.css   # Component styles (medium priority)
└── package.json             # Extension manifest
```

## Testing the Extension

1. **Open the test project**: Open the `test-project/` folder in VSCode
2. **Test smart scoping**:
   - Open `test-project/index.html` and hover over elements
   - Notice it shows styles from `index.css` first
   - Then styles from `styles/global.css` and `styles/components.css`
3. **Test different files**:
   - Open `test-project/about.html` and observe it shows styles from `about.css`
4. **Test hover vs command**:
   - Use hover for quick info
   - Use `Ctrl+Shift+C` for detailed view

## Troubleshooting

### Extension not showing CSS

1. Check that the file is in a workspace (not just a folder)
2. Verify CSS files exist in expected locations
3. Check VSCode output panel for error messages

### Wrong CSS rules showing

1. Ensure your CSS files are in the same folder or common CSS directories
2. Check that file naming follows the expected patterns
3. Restart VSCode to clear any caching issues

## Contributing

This extension is designed to be easily extensible. Key areas for improvement:

- Support for more CSS frameworks and naming conventions
- Better selector matching algorithms
- Integration with CSS preprocessors
- Theme customization options

## License

MIT License - feel free to use and modify for your needs.
