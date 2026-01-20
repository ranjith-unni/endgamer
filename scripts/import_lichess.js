const fs = require('fs');
const path = require('path');
const Chess = require('./chess.js').Chess;

const DATA_DIR = path.join(__dirname, '../src/data');
const M2_FILE = path.join(__dirname, 'mateIn2.csv');

function readSplitPuzzles(difficulty) {
    const filePath = path.join(DATA_DIR, `puzzles_${difficulty}.js`);
    if (!fs.existsSync(filePath)) return [];
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        // Look for the array inside the concat or direct assignment
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
    // Overwrite with a clean structure
    const fileContent = `window.GAME_DATA = window.GAME_DATA || {};
window.GAME_DATA.puzzles = (window.GAME_DATA.puzzles || []).concat(${JSON.stringify(puzzles, null, 4)});
`;
    fs.writeFileSync(filePath, fileContent, 'utf8');
}

function parseCsv(filePath, difficulty) {
    if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        return [];
    }
    const content = fs.readFileSync(filePath, 'utf8');
    const puzzles = [];

    // Split by the event tag, which is consistently at the start of a record
    const records = content.split(/\[Event\s+""Puzzle""\]/);
    console.log(`Found ${records.length - 1} potential records in ${path.basename(filePath)}`);

    for (let record of records) {
        if (!record.trim()) continue;

        // FEN is in [FEN ""...""]
        const fenMatch = record.match(/\[FEN\s+""(.+?)""\]/);
        if (!fenMatch) continue;
        const fen = fenMatch[1];

        // Moves are after [SetUp ""1""]
        const setupMatch = record.split(/\[SetUp\s+""1""\]/);
        if (setupMatch.length < 2) continue;

        // Moves are before the closing quote block
        const movePart = setupMatch[1].split('*"')[0].trim();

        const sanMoves = movePart
            .replace(/\d+\.+/g, ' ')
            .replace(/\*/g, '')
            .trim()
            .split(/\s+/)
            .filter(m => m.length > 1);

        if (sanMoves.length < 2) continue;

        try {
            const lanMoves = convertSanToLan(fen, sanMoves);
            puzzles.push({
                difficulty: difficulty,
                fen: fen,
                description: `White to move. Mate in ${difficulty === 'medium' ? 'Two' : 'Three'}.`,
                solution: lanMoves
            });
        } catch (e) {
            continue;
        }
    }
    return puzzles;
}

function convertSanToLan(fen, sanMoves) {
    const chess = new Chess(fen);
    const lanMoves = [];
    for (let san of sanMoves) {
        if (!san) continue;
        const move = chess.move(san);
        if (!move) throw new Error(`Invalid move: ${san}`);
        lanMoves.push(move.from + move.to + (move.promotion || ''));
    }
    return lanMoves;
}

function importPuzzles() {
    // We want to add 1000 Medium puzzles
    const difficulty = 'medium';
    console.log(`Importing to ${difficulty}...`);

    // Load ALL existing fens for robust deduplication across categories
    const allPuzzles = [
        ...readSplitPuzzles('easy'),
        ...readSplitPuzzles('medium'),
        ...readSplitPuzzles('hard')
    ];
    const seenFens = new Set(allPuzzles.map(p => p.fen.split(' ')[0]));
    console.log(`Existing library size (all): ${allPuzzles.length}`);

    const newSource = parseCsv(M2_FILE, difficulty);
    console.log(`Found ${newSource.length} potential puzzles in CSV.`);

    const toAdd = [];
    const target = 1000;
    for (const p of newSource) {
        if (toAdd.length >= target) break;
        const fenBase = p.fen.split(' ')[0];
        if (!seenFens.has(fenBase)) {
            toAdd.push(p);
            seenFens.add(fenBase);
        }
    }
    console.log(`Adding ${toAdd.length} new unique unique Medium puzzles.`);

    const existingMedium = readSplitPuzzles('medium');
    const finalMedium = [...existingMedium, ...toAdd];

    // final_cleanup.js will handle renumbering, but let's just write them for now
    writeSplitPuzzles('medium', finalMedium);
    console.log(`Medium category now has ${finalMedium.length} puzzles.`);
}

importPuzzles();
