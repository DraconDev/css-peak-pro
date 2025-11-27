import * as vscode from "vscode";
import { CSSParser } from "./cssParser";

export class CSSDefinitionProvider implements vscode.DefinitionProvider {
    private cssParser: CSSParser;

    constructor(cssParser: CSSParser) {
        this.cssParser = cssParser;
    }

    provideDefinition(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.Definition | vscode.DefinitionLink[]> {
        const range = document.getWordRangeAtPosition(position);
        if (!range) {
            return null;
        }

        const word = document.getText(range);
        if (!word) {
            return null;
        }

        // Only provide definitions for potential CSS selectors
        if (!this.isPotentialSelector(word)) {
            return null;
        }

        const cssRules = this.cssParser.getCSSRulesForSelector(
            word,
            document.uri.fsPath
        );

        if (cssRules.length === 0) {
            return null;
        }

        // Find the exact match or best match for the selector
        // We use the parser's matching logic which handles various cases (no prefix, etc.)
        const exactMatches = cssRules.filter((rule) =>
            this.cssParser.selectorMatches(rule.selector, word)
        );

        if (exactMatches.length === 0) {
            return null;
        }

        // Create definition locations for all matches
        const definitions: vscode.DefinitionLink[] = exactMatches.map(
            (rule) => {
                const filePath = rule.filePath;

                // Parse the CSS file to find the exact line number
                const lineNumber = this.findSelectorLineNumber(
                    filePath,
                    rule.selector
                );

                return {
                    targetUri: vscode.Uri.file(filePath),
                    targetRange: new vscode.Range(
                        new vscode.Position(lineNumber, 0),
                        new vscode.Position(lineNumber + 1, 0)
                    ),
                    originSelectionRange: range,
                };
            }
        );

        return definitions;
    }

    /**
     * Check if the word is a potential CSS selector
     */
    private isPotentialSelector(word: string): boolean {
        // Class selectors
        if (word.startsWith(".")) {
            return true;
        }

        // ID selectors
        if (word.startsWith("#")) {
            return true;
        }

        // HTML elements
        const commonElements = [
            "div",
            "span",
            "p",
            "h1",
            "h2",
            "h3",
            "h4",
            "h5",
            "h6",
            "button",
            "input",
            "form",
            "nav",
            "header",
            "footer",
            "main",
            "section",
            "article",
            "aside",
            "ul",
            "li",
            "ol",
            "a",
            "img",
            "table",
            "tr",
            "td",
            "th",
            "div",
            "span",
            "strong",
            "em",
        ];

        if (commonElements.includes(word.toLowerCase())) {
            return true;
        }

        // Custom elements or components (PascalCase or kebab-case)
        if (/^[A-Z][a-zA-Z]*$/.test(word) || /^[a-z]+(-[a-z]+)*$/.test(word)) {
            return true;
        }

        return false;
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
        const elementMatch = cleanElementSelector.match(
            /^([a-zA-Z][a-zA-Z0-9]*)/
        );
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
     * Find the line number where a selector is defined in a CSS file
     */
    private findSelectorLineNumber(filePath: string, selector: string): number {
        try {
            const fs = require("fs");
            const content = fs.readFileSync(filePath, "utf8");
            const lines = content.split("\n");

            // Clean selector (remove class/id prefixes for better matching)
            const cleanSelector = selector.replace(/^[.#]/, "");

            // Look for the selector pattern in CSS rules
            // Pattern: selector followed by { or space or comma
            const selectorPattern = cleanSelector.replace(
                /[.*+?^${}()|[\]\\]/g,
                "\\$&"
            );
            const regex = new RegExp(
                `\\s*${selectorPattern}\\s*[{#,)]|\\s*${selectorPattern}\\s*\\{`,
                "i"
            );

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                if (regex.test(line)) {
                    return i;
                }
            }

            // If exact match not found, try partial match for compound selectors
            if (cleanSelector.includes("-")) {
                const parts = cleanSelector.split("-");
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i].trim();
                    // Check if any part of the compound selector exists
                    for (const part of parts) {
                        if (
                            line.includes(`.${part}`) ||
                            line.includes(`#${part}`)
                        ) {
                            return i;
                        }
                    }
                }
            }

            // Fallback: check if the selector text appears in the file
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                if (line.includes(cleanSelector)) {
                    return i;
                }
            }
        } catch (error) {
            console.error(`Error reading CSS file ${filePath}:`, error);
        }

        return 0; // Default to line 0 if not found
    }
}
