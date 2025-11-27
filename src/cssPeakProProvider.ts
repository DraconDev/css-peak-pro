import * as vscode from "vscode";
import { CSSParser, CSSRule } from "./cssParser";

export class CSSPeakProProvider implements vscode.HoverProvider {
    private cssParser: CSSParser;

    constructor(cssParser: CSSParser) {
        this.cssParser = cssParser;
        console.log("CSS Peak Pro: CSSPeakProProvider constructed");
    }

    provideHover(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.Hover> {
        console.log("=== CSS Peak Pro: HOVER TRIGGERED ===");
        console.log(`Document: ${document.fileName}`);
        console.log(`Language: ${document.languageId}`);
        console.log(
            `Position: line ${position.line}, char ${position.character}`
        );

        const config = vscode.workspace.getConfiguration("cssPeakPro");
        const enableHover = config.get("enableHover", true);
        console.log(`Hover enabled: ${enableHover}`);

        if (!enableHover) {
            console.log("CSS Peak Pro: Hover is disabled");
            return null;
        }

        // Get the word at the current position
        const range = document.getWordRangeAtPosition(position);
        if (!range) {
            console.log("CSS Peak Pro: No word found at position");
            return null;
        }

        const word = document.getText(range);
        console.log(`CSS Peak Pro: Found word: "${word}"`);
        console.log(`Word length: ${word.length}`);
        console.log(
            `Word chars: ${word
                .split("")
                .map((c) => c.charCodeAt(0))
                .join(",")}`
        );

        if (!word || word.length === 0) {
            console.log("CSS Peak Pro: Empty word");
            return null;
        }

        // Very permissive CSS detection - accept anything that looks like text
        console.log(
            "CSS Peak Pro: ACCEPTING as potential CSS selector (testing mode)"
        );

        console.log(`CSS Peak Pro: Getting CSS rules for "${word}"`);

        const cssRules = this.cssParser.getCSSRulesForSelector(
            word,
            document.uri.fsPath
        );

        console.log(`CSS Peak Pro: Found ${cssRules.length} CSS rules`);

        if (cssRules.length === 0) {
            console.log("CSS Peak Pro: No CSS rules found, returning null");
            return null;
        }

        console.log("CSS Peak Pro: Creating hover content...");
        const hoverContent = this.createHoverContent(cssRules, word);
        console.log("CSS Peak Pro: Hover content created");

        console.log("=== CSS Peak Pro: RETURNING HOVER ===");
        return new vscode.Hover(hoverContent, range);
    }

    /**
     * Create hover content for inline display
     */
    private createHoverContent(
        rules: CSSRule[],
        selector: string
    ): vscode.MarkdownString {
        const content = new vscode.MarkdownString();

        // Group rules by file
        const rulesByFile = new Map<string, CSSRule[]>();
        rules.forEach((rule) => {
            const fileName = rule.filePath.split(/[\\/]/).pop() || "unknown";
            if (!rulesByFile.has(fileName)) {
                rulesByFile.set(fileName, []);
            }
            rulesByFile.get(fileName)!.push(rule);
        });

        // Display each file's rules
        rulesByFile.forEach((fileRules, fileName) => {
            content.appendText(`${fileName}\n\n`);

            fileRules.forEach((rule) => {
                let cssBlock = `${rule.selector} {\n`;
                Object.entries(rule.properties).forEach(([property, value]) => {
                    cssBlock += `  ${property}: ${value};\n`;
                });
                cssBlock += `}`;

                content.appendCodeblock(cssBlock, "css");
            });
        });

        return content;
    }
}
