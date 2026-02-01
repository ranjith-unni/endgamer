const fs = require('fs');
const path = require('path');

const SOURCE_DIR = path.join(__dirname, '../src/data');
const DEST_DIR = path.join(__dirname, '../mobile/src/data');

// Create destination directory if it doesn't exist
if (!fs.existsSync(DEST_DIR)) {
    fs.mkdirSync(DEST_DIR, { recursive: true });
}

function processFile(filename) {
    const sourcePath = path.join(SOURCE_DIR, filename);
    const destPath = path.join(DEST_DIR, filename);

    if (fs.existsSync(sourcePath)) {
        let content = fs.readFileSync(sourcePath, 'utf8');

        // Transform window.GAME_DATA assignment to ES6 export
        // Original: window.GAME_DATA.puzzles = (window.GAME_DATA.puzzles || []).concat([...])
        // We want: export default [...]

        // This regex looks for the array content inside the concat call or assignment
        // It's a bit tricky because the format is specific.
        // Let's assume the files strictly follow the format we saw in view_file.

        // Strategy: 
        // 1. Find the array start `[`
        // 2. Find the end of the file or the matching closing `]`
        // Actually, since the file content is basically JSON inside a JS wrapper,
        // we can try to extract the JSON part.

        // Determine start index by looking for `.concat(` then finding the next `[`
        // The file structure is: ... .concat( ... [ ...

        const concatIndex = content.indexOf('.concat(');
        let arrayStartIndex = -1;

        if (concatIndex !== -1) {
            arrayStartIndex = content.indexOf('[', concatIndex);
        } else {
            // Fallback if structure is different (e.g. direct assignment)
            arrayStartIndex = content.indexOf('[');
            // If first char is `[` but it might be `window.GAME_DATA.puzzles || []`, checking context matters.
            // But usually `[` in `|| []` is before `.concat` so if we didn't find concat, maybe just finding first `[` is risky if `|| []` exists.
            // Let's assume the concat pattern exists as seen in the file.
        }

        const arrayEndIndex = content.lastIndexOf(']');

        if (arrayStartIndex !== -1 && arrayEndIndex !== -1) {
            const jsonContent = content.substring(arrayStartIndex, arrayEndIndex + 1);
            const newContent = `export default ${jsonContent};`;

            fs.writeFileSync(destPath, newContent);
            console.log(`Synced ${filename} to ${destPath}`);
        } else {
            console.error(`Could not parse array in ${filename}`);
        }
    } else {
        console.warn(`Source file ${filename} not found.`);
    }
}

['puzzles_easy.js', 'puzzles_medium.js', 'puzzles_hard.js'].forEach(processFile);
console.log('Puzzle sync complete.');
