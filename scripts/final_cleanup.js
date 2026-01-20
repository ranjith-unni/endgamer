const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../src/data');

function readSplitPuzzles(difficulty) {
    const filePath = path.join(DATA_DIR, `puzzles_${difficulty}.js`);
    if (!fs.existsSync(filePath)) return [];
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const match = content.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (!match) return [];
        return JSON.parse(match[0]);
    } catch (e) {
        console.error(`Error parsing ${filePath}:`, e.message);
        return [];
    }
}

function writeSplitPuzzles(difficulty, puzzles) {
    const fileName = `puzzles_${difficulty}.js`;
    const filePath = path.join(DATA_DIR, fileName);
    const fileContent = `window.GAME_DATA = window.GAME_DATA || {};
window.GAME_DATA.puzzles = (window.GAME_DATA.puzzles || []).concat(${JSON.stringify(puzzles, null, 4)});
`;
    fs.writeFileSync(filePath, fileContent, 'utf8');
}

function cleanup() {
    console.log("Starting global deduplication and renumbering sweep...");

    const categories = ['easy', 'medium', 'hard'];
    const allUnique = [];
    const seenFens = new Set();
    let duplicates = 0;

    categories.forEach(diff => {
        const puzzles = readSplitPuzzles(diff);
        puzzles.forEach(p => {
            const fenBase = p.fen.split(' ')[0];
            if (!seenFens.has(fenBase)) {
                seenFens.add(fenBase);
                allUnique.push(p);
            } else {
                duplicates++;
            }
        });
    });

    console.log(`Global deduplication complete. Removed ${duplicates} duplicates.`);

    // Renumber within categories
    const minIds = { easy: 1, medium: 600, hard: 4000 };

    categories.forEach(diff => {
        const sorted = allUnique
            .filter(p => p.difficulty === diff)
            .sort((a, b) => {
                if (a.id !== undefined && b.id !== undefined) return a.id - b.id;
                return 0;
            });

        sorted.forEach((p, i) => {
            p.id = minIds[diff] + i;
        });

        writeSplitPuzzles(diff, sorted);
        console.log(`Category ${diff.toUpperCase()} finalized with ${sorted.length} puzzles.`);
    });
}

cleanup();
