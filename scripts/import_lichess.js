const fs = require('fs');
const path = require('path');
const Chess = require('./chess.js').Chess;

const PUZZLES_FILE = path.join(__dirname, '../src/data/puzzles.js');
const M2_FILE = path.join(__dirname, 'mateIn2.csv');
const M3_FILE = path.join(__dirname, 'mateIn3.csv');

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

function parseCsv(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const puzzles = [];

    // Split by the start of a puzzle entry
    // The file seems to start with " [Event ""Puzzle""]
    const records = content.split(/\[Event\s+""Puzzle""\]/g);

    console.log(`Split file into ${records.length} potential records.`);

    for (let record of records) {
        if (!record.trim()) continue;

        // Extract FEN
        const fenMatch = record.match(/\[FEN\s+""(.+?)""\]/);
        if (!fenMatch) continue;
        const fen = fenMatch[1];

        // Extract moves - look for the move list after [SetUp ""1""]
        // The move list typically follows a blank line or starts with a move number
        const setupMatch = record.split(/\[SetUp\s+""1""\]/);
        if (setupMatch.length < 2) continue;

        // Moves are in setupMatch[1] before the closing quote or end of string
        // Usually it's like: \n\n27. Qxe6 ... *"
        const movePart = setupMatch[1].split('*"')[0].trim();

        // Clean move numbers like "27." "27..." "28."
        const sanMoves = movePart
            .replace(/\d+\.+/g, ' ')
            .replace(/\*/g, '')
            .trim()
            .split(/\s+/)
            .filter(m => m.length > 1);

        if (sanMoves.length < 2) {
            // console.log("Skipping record with insufficient moves:", movePart);
            continue;
        }

        try {
            const lanMoves = convertSanToLan(fen, sanMoves);
            puzzles.push({
                difficulty: 'hard',
                fen: fen,
                description: `White to move. Mate in Three.`,
                solution: lanMoves
            });
        } catch (e) {
            // console.log(`Error converting moves for FEN ${fen}: ${e.message}`);
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
        if (!move) throw new Error(`Invalid move: ${san} in ${fen}`);
        lanMoves.push(move.from + move.to + (move.promotion || ''));
    }
    return lanMoves;
}

function importPuzzles() {
    console.log("Reading existing puzzles...");
    const existing = readCurrentPuzzles();
    const seenFens = new Set(existing.map(p => p.fen.split(' ')[0]));

    console.log(`Initial count: ${existing.length}`);

    if (!fs.existsSync(M3_FILE)) {
        console.error("mateIn3.csv not found. Please download it first.");
        return;
    }

    console.log("Parsing mateIn3.csv...");
    const m3Puzzles = parseCsv(M3_FILE);
    console.log(`Found ${m3Puzzles.length} valid hard puzzles in source.`);

    const newPuzzles = [];
    let count = 0;
    const target = 1000;

    for (const p of m3Puzzles) {
        if (count >= target) break;
        const fenBase = p.fen.split(' ')[0];
        if (!seenFens.has(fenBase)) {
            newPuzzles.push(p);
            seenFens.add(fenBase);
            count++;
        }
    }

    console.log(`Adding ${newPuzzles.length} new unique Hard puzzles.`);

    const finalPuzzles = [...existing];

    newPuzzles.forEach(puzzle => {
        const nextId = getNextAvailableId(finalPuzzles, 'hard');
        puzzle.id = nextId;
        finalPuzzles.push(puzzle);
    });

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
    if (ids[0] > minId) return minId;

    for (let i = 0; i < ids.length - 1; i++) {
        if (ids[i + 1] !== ids[i] + 1) {
            return ids[i] + 1;
        }
    }
    return ids[ids.length - 1] + 1;
}

importPuzzles();
