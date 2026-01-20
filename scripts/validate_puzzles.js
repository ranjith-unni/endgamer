const fs = require('fs');
const path = require('path');
const { Chess } = require('./chess.js');

const DATA_FILES = [
    '../src/data/puzzles_easy.js',
    '../src/data/puzzles_medium.js',
    '../src/data/puzzles_hard.js'
];

/**
 * Validates a single puzzle object.
 * Returns { valid: boolean, reason?: string }
 */
function validatePuzzle(puzzle) {
    let chess;
    try {
        chess = new Chess(puzzle.fen);
    } catch (e) {
        return { valid: false, reason: `Invalid FEN: ${e.message}` };
    }

    const sideToMove = chess.turn(); // 'w' or 'b'
    const description = puzzle.description.toLowerCase();

    // 1. Verify description matches FEN turn
    if (sideToMove === 'w' && !description.includes('white')) {
        return { valid: false, reason: `FEN says white to move, but description is: "${puzzle.description}"` };
    }
    if (sideToMove === 'b' && !description.includes('black')) {
        return { valid: false, reason: `FEN says black to move, but description is: "${puzzle.description}"` };
    }

    // 2. Play the solution moves
    for (const move of puzzle.solution) {
        const result = chess.move(move, { sloppy: true });
        if (!result) {
            return { valid: false, reason: `Invalid move in solution: ${move}` };
        }
    }

    // 3. Verify final state is checkmate
    if (!chess.in_checkmate()) {
        return { valid: false, reason: 'Final state is not checkmate' };
    }

    // 4. Verify the winner matches who was supposed to move first
    // If white started, and it's mate, white won. chess.turn() should be 'b'.
    if (sideToMove === 'w' && chess.turn() !== 'b') {
        return { valid: false, reason: 'White to move, but White did not win (Black turn expected after mate)' };
    }
    if (sideToMove === 'b' && chess.turn() !== 'w') {
        return { valid: false, reason: 'Black to move, but Black did not win (White turn expected after mate)' };
    }

    return { valid: true };
}

/**
 * Processes a single puzzle file.
 */
function processFile(filePath) {
    const fullPath = path.resolve(__dirname, filePath);
    if (!fs.existsSync(fullPath)) {
        console.error(`File not found: ${fullPath}`);
        return null;
    }

    const content = fs.readFileSync(fullPath, 'utf8');

    // Extract array: matches ".concat([ ... ]);"
    const match = content.match(/\.concat\(\s*(\[[\s\S]*\])\s*\);/);
    if (!match) {
        console.error(`Could not find puzzle array in ${filePath}`);
        return null;
    }

    let puzzles;
    try {
        // We use a safe version of JSON.parse by cleaning up comments and trailing commas
        const cleanedJson = match[1]
            .replace(/\/\/.*$/gm, '') // remove comments
            .replace(/,\s*([\]}])/g, '$1'); // remove trailing commas
        puzzles = JSON.parse(cleanedJson);
    } catch (e) {
        console.error(`\nError parsing puzzles in ${filePath}:`, e.message);
        // If JSON extraction fails, we might need a more robust approach (like eval in a restricted context)
        // But for this project, the data is usually clean JSON-like arrays.
        return null;
    }

    const validPuzzles = [];
    const invalidPuzzles = [];

    puzzles.forEach(p => {
        const validation = validatePuzzle(p);
        if (validation.valid) {
            validPuzzles.push(p);
        } else {
            invalidPuzzles.push({ id: p.id, reason: validation.reason });
        }
    });

    if (invalidPuzzles.length > 0) {
        console.log(`\nFile: ${filePath}`);
        console.log(`Found ${invalidPuzzles.length} invalid puzzles:`);
        invalidPuzzles.forEach(inv => console.log(`  ID ${inv.id}: ${inv.reason}`));

        // Save cleaned data back to file
        const newContent = `window.GAME_DATA = window.GAME_DATA || {};\nwindow.GAME_DATA.puzzles = (window.GAME_DATA.puzzles || []).concat(\n${JSON.stringify(validPuzzles, null, 4)}\n);\n`;
        fs.writeFileSync(fullPath, newContent, 'utf8');
        console.log(`Saved ${validPuzzles.length} valid puzzles to ${filePath}.`);
    } else {
        console.log(`\nFile: ${filePath} - All ${puzzles.length} puzzles are valid!`);
    }

    return { total: puzzles.length, invalid: invalidPuzzles.length };
}

// Main execution
console.log("Starting Puzzle Validation...");
const summary = { total: 0, removed: 0 };

DATA_FILES.forEach(file => {
    const result = processFile(file);
    if (result) {
        summary.total += result.total;
        summary.removed += result.invalid;
    }
});

console.log(`\n=====================================`);
console.log(`Validation Summary:`);
console.log(`Total Puzzles Checked: ${summary.total}`);
console.log(`Total Puzzles Removed: ${summary.removed}`);
console.log(`Total Puzzles Remaining: ${summary.total - summary.removed}`);
console.log(`=====================================\n`);
