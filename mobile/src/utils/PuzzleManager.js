import AsyncStorage from '@react-native-async-storage/async-storage';
import pEasy from '../data/puzzles_easy';
import pMedium from '../data/puzzles_medium';
import pHard from '../data/puzzles_hard';

const STORAGE_KEY = 'endgamer_user_progress';

const INITIAL_STATS = {
    solvedPuzzles: [], // Array of IDs
    totalPoints: 0,
    hintsUsed: 0,
    successDelay: 1.5, // Seconds to wait after success
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
        return this.puzzles.find(p => p.id === puzzleId) || null;
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
        const unsolved = this.puzzles.filter(p =>
            p.difficulty === this.currentDifficulty &&
            !solvedSet.has(p.id)
        );

        if (unsolved.length === 0) {
            return null;
        }

        const randomIndex = Math.floor(Math.random() * unsolved.length);
        return unsolved[randomIndex];
    }

    getStats() {
        return {
            totalSolved: this.stats.solvedPuzzles.length,
            totalUnsolved: this.puzzles.length - this.stats.solvedPuzzles.length,
            hintsUsed: this.stats.hintsUsed,
            successDelay: this.stats.successDelay || 1.5
        };
    }

    async setSuccessDelay(seconds) {
        this.stats.successDelay = parseFloat(seconds);
        await this.saveProgress();
    }
}

export default new PuzzleManager();
