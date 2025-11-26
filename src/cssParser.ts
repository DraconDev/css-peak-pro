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
          (propertyMatch = propertyRegex.exec(propertiesContent)) !== null
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
   * Find CSS files in the workspace with smart scoping
   */
  findCSSFiles(currentFilePath: string): string[] {
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

    // Priority 1: Same folder CSS files with matching name
    const matchingFileInSameFolder = path.join(
      currentDir,
      `${currentFileName}.css`
    );
    if (fs.existsSync(matchingFileInSameFolder)) {
      cssFiles.push(matchingFileInSameFolder);
    }

    // Priority 2: Same folder CSS files (any name)
    const cssFilesInFolder = this.findFilesInDirectory(currentDir, "*.css");
    cssFiles.push(...cssFilesInFolder.filter((f) => !cssFiles.includes(f)));

    // Priority 3: SCSS/SASS files with matching name
    const matchingScssInSameFolder = path.join(
      currentDir,
      `${currentFileName}.scss`
    );
    if (fs.existsSync(matchingScssInSameFolder)) {
      cssFiles.push(matchingScssInSameFolder);
    }

    const scssFilesInFolder = this.findFilesInDirectory(currentDir, "*.scss");
    cssFiles.push(...scssFilesInFolder.filter((f) => !cssFiles.includes(f)));

    // Priority 4: Common CSS directory patterns
    const commonPaths = [
      "css",
      "styles",
      "src/styles",
      "src/css",
      "assets/css",
    ];
    for (const commonPath of commonPaths) {
      const fullPath = path.join(workspacePath, commonPath);
      if (fs.existsSync(fullPath)) {
        const cssFilesInCommon = this.findFilesInDirectory(fullPath, "*.css");
        cssFiles.push(...cssFilesInCommon.filter((f) => !cssFiles.includes(f)));

        const scssFilesInCommon = this.findFilesInDirectory(fullPath, "*.scss");
        cssFiles.push(
          ...scssFilesInCommon.filter((f) => !cssFiles.includes(f))
        );
      }
    }

    return cssFiles;
  }

  /**
   * Find files in directory matching pattern
   */
  private findFilesInDirectory(dir: string, pattern: string): string[] {
    try {
      const files = fs.readdirSync(dir);
      return files
        .filter((file) => {
          const fullPath = path.join(dir, file);
          const stat = fs.statSync(fullPath);
          return (
            stat.isFile() && (file.endsWith(".css") || file.endsWith(".scss"))
          );
        })
        .map((file) => path.join(dir, file));
    } catch {
      return [];
    }
  }

  /**
   * Get CSS rules for a specific selector with smart scoping
   */
  getCSSRulesForSelector(selector: string, currentFilePath: string): CSSRule[] {
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
  private selectorMatches(
    cssSelector: string,
    elementSelector: string
  ): boolean {
    const cleanCssSelector = cssSelector.toLowerCase().trim();
    const cleanElementSelector = elementSelector.toLowerCase().trim();

    // Exact match
    if (cleanCssSelector === cleanElementSelector) {
      return true;
    }

    // Class selector matching
    const classMatches = cleanElementSelector.match(/\.([a-zA-Z0-9-_]+)/g);
    if (classMatches) {
      for (const classMatch of classMatches) {
        const className = classMatch.substring(1);
        if (
          cleanCssSelector.includes(`.${className}`) ||
          cleanCssSelector.includes(`[class*="${className}"]`) ||
          cleanCssSelector.includes(`[class~="${className}"]`)
        ) {
          return true;
        }
      }
    }

    // ID selector matching
    const idMatches = cleanElementSelector.match(/#([a-zA-Z0-9-_]+)/g);
    if (idMatches) {
      for (const idMatch of idMatches) {
        const idName = idMatch.substring(1);
        if (cleanCssSelector.includes(`#${idName}`)) {
          return true;
        }
      }
    }

    // Element selector matching
    const elementMatch = cleanElementSelector.match(/^([a-zA-Z][a-zA-Z0-9]*)/);
    if (elementMatch) {
      const elementName = elementMatch[1];
      if (
        cleanCssSelector.includes(elementName) &&
        !cleanCssSelector.includes(".")
      ) {
        return true;
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
