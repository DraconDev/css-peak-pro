const { CSSParser } = require("./out/cssParser");
const path = require("path");
const fs = require("fs");

// Mock VSCode workspace configuration
const vscode = {
    workspace: {
        getConfiguration: () => ({
            get: (key, defaultValue) => defaultValue,
        }),
        getWorkspaceFolder: () => ({
            uri: { fsPath: __dirname },
        }),
    },
    Uri: { file: (f) => ({ fsPath: f }) },
};

// Mock global vscode for the parser
global.vscode = vscode;

async function testSelectorMatching() {
    const parser = new CSSParser();

    // Create a dummy CSS file
    const cssContent = `
    .container { color: red; }
    #header { background: blue; }
    div { margin: 0; }
    `;
    const cssPath = path.join(__dirname, "test.css");
    fs.writeFileSync(cssPath, cssContent);

    try {
        // Test 1: Matching "container" against ".container"
        console.log(
            "Test 1: Matching 'container' (word) against '.container' (CSS)"
        );
        const rules1 = parser.getCSSRulesForSelector(
            "container",
            __dirname + "/test.html"
        );
        console.log(`Found ${rules1.length} rules for 'container'`);
        if (rules1.length === 0)
            console.log("FAIL: Should have found .container rule");
        else console.log("PASS: Found rule");

        // Test 2: Matching ".container" against ".container"
        console.log(
            "\nTest 2: Matching '.container' (explicit class) against '.container' (CSS)"
        );
        const rules2 = parser.getCSSRulesForSelector(
            ".container",
            __dirname + "/test.html"
        );
        console.log(`Found ${rules2.length} rules for '.container'`);

        // Test 3: Matching "header" against "#header"
        console.log(
            "\nTest 3: Matching 'header' (word) against '#header' (CSS)"
        );
        const rules3 = parser.getCSSRulesForSelector(
            "header",
            __dirname + "/test.html"
        );
        console.log(`Found ${rules3.length} rules for 'header'`);
        if (rules3.length === 0)
            console.log("FAIL: Should have found #header rule");
    } finally {
        fs.unlinkSync(cssPath);
    }
}

testSelectorMatching();
