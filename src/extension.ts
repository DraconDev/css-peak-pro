import * as vscode from "vscode";
import { CSSDefinitionProvider } from "./cssDefinitionProvider";
import { CSSParser } from "./cssParser";
import { CSSPeakProProvider } from "./cssPeakProProvider";

export function activate(context: vscode.ExtensionContext) {
  console.log("CSS Peak Pro extension is now ACTIVE");

  // Get configuration
  const config = vscode.workspace.getConfiguration("cssPeakPro");
  const enabled = config.get("enabled", true);
  console.log(`CSS Peak Pro: Extension enabled = ${enabled}`);

  // If extension is disabled, return early
  if (!enabled) {
    console.log("CSS Peak Pro is disabled in settings");
    return;
  }

  // Initialize the CSS parser
  const cssParser = new CSSParser();
  console.log("CSS Peak Pro: CSS parser initialized");

  // Get supported languages from configuration
  const supportedLanguages: string[] = config.get("peekFromLanguages", [
    "html",
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact",
    "vue",
    "rust",
  ]);
  console.log(
    `CSS Peak Pro: Registered for languages: ${supportedLanguages.join(", ")}`
  );

  // Register the hover provider for supported languages
  const hoverProvider = new CSSPeakProProvider(cssParser);
  const hoverProviderRegistration = vscode.languages.registerHoverProvider(
    supportedLanguages,
    hoverProvider
  );
  console.log("CSS Peak Pro: Hover provider registered");

  // Register the definition provider for Ctrl+Click go-to-definition (configurable)
  const enableGoToDefinition = config.get("enableGoToDefinition", true);
  console.log(
    `CSS Peak Pro: Go-to-definition enabled = ${enableGoToDefinition}`
  );

  let definitionProviderRegistration: vscode.Disposable | null = null;

  if (enableGoToDefinition) {
    const definitionProvider = new CSSDefinitionProvider(cssParser);
    definitionProviderRegistration =
      vscode.languages.registerDefinitionProvider(
        supportedLanguages,
        definitionProvider
      );
    console.log("CSS Peak Pro: Definition provider registered");
  } else {
    console.log("CSS Peak Pro: Definition provider disabled");
  }

  // Add disposables to context
  context.subscriptions.push(hoverProviderRegistration);
  if (definitionProviderRegistration) {
    context.subscriptions.push(definitionProviderRegistration);
  }

  // Initialize configuration and watch for changes
  const showInStatusBar = config.get("showInStatusBar", false);

  if (showInStatusBar) {
    // Add status bar item
    const statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );
    statusBarItem.text = "$(paintcan) CSS Peak Pro";
    statusBarItem.tooltip =
      "CSS Peak Pro - Enhanced CSS navigation with smart scoping";
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);
    console.log("CSS Peak Pro: Status bar item added");
  }

  // Watch for configuration changes to dynamically update language support
  const configurationChange = vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration("cssPeakPro")) {
      console.log("CSS Peak Pro configuration changed, reloading...");
      vscode.commands.executeCommand("workbench.action.reloadWindow");
    }
  });

  context.subscriptions.push(configurationChange);

  console.log(
    `CSS Peak Pro activated successfully for languages: ${supportedLanguages.join(
      ", "
    )}`
  );
}

export function deactivate() {
  console.log("CSS Peak Pro extension is now deactivated");
}
