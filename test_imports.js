const Module = require("module");
const originalRequire = Module.prototype.require;

// Mock VSCode workspace configuration
let mockConfig = {
    scopingMode: "smart",
    cssFileExtensions: ["css"],
    enableFallbackToGlobal: false,
    commonDirectories: [],
    fileNamePatterns: [],
};

const mockVscode = {
    workspace: {
        getConfiguration: () => ({
            get: (key, defaultValue) => {
                const configKey = key.replace("cssPeakPro.", "");
                return mockConfig[configKey] !== undefined
                    ? mockConfig[configKey]
                    : defaultValue;
            },
        }),
        getWorkspaceFolder: () => ({
            uri: { fsPath: __dirname },
        }),
    },
    Uri: { file: (f) => ({ fsPath: f }) },
};

// Intercept require calls to return mock vscode
Module.prototype.require = function (path) {
    if (path === "vscode") {
        return mockVscode;
    }
    return originalRequire.apply(this, arguments);
};

const { CSSParser } = require("./out/cssParser");
const path = require("path");
const fs = require("fs");

global.vscode = mockVscode;

function testImports() {
    const parser = new CSSParser();
    const testDir = __dirname;

    // Create dummy files
    const files = ["test_import.html", "linked.css", "other.css"];

    // Create HTML file with link to linked.css
    const htmlContent = `
    <html>
        <head>
            <link rel="stylesheet" href="linked.css">
        </head>
        <body>
            <div class="test"></div>
        </body>
    </html>
    `;

    // Setup files
    files.forEach((f) => {
        const p = path.join(testDir, f);
        if (f === "test_import.html") {
            fs.writeFileSync(p, htmlContent);
        } else {
            fs.writeFileSync(p, ".test { color: red; }");
        }
    });

    try {
        console.log("Testing Smart Import Detection...");

        const foundFiles = parser.findCSSFiles(
            path.join(testDir, "test_import.html")
        );
        const foundBaseNames = foundFiles.map((f) => path.basename(f));
        console.log("Found CSS files:", foundBaseNames);

        const foundLinked = foundBaseNames[0] === "linked.css";
        const foundOther = foundBaseNames.includes("other.css");

        console.log(
            `1. 'linked.css' is FIRST (Priority): ${foundLinked} (Expected: true)`
        );
        console.log(
            `2. 'other.css' is present (Same Folder): ${foundOther} (Expected: true)`
        );
    } finally {
        // Cleanup
        files.forEach((f) => {
            const p = path.join(testDir, f);
            if (fs.existsSync(p)) fs.unlinkSync(p);
        });
    }
}

testImports();
