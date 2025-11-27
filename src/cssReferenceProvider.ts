import * as vscode from "vscode";

export class CSSReferenceProvider implements vscode.ReferenceProvider {
    public provideReferences(
        document: vscode.TextDocument,
        position: vscode.Position,
        context: vscode.ReferenceContext,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.Location[]> {
        const range = document.getWordRangeAtPosition(position);
        if (!range) {
            return null;
        }

        const word = document.getText(range);
        const selector = word; // Simple assumption: word is the class/id name

        console.log(`CSS Peak Pro: Finding references for "${selector}"`);

        return this.findReferencesInWorkspace(selector);
    }

    private async findReferencesInWorkspace(
        selector: string
    ): Promise<vscode.Location[]> {
        const locations: vscode.Location[] = [];

        // Configuration
        const config = vscode.workspace.getConfiguration("cssPeakPro");
        const peekFromLanguages = config.get<string[]>("peekFromLanguages", [
            "html",
            "javascript",
            "typescript",
            "javascriptreact",
            "typescriptreact",
            "vue",
            "php",
        ]);

        // Construct glob pattern for supported files
        // e.g., "**/*.{html,js,ts,jsx,tsx,vue,php}"
        // We need to map language IDs to extensions or just use a broad set of extensions
        // For simplicity, let's use a standard set of web extensions
        const filePattern = "**/*.{html,htm,js,jsx,ts,tsx,vue,php,erb,ejs,hbs}";
        const excludePattern = "**/node_modules/**";

        const files = await vscode.workspace.findFiles(
            filePattern,
            excludePattern
        );

        for (const file of files) {
            try {
                const document = await vscode.workspace.openTextDocument(file);
                const text = document.getText();

                // Regex to find usage of the selector
                // Matches class="... selector ..." or id="selector"
                // This is a basic regex and might need refinement

                // Match class usage: class="..." containing the selector
                // We look for the selector surrounded by word boundaries or spaces within a class attribute
                // Note: This is tricky with regex alone, so we'll do a simpler search first

                const regexes = [
                    // Class attribute: class="..."
                    new RegExp(
                        `class=["'][^"']*\\b${selector}\\b[^"']*["']`,
                        "g"
                    ),
                    // className attribute (React): className="..."
                    new RegExp(
                        `className=["'][^"']*\\b${selector}\\b[^"']*["']`,
                        "g"
                    ),
                    // ID attribute: id="selector"
                    new RegExp(`id=["']${selector}["']`, "g"),
                ];

                for (const regex of regexes) {
                    let match;
                    while ((match = regex.exec(text)) !== null) {
                        // We found a match for the attribute, now find the exact position of the selector within it
                        const matchStart = match.index;
                        const matchText = match[0];
                        const selectorIndex = matchText.indexOf(selector);

                        if (selectorIndex !== -1) {
                            const startPos = document.positionAt(
                                matchStart + selectorIndex
                            );
                            const endPos = document.positionAt(
                                matchStart + selectorIndex + selector.length
                            );
                            locations.push(
                                new vscode.Location(
                                    file,
                                    new vscode.Range(startPos, endPos)
                                )
                            );
                        }
                    }
                }
            } catch (e) {
                console.error(`Error processing file ${file.fsPath}:`, e);
            }
        }

        return locations;
    }
}
