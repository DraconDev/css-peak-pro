#!/usr/bin/env node

/**
 * Build script for CSS Peak Pro
 * Compiles TypeScript, copies assets, and prepares for packaging
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

console.log("🚀 Starting CSS Peak Pro build process...\n");

// Step 1: Clean previous build
console.log("📁 Cleaning previous build...");
if (fs.existsSync("out")) {
  fs.rmSync("out", { recursive: true, force: true });
  console.log("✅ Cleaned out/ directory");
}

// Step 2: Compile TypeScript
console.log("\n🔨 Compiling TypeScript...");
try {
  execSync("npm run compile", { stdio: "inherit" });
  console.log("✅ TypeScript compilation successful");
} catch (error) {
  console.error("❌ TypeScript compilation failed");
  process.exit(1);
}

// Step 3: Verify critical files exist
console.log("\n🔍 Verifying build artifacts...");
const requiredFiles = [
  "out/extension.js",
  "out/cssParser.js",
  "out/cssPeakProProvider.js",
];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) {
    console.error(`❌ Missing required file: ${file}`);
    process.exit(1);
  }
}
console.log("✅ All required files present");

// Step 4: Generate package information
console.log("\n📦 Generating package information...");
const packageInfo = {
  name: "css-peak-pro",
  version: "1.0.0",
  buildTime: new Date().toISOString(),
  commit: process.env.GIT_COMMIT || "unknown",
  files: requiredFiles,
};

fs.writeFileSync("out/package-info.json", JSON.stringify(packageInfo, null, 2));
console.log("✅ Package information generated");

// Step 5: Create distribution summary
console.log("\n📊 Build Summary:");
console.log(`   Extension Name: ${packageInfo.name}`);
console.log(`   Version: ${packageInfo.version}`);
console.log(`   Build Time: ${packageInfo.buildTime}`);
console.log(`   Output Directory: out/`);

console.log("\n🎉 CSS Peak Pro build completed successfully!");
console.log("\n📋 Next steps:");
console.log("   1. Open VSCode Extension Development Host: Press F5");
console.log("   2. Test the extension with test-project/ files");
console.log("   3. Package for distribution: npm run package");
