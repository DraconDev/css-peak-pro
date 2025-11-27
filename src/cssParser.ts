import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

export interface CSSRule {
    selector: string;
    properties: { [key: string]: string };
    filePath: string;
    line?: number;
}

export class CSSParser {
    private cachedRules: Map<string, CSSRule[]> = new Map();

    /**
     * Parse CSS content and extract rules
     */
    parseCSSContent(content: string, filePath: string): CSSRule[] {
        const rules: CSSRule[] = [];

        // Simple CSS parsing - remove comments
        const cleanContent = content.replace(/\/\*[\s\S]*?\*\//g, "");

        // Match CSS rules
        const ruleRegex = /([^{]+)\{([^}]+)\}/g;
        let match;

        while ((match = ruleRegex.exec(cleanContent)) !== null) {
            const selector = match[1].trim();
            const propertiesContent = match[2].trim();

            if (selector && propertiesContent) {
                const properties: { [key: string]: string } = {};

                // Parse properties
                const propertyRegex = /([a-zA-Z-]+)\s*:\s*([^;]+);/g;
                let propertyMatch;

                while (
                    (propertyMatch = propertyRegex.exec(propertiesContent)) !==
                    null
                ) {
                    const propertyName = propertyMatch[1].trim();
                    const propertyValue = propertyMatch[2].trim();
                    properties[propertyName] = propertyValue;
                }

                rules.push({
                    selector,
                    properties,
                    filePath,
                });
            }
        }

        return rules;
    }

    /**
     * Find CSS files in the workspace with configurable scoping
     */
    findCSSFiles(currentFilePath: string): string[] {
        const config = vscode.workspace.getConfiguration("cssPeakPro");
        const scopingMode: string = config.get("scopingMode", "smart");
        const cssFileExtensions: string[] = config.get("cssFileExtensions", [
            "css",
            "scss",
            "sass",
            "less",
        ]);
        const enableFallbackToGlobal: boolean = config.get(
            "enableFallbackToGlobal",
            true
        );
        const commonDirectories: string[] = config.get("commonDirectories", [
            "css",
            "styles",
            "src/styles",
            "src/css",
            "assets/css",
            "static",
        ]);
        const fileNamePatterns: string[] = config.get("fileNamePatterns", [
            "${filename}",
            "${filename}.module",
            "${filename}.styles",
        ]);

        const workspaceFolder = vscode.workspace.getWorkspaceFolder(
            vscode.Uri.file(currentFilePath)
        );
        if (!workspaceFolder) {
            return [];
        }

        const workspacePath = workspaceFolder.uri.fsPath;
        const currentDir = path.dirname(currentFilePath);
        const currentFileName = path.basename(
            currentFilePath,
            path.extname(currentFilePath)
        );

        const cssFiles: string[] = [];

        // Helper to check for matching files based on patterns
        const checkPatterns = (dir: string) => {
            const files: string[] = [];
            for (const pattern of fileNamePatterns) {
                const baseName = pattern.replace(
                    "${filename}",
                    currentFileName
                );
                for (const ext of cssFileExtensions) {
                    const matchingFile = path.join(dir, `${baseName}.${ext}`);
                    if (fs.existsSync(matchingFile)) {
                        files.push(matchingFile);
                    }
                }
            }
            return files;
        };

        if (scopingMode === "global") {
            // Search entire workspace for CSS files
            return this.findCSSFilesInWorkspace(
                workspacePath,
                cssFileExtensions
            );
        }

        if (scopingMode === "filename") {
            // Find CSS files matching patterns (any extension)
            return checkPatterns(currentDir);
        }

        if (scopingMode === "folder") {
            // Find CSS files in the same directory (any name)
            for (const ext of cssFileExtensions) {
                const filesInFolder = this.findFilesInDirectory(
                    currentDir,
                    `*.${ext}`
                );
                cssFiles.push(...filesInFolder);
            }
            return cssFiles;
        }

        // Smart mode (default) - combination with fallback

        // Priority 0: Explicitly linked/imported CSS files (Highest Priority)
        try {
            const content = fs.readFileSync(currentFilePath, "utf8");
            const linkedFiles = this.findLinkedCSSFiles(
                content,
                currentFilePath
            );
            cssFiles.push(...linkedFiles);
        } catch (error) {
            console.error("Error reading current file for imports:", error);
        }

        // Priority 1: Matching patterns in same folder
        const patternFiles = checkPatterns(currentDir);
        cssFiles.push(...patternFiles.filter((f) => !cssFiles.includes(f)));

        // Priority 2: Same folder, any name
        for (const ext of cssFileExtensions) {
            const filesInFolder = this.findFilesInDirectory(
                currentDir,
                `*.${ext}`
            );
            cssFiles.push(
                ...filesInFolder.filter((f) => !cssFiles.includes(f))
            );
        }

        // Priority 3: Common CSS directory patterns
        for (const commonPath of commonDirectories) {
            const fullPath = path.join(workspacePath, commonPath);
            if (fs.existsSync(fullPath)) {
                for (const ext of cssFileExtensions) {
                    const filesInCommon = this.findFilesInDirectory(
                        fullPath,
                        `*.${ext}`
                    );
                    cssFiles.push(
                        ...filesInCommon.filter((f) => !cssFiles.includes(f))
                    );
                }
            }
        }

        // Priority 4: Fallback to global if enabled and no scoped files found
        if (enableFallbackToGlobal && cssFiles.length === 0) {
            const globalFiles = this.findCSSFilesInWorkspace(
                workspacePath,
                cssFileExtensions
            );
            cssFiles.push(...globalFiles);
        }

        return cssFiles;
    }

    /**
     * Find CSS files that are explicitly linked or imported in the content
     */
    private findLinkedCSSFiles(
        content: string,
        currentFilePath: string
    ): string[] {
        const linkedFiles: string[] = [];
        const currentDir = path.dirname(currentFilePath);

        // HTML <link> tags
        // Matches <link ... href="style.css" ...> or <link ... href='style.css' ...>
        const linkRegex =
            /<link[^>]*href=["']([^"']+\.(?:css|scss|sass|less))["'][^>]*>/gi;
        let match;
        while ((match = linkRegex.exec(content)) !== null) {
            const href = match[1];
            if (href) {
                const absolutePath = path.resolve(currentDir, href);
                if (fs.existsSync(absolutePath)) {
                    linkedFiles.push(absolutePath);
                }
            }
        }

        // JS/TS imports
        // Matches import ... from './style.css' or import './style.css'
        const importRegex =
            /import\s+(?:[^"']+\s+from\s+)?["']([^"']+\.(?:css|scss|sass|less))["']/gi;
        while ((match = importRegex.exec(content)) !== null) {
            const importPath = match[1];
            if (importPath) {
                // Handle webpack-style imports like '~bootstrap/...' or simple relative paths
                // For now, we'll focus on relative paths starting with . or /
                if (importPath.startsWith(".") || importPath.startsWith("/")) {
                    const absolutePath = path.resolve(currentDir, importPath);
                    if (fs.existsSync(absolutePath)) {
                        linkedFiles.push(absolutePath);
                    }
                }
            }
        }

        // JS/TS require
        // Matches require('./style.css')
        const requireRegex =
            /require\(["']([^"']+\.(?:css|scss|sass|less))["']\)/gi;
        while ((match = requireRegex.exec(content)) !== null) {
            const requirePath = match[1];
            if (
                requirePath &&
                (requirePath.startsWith(".") || requirePath.startsWith("/"))
            ) {
                const absolutePath = path.resolve(currentDir, requirePath);
                if (fs.existsSync(absolutePath)) {
                    linkedFiles.push(absolutePath);
                }
            }
        }

        return linkedFiles;
    }

    /**
     * Find CSS files throughout the entire workspace
     */
    private findCSSFilesInWorkspace(
        workspacePath: string,
        cssFileExtensions: string[]
    ): string[] {
        const config = vscode.workspace.getConfiguration("cssPeakPro");
        const scanDepth = config.get("scanDepth", 10);
        const excludeDirectories: string[] = config.get("excludeDirectories", [
            "node_modules",
            ".git",
            "target",
            "dist",
            "build",
            ".vscode",
        ]);

        const cssFiles: string[] = [];
        let currentDepth = 0;

        // Recursive function to search directories with depth control and exclusions
        const searchDirectory = (dir: string, depth: number): void => {
            if (depth >= scanDepth) {
                return; // Stop if we've reached the maximum scan depth
            }

            try {
                const items = fs.readdirSync(dir);

                for (const item of items) {
                    // Check if directory should be excluded
                    if (excludeDirectories.includes(item)) {
                        continue;
                    }

                    const fullPath = path.join(dir, item);
                    const stat = fs.statSync(fullPath);

                    if (stat.isFile()) {
                        // Check if file has CSS extension
                        const ext = path.extname(item).substring(1);
                        if (cssFileExtensions.includes(ext)) {
                            cssFiles.push(fullPath);
                        }
                    } else if (stat.isDirectory()) {
                        // Recursively search subdirectories (excluding hidden dirs)
                        if (!item.startsWith(".")) {
                            searchDirectory(fullPath, depth + 1);
                        }
                    }
                }
            } catch (error) {
                // Silently continue if directory cannot be read
            }
        };

        searchDirectory(workspacePath, currentDepth);
        return cssFiles;
    }

    /**
     * Find files in directory matching pattern
     */
    private findFilesInDirectory(dir: string, pattern: string): string[] {
        try {
            const files = fs.readdirSync(dir);
            const extension = pattern.replace("*", "").replace(".", "");

            return files
                .filter((file) => {
                    const fullPath = path.join(dir, file);
                    const stat = fs.statSync(fullPath);
                    return stat.isFile() && file.endsWith(`.${extension}`);
                })
                .map((file) => path.join(dir, file));
        } catch {
            return [];
        }
    }

    /**
     * Get CSS rules for a specific selector with smart scoping
     */
    getCSSRulesForSelector(
        selector: string,
        currentFilePath: string
    ): CSSRule[] {
        const cssFiles = this.findCSSFiles(currentFilePath);
        const relevantRules: CSSRule[] = [];

        for (const cssFile of cssFiles) {
            const cacheKey = `${cssFile}:${currentFilePath}`;

            // Check cache first
            if (!this.cachedRules.has(cacheKey)) {
                try {
                    const content = fs.readFileSync(cssFile, "utf8");
                    const rules = this.parseCSSContent(content, cssFile);
                    this.cachedRules.set(cacheKey, rules);
                } catch (error) {
                    console.error(`Error reading CSS file ${cssFile}:`, error);
                    this.cachedRules.set(cacheKey, []);
                }
            }

            const cachedRules = this.cachedRules.get(cacheKey) || [];

            // Filter rules that match the selector
            const matchingRules = cachedRules.filter((rule) => {
                return this.selectorMatches(rule.selector, selector);
            });

            relevantRules.push(...matchingRules);
        }

        return relevantRules;
    }

    /**
     * Check if a CSS selector matches the given element selector
     */
    public selectorMatches(
        cssSelector: string,
        elementSelector: string
    ): boolean {
        const cleanCssSelector = cssSelector.toLowerCase().trim();
        const cleanElementSelector = elementSelector.toLowerCase().trim();

        // Exact match
        if (cleanCssSelector === cleanElementSelector) {
            return true;
        }

        // If the element selector has no prefix (e.g. "container"), treat it as a potential class or ID
        // This handles the case where the user hovers over the word "container" in class="container"
        let potentialClass = cleanElementSelector;
        let potentialId = cleanElementSelector;

        // If it already has a dot or hash, use it as is, otherwise assume it might be one
        if (cleanElementSelector.startsWith(".")) {
            potentialClass = cleanElementSelector.substring(1);
        } else if (cleanElementSelector.startsWith("#")) {
            potentialId = cleanElementSelector.substring(1);
        }

        // Check for class match
        if (
            cleanCssSelector.includes(`.${potentialClass}`) ||
            cleanCssSelector.includes(`[class*="${potentialClass}"]`) ||
            cleanCssSelector.includes(`[class~="${potentialClass}"]`)
        ) {
            return true;
        }

        // Check for ID match
        if (cleanCssSelector.includes(`#${potentialId}`)) {
            return true;
        }

        // Element selector matching (only if it looks like an element tag)
        // We only check this if the input didn't start with . or #
        if (
            !cleanElementSelector.startsWith(".") &&
            !cleanElementSelector.startsWith("#")
        ) {
            const elementMatch = cleanElementSelector.match(
                /^([a-zA-Z][a-zA-Z0-9]*)/
            );
            if (elementMatch) {
                const elementName = elementMatch[1];
                // Ensure we match the element name but not as part of a class or ID
                // This is a simple heuristic; a full CSS parser would be better but this suffices for now
                if (
                    cleanCssSelector.startsWith(elementName) ||
                    cleanCssSelector.includes(` ${elementName}`) ||
                    cleanCssSelector.includes(`>${elementName}`) ||
                    cleanCssSelector.includes(`+${elementName}`) ||
                    cleanCssSelector.includes(`~${elementName}`)
                ) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Clear cache to force re-parsing
     */
    clearCache(): void {
        this.cachedRules.clear();
    }
}
