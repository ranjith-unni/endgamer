const fs = require('fs');
const path = require('path');

const PUZZLES_FILE = path.join(__dirname, '../src/data/puzzles.js');
const DATA_DIR = path.join(__dirname, '../src/data');

function splitPuzzles() {
    const content = fs.readFileSync(PUZZLES_FILE, 'utf8');
    const match = content.match(/window\.GAME_DATA\.puzzles\s*=\s*(\[[\s\S]*?\]);/);
    const puzzles = JSON.parse(match[1]);

    const categories = {
        easy: puzzles.filter(p => p.difficulty === 'easy'),
        medium: puzzles.filter(p => p.difficulty === 'medium'),
        hard: puzzles.filter(p => p.difficulty === 'hard')
    };

    Object.entries(categories).forEach(([diff, data]) => {
        const fileName = `puzzles_${diff}.js`;
        // Each file will EXTEND the global puzzles array
        const fileContent = `window.GAME_DATA = window.GAME_DATA || {};\nwindow.GAME_DATA.puzzles = (window.GAME_DATA.puzzles || []).concat(\n${JSON.stringify(data, null, 4)}\n);\n`;
        fs.writeFileSync(path.join(DATA_DIR, fileName), fileContent, 'utf8');
        console.log(`Created ${fileName} with ${data.length} puzzles.`);
    });
}

splitPuzzles();
