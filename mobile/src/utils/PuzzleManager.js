import AsyncStorage from '@react-native-async-storage/async-storage';
import pEasy from '../data/puzzles_easy';
import pMedium from '../data/puzzles_medium';
import pHard from '../data/puzzles_hard';

const STORAGE_KEY = 'endgamer_user_progress';

const INITIAL_STATS = {
    solvedPuzzles: [], // Array of IDs
    totalPoints: 0,
    hintsUsed: 0,
    successDelay: 1.0, // Seconds to wait after success
    randomSwapEnabled: false,
};

class PuzzleManager {
    constructor() {
        this.puzzles = [];
        this.currentDifficulty = 'easy';
        this.stats = { ...INITIAL_STATS };
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;

        // Combine all puzzles for easier lookups
        this.puzzles = [...pEasy, ...pMedium, ...pHard];

        await this.loadProgress();
        this.initialized = true;
        console.log('PuzzleManager initialized', this.puzzles.length, 'puzzles');
    }

    getPuzzleById(id) {
        const puzzleId = parseInt(id);
        const p = this.puzzles.find(p => p.id === puzzleId) || null;
        return PuzzleManager.normalizeDescription(p);
    }

    async loadProgress() {
        try {
            const stored = await AsyncStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                // Ensure backward compatibility or merge with defaults
                this.stats = { ...INITIAL_STATS, ...parsed };
                // Ensure solvedPuzzles comes back as array, convert Set if needed logic appled
            }
        } catch (e) {
            console.error('Failed to load progress', e);
        }
    }

    async saveProgress() {
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.stats));
        } catch (e) {
            console.error('Failed to save progress', e);
        }
    }

    setDifficulty(level) {
        this.currentDifficulty = level;
    }

    async markAsSolved(id) {
        if (!this.stats.solvedPuzzles.includes(id)) {
            this.stats.solvedPuzzles.push(id);
            // Simple scoring: 10 points per puzzle
            this.stats.totalPoints += 10;
            await this.saveProgress();
        }
    }

    async incrementHints() {
        this.stats.hintsUsed += 1;
        await this.saveProgress();
    }

    async resetProgress() {
        this.stats = { ...INITIAL_STATS };
        await this.saveProgress();
    }

    getNextPuzzle() {
        const solvedSet = new Set(this.stats.solvedPuzzles);
        // Debugging logs
        /*
        console.log(`Getting puzzle for difficulty: ${this.currentDifficulty}`);
        console.log(`Total Puzzles in memory: ${this.puzzles.length}`);
        */

        const unsolved = this.puzzles.filter(p =>
            p.difficulty === this.currentDifficulty &&
            !solvedSet.has(p.id)
        );

        if (unsolved.length === 0) {
            console.log(`No puzzles found for difficulty: ${this.currentDifficulty}`);
            console.log(`Solved Count: ${solvedSet.size}`);
            // Check if ALL puzzles of this difficulty are solved
            const totalForDiff = this.puzzles.filter(p => p.difficulty === this.currentDifficulty).length;
            console.log(`Total for difficulty: ${totalForDiff}`);

            return null;
        }

        const randomIndex = Math.floor(Math.random() * unsolved.length);
        const selected = unsolved[randomIndex];
        // console.log(`Selected puzzle ID: ${selected.id}`);
        return PuzzleManager.normalizeDescription(selected);
    }

    // Instance method to swap colors and pieces
    swapPuzzle(puzzle) {
        if (!puzzle) return null;

        const newFen = PuzzleManager.transformFen(puzzle.fen);
        const newSolution = puzzle.solution.map(move => PuzzleManager.transformMove(move));

        let newDesc = puzzle.description || "";
        // Normalize "Move" to "move"
        newDesc = newDesc.replace(/Move/g, "move");

        if (newDesc.includes("White")) {
            newDesc = newDesc.replace("White", "Black");
        } else if (newDesc.includes("Black")) {
            newDesc = newDesc.replace("Black", "White");
        }

        return {
            ...puzzle,
            fen: newFen,
            solution: newSolution,
            description: newDesc,
            isSwapped: !puzzle.isSwapped
        };
    }

    static normalizeDescription(puzzle) {
        if (!puzzle || !puzzle.description) return puzzle;
        return {
            ...puzzle,
            description: puzzle.description.replace(/Move/g, "move")
        };
    }

    static transformFen(fen) {
        const parts = fen.split(' ');
        const placement = parts[0];
        const activeColor = parts[1];
        const castling = parts[2];
        const enPassant = parts[3];
        const halfMove = parts[4];
        const fullMove = parts[5];

        const rows = placement.split('/');
        const reversedRows = rows.reverse();
        const transformedRows = reversedRows.map(row => {
            return row.split('').map(char => {
                if (/[a-z]/.test(char)) return char.toUpperCase();
                if (/[A-Z]/.test(char)) return char.toLowerCase();
                return char;
            }).join('');
        });
        const newPlacement = transformedRows.join('/');
        const newActiveColor = activeColor === 'w' ? 'b' : 'w';

        let newCastling = '-';
        if (castling !== '-') {
            newCastling = castling.split('').map(char => {
                if (/[a-z]/.test(char)) return char.toUpperCase();
                return char.toLowerCase();
            }).join('');
        }

        let newEnPassant = '-';
        if (enPassant !== '-') {
            const file = enPassant[0];
            const rank = parseInt(enPassant[1]);
            const newRank = 9 - rank;
            newEnPassant = file + newRank;
        }

        return `${newPlacement} ${newActiveColor} ${newCastling} ${newEnPassant} ${halfMove} ${fullMove}`;
    }

    static transformMove(move) {
        const transformSquare = (sq) => {
            const file = sq[0];
            const rank = parseInt(sq[1]);
            return `${file}${9 - rank}`;
        };
        const from = transformSquare(move.substring(0, 2));
        const to = transformSquare(move.substring(2, 4));
        const promotion = move.length > 4 ? move.substring(4) : "";
        return from + to + promotion;
    }

    getStats() {
        return {
            totalSolved: this.stats.solvedPuzzles.length,
            totalUnsolved: this.puzzles.length - this.stats.solvedPuzzles.length,
            hintsUsed: this.stats.hintsUsed,
            successDelay: this.stats.successDelay || 1.0,
            randomSwapEnabled: !!this.stats.randomSwapEnabled
        };
    }

    async setSuccessDelay(seconds) {
        this.stats.successDelay = parseFloat(seconds);
        await this.saveProgress();
    }

    async setRandomSwapEnabled(enabled) {
        this.stats.randomSwapEnabled = !!enabled;
        await this.saveProgress();
    }

    isRandomSwapEnabled() {
        return !!this.stats.randomSwapEnabled;
    }
}

export default new PuzzleManager();
