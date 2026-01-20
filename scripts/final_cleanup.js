const fs = require('fs');
const path = require('path');

const PUZZLES_FILE = path.join(__dirname, '../src/data/puzzles.js');

function readCurrentPuzzles() {
    const content = fs.readFileSync(PUZZLES_FILE, 'utf8');
    const match = content.match(/window\.GAME_DATA\.puzzles\s*=\s*(\[[\s\S]*?\]);/);
    const rawJson = match[1]
        .replace(/\/\/.*$/gm, '')
        .replace(/,\s*([\]}])/g, '$1');
    return JSON.parse(rawJson);
}

function writePuzzles(puzzles) {
    const header = "window.GAME_DATA = window.GAME_DATA || {};\nwindow.GAME_DATA.puzzles = ";
    const footer = ";\n";
    const content = header + JSON.stringify(puzzles, null, 4) + footer;
    fs.writeFileSync(PUZZLES_FILE, content, 'utf8');
}

function cleanup() {
    const puzzles = readCurrentPuzzles();
    console.log(`Initial total: ${puzzles.length}`);

    // 1. Deduplicate by FEN base
    const seenFens = new Set();
    const uniquePuzzles = [];
    let duplicates = 0;

    puzzles.forEach(p => {
        const fenBase = p.fen.split(' ')[0];
        if (!seenFens.has(fenBase)) {
            seenFens.add(fenBase);
            uniquePuzzles.push(p);
        } else {
            duplicates++;
        }
    });

    console.log(`Removed ${duplicates} duplicates.`);

    // 2. Renumber sequentially within difficulty categories to preserve user logic
    const easy = uniquePuzzles.filter(p => p.difficulty === 'easy').sort((a, b) => a.id - b.id);
    const medium = uniquePuzzles.filter(p => p.difficulty === 'medium').sort((a, b) => a.id - b.id);
    const hard = uniquePuzzles.filter(p => p.difficulty === 'hard').sort((a, b) => a.id - b.id);

    console.log(`Counts: Easy=${easy.length}, Medium=${medium.length}, Hard=${hard.length}`);

    easy.forEach((p, i) => p.id = 1 + i);
    medium.forEach((p, i) => p.id = 600 + i);
    hard.forEach((p, i) => p.id = 4000 + i);

    const finalPuzzles = [...easy, ...medium, ...hard];
    writePuzzles(finalPuzzles);
    console.log(`Final total: ${finalPuzzles.length}`);
}

cleanup();
