import * as vscode from "vscode";
import { CSSDefinitionProvider } from "./cssDefinitionProvider";
import { CSSParser } from "./cssParser";
import { CSSPeakProProvider } from "./cssPeakProProvider";

export function activate(context: vscode.ExtensionContext) {
  console.log("CSS Peak Pro extension is now active");

  // Initialize the CSS parser
  const cssParser = new CSSParser();

  // Register the hover provider for supported languages
  const hoverProvider = new CSSPeakProProvider(cssParser);
  const hoverProviderRegistration = vscode.languages.registerHoverProvider(
    ["html", "jsx", "tsx", "vue", "rust"],
    hoverProvider
  );

  // Register the definition provider for Ctrl+Click go-to-definition (configurable)
  const config = vscode.workspace.getConfiguration("cssPeakPro");
  const enableGoToDefinition = config.get("enableGoToDefinition", true);

  let definitionProviderRegistration: vscode.Disposable | null = null;

  if (enableGoToDefinition) {
    const definitionProvider = new CSSDefinitionProvider(cssParser);
    definitionProviderRegistration =
      vscode.languages.registerDefinitionProvider(
        ["html", "jsx", "tsx", "vue", "rust"],
        definitionProvider
      );
  }

  // Register the command
  const command = vscode.commands.registerCommand("cssPeakPro.showCSS", () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage("No active editor found");
      return;
    }

    const document = editor.document;
    const selection = editor.selection;

    const text = document.getText(selection);
    if (!text) {
      vscode.window.showWarningMessage("No text selected");
      return;
    }

    hoverProvider.showCSSForSelection(text, selection.start);
  });

  // Add disposables to context
  context.subscriptions.push(hoverProviderRegistration);
  if (definitionProviderRegistration) {
    context.subscriptions.push(definitionProviderRegistration);
  }
  context.subscriptions.push(command);

  // Initialize configuration
  const showInStatusBar = config.get("showInStatusBar", true);

  if (showInStatusBar) {
    // Add status bar item
    const statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );
    statusBarItem.command = "cssPeakPro.showCSS";
    statusBarItem.text = "$(paintcan) CSS Peak Pro";
    statusBarItem.tooltip = "Click to show CSS for selected element";
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);
  }
}

export function deactivate() {
  console.log("CSS Peak Pro extension is now deactivated");
}
