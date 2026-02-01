const fs = require('fs');
const path = require('path');
const https = require('https');

const PIECE_URLS = {
    w: {
        p: 'https://upload.wikimedia.org/wikipedia/commons/4/45/Chess_plt45.svg',
        n: 'https://upload.wikimedia.org/wikipedia/commons/7/70/Chess_nlt45.svg',
        b: 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Chess_blt45.svg',
        r: 'https://upload.wikimedia.org/wikipedia/commons/7/72/Chess_rlt45.svg',
        q: 'https://upload.wikimedia.org/wikipedia/commons/1/15/Chess_qlt45.svg',
        k: 'https://upload.wikimedia.org/wikipedia/commons/4/42/Chess_klt45.svg',
    },
    b: {
        p: 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Chess_pdt45.svg',
        n: 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Chess_ndt45.svg',
        b: 'https://upload.wikimedia.org/wikipedia/commons/9/98/Chess_bdt45.svg',
        r: 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Chess_rdt45.svg',
        q: 'https://upload.wikimedia.org/wikipedia/commons/4/47/Chess_qdt45.svg',
        k: 'https://upload.wikimedia.org/wikipedia/commons/f/f0/Chess_kdt45.svg',
    }
};

const OUTPUT_FILE = path.join(__dirname, '../mobile/src/assets/PieceSVGs.js');
const OUTPUT_DIR = path.dirname(OUTPUT_FILE);

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function fetchSvg(url) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
            if (res.statusCode !== 200) {
                reject(new Error(`Failed to fetch ${url}: ${res.statusCode}`));
                return;
            }
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

async function generateAssets() {
    console.log('Downloading SVGs...');
    const pieces = {};

    for (const color of ['w', 'b']) {
        pieces[color] = {};
        for (const type of ['p', 'n', 'b', 'r', 'q', 'k']) {
            const url = PIECE_URLS[color][type];
            console.log(`Fetching ${color}${type}...`);
            try {
                let svg = await fetchSvg(url);
                // Inject viewBox if missing, assuming standard 45x45 from Wikipedia for these assets is consistent
                // or just replace the opening tag to ensure it has what we need
                if (!svg.includes('viewBox')) {
                    svg = svg.replace(/width="45"\s+height="45"/, 'width="45" height="45" viewBox="0 0 45 45"');
                }
                pieces[color][type] = svg;
            } catch (e) {
                console.error(`Error downloading ${color}${type}:`, e.message);
            }
        }
    }

    const fileContent = `export const PIECE_XML = ${JSON.stringify(pieces, null, 2)};`;
    fs.writeFileSync(OUTPUT_FILE, fileContent);
    console.log(`Generated ${OUTPUT_FILE}`);
}

generateAssets();
