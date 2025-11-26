# Changelog

All notable changes to CSS Peak Pro will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-11-26

### Added

- **Smart CSS Scoping**: Only shows CSS from same folder or matching file names (improvement over CSS Peak)
- **Hover Support**: Hover over classes, IDs, and elements to see CSS properties inline
- **Command-based Viewing**: Select text and press `Ctrl+Shift+C` for detailed CSS display
- **Webview Display**: Rich, formatted CSS display in separate panels
- **Multi-language Support**: HTML, JSX, TSX, Vue.js, and more
- **Configurable Settings**: Toggle hover, set max rules, show/hide status bar
- **Status Bar Integration**: Quick access to CSS Peak Pro features
- **Performance Optimized**: CSS parsing with caching for better performance

### Features

- Smart file prioritization (same name → same folder → common directories)
- Support for CSS, SCSS, and SASS files
- Advanced selector matching (classes, IDs, elements, components)
- Configurable maximum rules to display
- Real-time CSS rule filtering based on current file

### Technical Details

- Built with TypeScript for better type safety
- Implements VSCode Extension API v1.74+
- Uses VSCode Language Server Protocol for hover provider
- Efficient file system scanning with caching
- Cross-platform compatibility (Windows, macOS, Linux)

### Improvements over CSS Peak

- **Smart Scoping**: No more confusion from 20+ container classes across projects
- **Better Performance**: Cached parsing reduces file system calls
- **Enhanced UI**: Both hover and detailed webview displays
- **More Configurable**: User can control various aspects of functionality
- **Better Organization**: Prioritizes relevant CSS files automatically

### Browser/IDE Support

- VSCode 1.74.0 and later
- All supported operating systems
- Multi-root workspace support

### Known Issues

- None at this time

### Future Roadmap

- [ ] Support for more CSS preprocessors (LESS, Stylus)
- [ ] Integration with popular CSS frameworks
- [ ] Theme customization options
- [ ] Enhanced selector matching algorithms
- [ ] Performance metrics and optimization
