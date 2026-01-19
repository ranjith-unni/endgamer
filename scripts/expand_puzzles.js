const fs = require('fs');
const path = require('path');
const { findNextIds } = require('./id_manager');

const PUZZLES_FILE = path.join(__dirname, '../src/data/puzzles.js');
const SOURCE_FILE = path.join(__dirname, 'source_puzzles.json');

function readCurrentPuzzles() {
    const content = fs.readFileSync(PUZZLES_FILE, 'utf8');
    const match = content.match(/window\.GAME_DATA\.puzzles\s*=\s*(\[[\s\S]*?\]);/);
    // Use an eval-like approach or manual parsing to handle the JS format
    // Since it's basically JSON inside, we'll try to parse it safely
    const rawJson = match[1]
        .replace(/\/\/.*$/gm, '') // remove comments
        .replace(/,\s*([\]}])/g, '$1'); // remove trailing commas
    return JSON.parse(rawJson);
}

function writePuzzles(puzzles) {
    const header = "window.GAME_DATA = window.GAME_DATA || {};\nwindow.GAME_DATA.puzzles = ";
    const footer = ";\n";
    const content = header + JSON.stringify(puzzles, null, 4) + footer;
    fs.writeFileSync(PUZZLES_FILE, content, 'utf8');
}

function processSource() {
    const sourceData = JSON.parse(fs.readFileSync(SOURCE_FILE, 'utf8'));
    const sourcePuzzles = sourceData.problems;

    const existing = readCurrentPuzzles();
    const existingFens = new Set(existing.map(p => p.fen.split(' ')[0])); // use only first part of FEN for better dedupe

    const categories = {
        'easy': { type: 'Mate in One', target: 100, found: [] },
        'medium': { type: 'Mate in Two', target: 100, found: [] },
        'hard': { type: 'Mate in Three', target: 100, found: [] }
    };

    // 1. Deduplicate Existing Puzzles
    console.log(`Initial count: ${existing.length}`);
    const uniqueExisting = [];
    const seenFens = new Set();
    existing.forEach(p => {
        const fenBase = p.fen.split(' ')[0];
        if (!seenFens.has(fenBase)) {
            seenFens.add(fenBase);
            uniqueExisting.push(p);
        } else {
            console.log(`Removed existing duplicate: ${p.id}`);
        }
    });

    // 2. Gather New Puzzles
    for (const p of sourcePuzzles) {
        let diff = null;
        if (p.type === 'Mate in One') diff = 'easy';
        else if (p.type === 'Mate in Two') diff = 'medium';
        else if (p.type === 'Mate in Three') diff = 'hard';

        if (diff && categories[diff].found.length < categories[diff].target) {
            const fenBase = p.fen.split(' ')[0];
            if (!seenFens.has(fenBase)) {
                // Map to our format
                const solution = p.moves.split(';').map(m => m.replace('-', ''));
                categories[diff].found.push({
                    difficulty: diff,
                    fen: p.fen,
                    description: p.first + '. ' + p.type + '.',
                    solution: solution
                });
                seenFens.add(fenBase);
            }
        }
    }

    // 3. Assign IDs using the id_manager logic
    // We'll process them one by one to fill gaps
    const finalPuzzles = [...uniqueExisting];

    ['easy', 'medium', 'hard'].forEach(diff => {
        const newPuzzles = categories[diff].found;
        console.log(`Adding ${newPuzzles.length} new puzzles to ${diff}`);

        newPuzzles.forEach(puzzle => {
            // Find next ID for this difficulty based on current state of finalPuzzles
            const nextId = getNextAvailableId(finalPuzzles, diff);
            puzzle.id = nextId;
            finalPuzzles.push(puzzle);
        });
    });

    // 4. Sort and Save
    finalPuzzles.sort((a, b) => a.id - b.id);
    writePuzzles(finalPuzzles);
    console.log(`Total puzzles now: ${finalPuzzles.length}`);
}

function getNextAvailableId(puzzles, diff) {
    const ids = puzzles
        .filter(p => p.difficulty === diff)
        .map(p => p.id)
        .sort((a, b) => a - b);

    const minId = { easy: 1, medium: 600, hard: 4000 }[diff];

    if (ids.length === 0) return minId;

    // Check for gaps starting from minId
    if (ids[0] > minId) return minId;

    for (let i = 0; i < ids.length - 1; i++) {
        if (ids[i + 1] !== ids[i] + 1) {
            return ids[i] + 1;
        }
    }

    return ids[ids.length - 1] + 1;
}

processSource();
