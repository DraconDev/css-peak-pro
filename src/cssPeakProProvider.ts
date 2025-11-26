import * as vscode from "vscode";
import { CSSParser, CSSRule } from "./cssParser";

export class CSSPeakProProvider implements vscode.HoverProvider {
  private cssParser: CSSParser;

  constructor(cssParser: CSSParser) {
    this.cssParser = cssParser;
  }

  provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.Hover> {
    const config = vscode.workspace.getConfiguration("cssPeakPro");
    const enableHover = config.get("enableHover", true);

    if (!enableHover) {
      return null;
    }

    const range = document.getWordRangeAtPosition(position);
    if (!range) {
      return null;
    }

    const word = document.getText(range);
    if (!word) {
      return null;
    }

    // Only provide hover for potential CSS selectors
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

    const maxRules = config.get("maxRulesToShow", 10);
    const relevantRules = cssRules.slice(0, maxRules);

    const hoverContent = this.createHoverContent(relevantRules, word);

    return new vscode.Hover(hoverContent, range);
  }

  /**
   * Show CSS for a specific selection
   */
  showCSSForSelection(selector: string, position: vscode.Position): void {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }

    const document = editor.document;
    const cssRules = this.cssParser.getCSSRulesForSelector(
      selector,
      document.uri.fsPath
    );

    if (cssRules.length === 0) {
      vscode.window.showInformationMessage(
        `No CSS rules found for "${selector}"`
      );
      return;
    }

    const config = vscode.workspace.getConfiguration("cssPeakPro");
    const maxRules = config.get("maxRulesToShow", 10);
    const relevantRules = cssRules.slice(0, maxRules);

    const content = this.createDetailedContent(relevantRules, selector);

    // Create and show a new hover-like display
    const hover = new vscode.Hover(
      content,
      new vscode.Range(position, position)
    );
    vscode.languages.registerHoverProvider(["html", "jsx", "tsx", "vue"], {
      provideHover: () => hover,
    });

    // Show in a new tab for better visibility
    const panel = vscode.window.createWebviewPanel(
      "cssPeakPro",
      `CSS Rules for "${selector}"`,
      vscode.ViewColumn.Beside,
      {}
    );

    panel.webview.html = this.createWebviewContent(relevantRules, selector);
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
   * Create hover content for inline display
   */
  private createHoverContent(
    rules: CSSRule[],
    selector: string
  ): vscode.MarkdownString {
    const content = new vscode.MarkdownString();

    content.appendText(`CSS Rules for "${selector}":\n\n`);

    rules.forEach((rule, index) => {
      const fileName = rule.filePath.split(/[\\/]/).pop();
      content.appendText(`📁 ${fileName}\n`);
      content.appendText(`🔧 ${rule.selector}\n`);

      // Add properties in a compact format
      Object.entries(rule.properties).forEach(([property, value]) => {
        content.appendText(`  ${property}: ${value};\n`);
      });

      if (index < rules.length - 1) {
        content.appendText("\n");
      }
    });

    if (
      rules.length >=
      vscode.workspace.getConfiguration("cssPeakPro").get("maxRulesToShow", 10)
    ) {
      content.appendText(
        `\n... and ${
          rules.length -
          vscode.workspace
            .getConfiguration("cssPeakPro")
            .get("maxRulesToShow", 10)
        } more rules`
      );
    }

    return content;
  }

  /**
   * Create detailed content for command-based display
   */
  private createDetailedContent(
    rules: CSSRule[],
    selector: string
  ): vscode.MarkdownString {
    const content = new vscode.MarkdownString();

    content.appendText(`# CSS Peak Pro - Rules for "${selector}"\n\n`);
    content.appendText(`Found ${rules.length} CSS rule(s):\n\n`);

    rules.forEach((rule, index) => {
      const fileName = rule.filePath.split(/[\\/]/).pop();
      const relativePath = vscode.workspace.asRelativePath(rule.filePath);

      content.appendText(`## Rule ${index + 1}\n`);
      content.appendText(`**File:** \`${relativePath}\`\n`);
      content.appendText(`**Selector:** \`${rule.selector}\`\n\n`);

      content.appendText("**Properties:**\n");
      content.appendText("```css\n");
      Object.entries(rule.properties).forEach(([property, value]) => {
        content.appendText(`${property}: ${value};\n`);
      });
      content.appendText("```\n\n");

      if (index < rules.length - 1) {
        content.appendText("---\n\n");
      }
    });

    return content;
  }

  /**
   * Create webview content for detailed display
   */
  private createWebviewContent(rules: CSSRule[], selector: string): string {
    const cssContent = rules
      .map((rule, index) => {
        const fileName = rule.filePath.split(/[\\/]/).pop();
        const relativePath = vscode.workspace.asRelativePath(rule.filePath);

        return `
                <div class="rule">
                    <div class="rule-header">
                        <span class="rule-number">Rule ${index + 1}</span>
                        <span class="file-name">${fileName}</span>
                    </div>
                    <div class="rule-details">
                        <div class="selector">${rule.selector}</div>
                        <div class="properties">
                            ${Object.entries(rule.properties)
                              .map(
                                ([prop, value]) => `
                                    <div class="property">
                                        <span class="property-name">${prop}:</span>
                                        <span class="property-value">${value};</span>
                                    </div>
                                `
                              )
                              .join("")}
                        </div>
                    </div>
                </div>
            `;
      })
      .join("");

    return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        margin: 0;
                        padding: 20px;
                        background-color: var(--vscode-editor-background);
                        color: var(--vscode-editor-foreground);
                    }
                    .header {
                        border-bottom: 1px solid var(--vscode-panel-border);
                        padding-bottom: 15px;
                        margin-bottom: 20px;
                    }
                    .header h1 {
                        margin: 0;
                        font-size: 18px;
                        color: var(--vscode-editor-foreground);
                    }
                    .rule {
                        background: var(--vscode-editor-background);
                        border: 1px solid var(--vscode-panel-border);
                        border-radius: 4px;
                        padding: 15px;
                        margin-bottom: 15px;
                    }
                    .rule-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 10px;
                        padding-bottom: 8px;
                        border-bottom: 1px solid var(--vscode-panel-border);
                    }
                    .rule-number {
                        font-weight: bold;
                        color: var(--vscode-button-background);
                    }
                    .file-name {
                        font-size: 12px;
                        color: var(--vscode-descriptionForeground);
                    }
                    .selector {
                        font-family: 'Courier New', monospace;
                        font-weight: bold;
                        margin-bottom: 10px;
                        color: var(--vscode-editor-foreground);
                    }
                    .properties {
                        display: grid;
                        gap: 4px;
                    }
                    .property {
                        display: grid;
                        grid-template-columns: 150px 1fr;
                        gap: 10px;
                        font-family: 'Courier New', monospace;
                        font-size: 13px;
                    }
                    .property-name {
                        color: var(--vscode-symbolIcon-classForeground);
                    }
                    .property-value {
                        color: var(--vscode-editor-foreground);
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>CSS Peak Pro - Rules for "${selector}"</h1>
                    <p>Found ${rules.length} CSS rule(s):</p>
                </div>
                ${cssContent}
            </body>
            </html>
        `;
  }
}
