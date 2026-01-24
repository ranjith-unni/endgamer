const fs = require('fs');
const path = require('path');
const { validatePuzzle } = require('./validate_puzzles.js');

const DATA_FILES = [
    '../src/data/puzzles_easy.js',
    '../src/data/puzzles_medium.js',
    '../src/data/puzzles_hard.js'
];

let totalValid = 0;
let totalInvalid = 0;
const errors = [];

function testFile(filePath) {
    const fullPath = path.resolve(__dirname, filePath);
    if (!fs.existsSync(fullPath)) {
        errors.push(`File not found: ${fullPath}`);
        return;
    }

    const content = fs.readFileSync(fullPath, 'utf8');
    const match = content.match(/\.concat\(\s*(\[[\s\S]*\])\s*\);/);

    if (!match) {
        errors.push(`Could not find puzzle array in ${filePath}`);
        return;
    }

    let puzzles;
    try {
        const cleanedJson = match[1]
            .replace(/\/\/.*$/gm, '')
            .replace(/,\s*([\]}])/g, '$1');
        puzzles = JSON.parse(cleanedJson);
    } catch (e) {
        errors.push(`Error parsing puzzles in ${filePath}: ${e.message}`);
        return;
    }

    console.log(`Testing ${filePath} (${puzzles.length} puzzles)...`);

    puzzles.forEach(p => {
        const validation = validatePuzzle(p);
        if (validation.valid) {
            totalValid++;
        } else {
            totalInvalid++;
            errors.push(`File ${filePath} | ID ${p.id}: ${validation.reason}`);
        }
    });
}

console.log("--- Starting Puzzle Integration Test ---");

DATA_FILES.forEach(testFile);

console.log("\n--- Test Results ---");
console.log(`Puzzles Passed: ${totalValid}`);
console.log(`Puzzles Failed: ${totalInvalid}`);

if (errors.length > 0) {
    console.error("\nFAIL: Validation errors found:");
    errors.forEach(err => console.error(`  - ${err}`));
    process.exit(1);
} else {
    console.log("\nPASS: All puzzles are valid!");
    process.exit(0);
}
