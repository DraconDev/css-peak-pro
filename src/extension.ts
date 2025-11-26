import * as vscode from "vscode";
import { CSSParser } from "./cssParser";
import { CSSPeakProProvider } from "./cssPeakProProvider";

export function activate(context: vscode.ExtensionContext) {
  console.log("CSS Peak Pro extension is now active");

  // Initialize the CSS parser
  const cssParser = new CSSParser();

  // Register the hover provider for supported languages
  const hoverProvider = new CSSPeakProProvider(cssParser);

  const hoverProviderRegistration = vscode.languages.registerHoverProvider(
    ["html", "jsx", "tsx", "vue"],
    hoverProvider
  );

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
  context.subscriptions.push(command);

  // Initialize configuration
  const config = vscode.workspace.getConfiguration("cssPeakPro");
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
