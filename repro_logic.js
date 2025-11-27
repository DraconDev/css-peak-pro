function selectorMatches(cssSelector, elementSelector) {
    const cleanCssSelector = cssSelector.toLowerCase().trim();
    const cleanElementSelector = elementSelector.toLowerCase().trim();

    // Exact match
    if (cleanCssSelector === cleanElementSelector) {
        return true;
    }

    // Class selector matching
    const classMatches = cleanElementSelector.match(/\.([a-zA-Z0-9-_]+)/g);
    if (classMatches) {
        for (const classMatch of classMatches) {
            const className = classMatch.substring(1);
            if (
                cleanCssSelector.includes(`.${className}`) ||
                cleanCssSelector.includes(`[class*="${className}"]`) ||
                cleanCssSelector.includes(`[class~="${className}"]`)
            ) {
                return true;
            }
        }
    }

    // ID selector matching
    const idMatches = cleanElementSelector.match(/#([a-zA-Z0-9-_]+)/g);
    if (idMatches) {
        for (const idMatch of idMatches) {
            const idName = idMatch.substring(1);
            if (cleanCssSelector.includes(`#${idName}`)) {
                return true;
            }
        }
    }

    // Element selector matching
    const elementMatch = cleanElementSelector.match(/^([a-zA-Z][a-zA-Z0-9]*)/);
    if (elementMatch) {
        const elementName = elementMatch[1];
        if (
            cleanCssSelector.includes(elementName) &&
            !cleanCssSelector.includes(".")
        ) {
            return true;
        }
    }

    return false;
}

console.log("Testing selectorMatches logic:");

// Test 1: Hovering "container" (word) vs ".container" (CSS)
// The word "container" is passed as elementSelector
const match1 = selectorMatches(".container", "container");
console.log(`1. '.container' vs 'container': ${match1} (Expected: true)`);

// Test 2: Hovering "header" (word) vs "#header" (CSS)
const match2 = selectorMatches("#header", "header");
console.log(`2. '#header' vs 'header': ${match2} (Expected: true)`);

// Test 3: Hovering "div" (word) vs "div" (CSS)
const match3 = selectorMatches("div", "div");
console.log(`3. 'div' vs 'div': ${match3} (Expected: true)`);

// Test 4: Hovering ".container" (explicit) vs ".container" (CSS)
const match4 = selectorMatches(".container", ".container");
console.log(`4. '.container' vs '.container': ${match4} (Expected: true)`);
