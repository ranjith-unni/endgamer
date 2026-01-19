const fs = require('fs');
const path = require('path');

/**
 * ID Manager Utility
 * Scans src/data/puzzles.js to find the next available IDs for each difficulty level.
 * prioritizes filling gaps in the ID sequence.
 */

function getPuzzleData() {
    const puzzlesPath = path.join(__dirname, '../src/data/puzzles.js');
    const content = fs.readFileSync(puzzlesPath, 'utf8');

    // Simple way to extract the array without full environment mock
    const match = content.match(/window\.GAME_DATA\.puzzles\s*=\s*(\[[\s\S]*?\]);/);
    if (!match) throw new Error("Could not find puzzles array in puzzles.js");

    try {
        return JSON.parse(match[1]);
    } catch (e) {
        // If JSON.parse fails due to formatting (like comments or trailing commas), 
        // we can try a more robust approach
        const rawJson = match[1]
            .replace(/\/\/.*$/gm, '') // remove comments
            .replace(/,\s*([\]}])/g, '$1'); // remove trailing commas
        return JSON.parse(rawJson);
    }
}

function findNextIds() {
    const puzzles = getPuzzleData();
    const difficulties = ['easy', 'medium', 'hard'];
    const results = {};

    difficulties.forEach(diff => {
        const ids = puzzles
            .filter(p => p.difficulty === diff)
            .map(p => p.id)
            .sort((a, b) => a - b);

        if (ids.length === 0) {
            // Default starting points if category is empty
            const defaults = { easy: 1, medium: 600, hard: 4000 };
            results[diff] = { next: defaults[diff], isGap: false };
            return;
        }

        // 1. Look for gaps
        let gap = null;
        for (let i = 0; i < ids.length - 1; i++) {
            if (ids[i + 1] !== ids[i] + 1) {
                gap = ids[i] + 1;
                break;
            }
        }

        // Special case: check if we should start at the default min if missing
        const minId = { easy: 1, medium: 600, hard: 4000 }[diff];
        if (ids[0] > minId) {
            results[diff] = { next: minId, isGap: true };
        } else if (gap !== null) {
            results[diff] = { next: gap, isGap: true };
        } else {
            results[diff] = { next: ids[ids.length - 1] + 1, isGap: false };
        }
    });

    return results;
}

// Check if run directly
if (require.main === module) {
    try {
        const nextIds = findNextIds();
        console.log("\n--- Puzzle ID Availability Report ---");
        Object.entries(nextIds).forEach(([diff, info]) => {
            const status = info.isGap ? "[RE-USE GAP]" : "[NEW HIGHEST]";
            console.log(`${diff.toUpperCase().padEnd(8)}: Next ID = ${info.next} ${status}`);
        });
        console.log("-------------------------------------\n");
    } catch (err) {
        console.error("Error managing IDs:", err.message);
    }
}

module.exports = { findNextIds };
