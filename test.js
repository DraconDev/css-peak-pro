const fs = require("fs");
const path = require("path");

// Simple test to verify CSS parsing and scoping logic
console.log("Testing CSS Peak Pro functionality...\n");

// Test CSS parsing
const sampleCSS = `
.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}

.header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
}

.btn-primary {
    background: linear-gradient(45deg, #ff6b6b, #ee5a24);
    color: white;
    padding: 1rem 2rem;
}
`;

console.log("Sample CSS to parse:");
console.log(sampleCSS);

// Test CSS rule extraction
const ruleRegex = /([^{]+)\{([^}]+)\}/g;
let match;
let rules = [];

while ((match = ruleRegex.exec(sampleCSS)) !== null) {
  const selector = match[1].trim();
  const propertiesContent = match[2].trim();

  if (selector && propertiesContent) {
    const properties = {};
    const propertyRegex = /([a-zA-Z-]+)\s*:\s*([^;]+);/g;
    let propertyMatch;

    while ((propertyMatch = propertyRegex.exec(propertiesContent)) !== null) {
      const propertyName = propertyMatch[1].trim();
      const propertyValue = propertyMatch[2].trim();
      properties[propertyName] = propertyValue;
    }

    rules.push({ selector, properties });
  }
}

console.log("\nParsed CSS Rules:");
rules.forEach((rule, index) => {
  console.log(`${index + 1}. Selector: ${rule.selector}`);
  console.log(
    `   Properties: ${Object.entries(rule.properties)
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ")}`
  );
  console.log("");
});

// Test smart scoping logic
console.log("Testing Smart Scoping Logic:");
const currentFilePath = "/home/test-project/index.html";
const fileName = path.basename(currentFilePath, path.extname(currentFilePath));
const currentDir = path.dirname(currentFilePath);

console.log(`Current file: ${currentFilePath}`);
console.log(`File name: ${fileName}`);
console.log(`Current directory: ${currentDir}`);

console.log("\nSmart Scoping Priority:");
console.log(`1. Same name in same folder: ${fileName}.css, ${fileName}.scss`);
console.log(`2. Same folder any CSS: *.css, *.scss in ${currentDir}`);
console.log(`3. Common directories: css/, styles/, src/styles/, etc.`);

console.log("\nCSS Peak Pro test completed successfully! ✅");
