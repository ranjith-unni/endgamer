// Removed import, accessing global window.GAME_DATA.puzzles

window.PuzzleManager = class PuzzleManager {
    constructor() {
        this.puzzles = [];
        this.currentDifficulty = 'easy';
        this.solvedPuzzles = new Set(this.loadSolvedFromStorage());
    }

    loadSolvedFromStorage() {
        const stored = localStorage.getItem('endgamer_solved_puzzles');
        return stored ? JSON.parse(stored) : [];
    }

    saveSolvedToStorage() {
        localStorage.setItem('endgamer_solved_puzzles', JSON.stringify([...this.solvedPuzzles]));
    }

    async loadPuzzles() {
        this.puzzles = window.GAME_DATA.puzzles;
        console.log('Puzzles loaded:', this.puzzles.length);
    }

    setDifficulty(level) {
        this.currentDifficulty = level;
    }

    markAsSolved(id) {
        this.solvedPuzzles.add(id);
        this.saveSolvedToStorage();
    }

    clearSolved() {
        this.solvedPuzzles.clear();
        this.saveSolvedToStorage();
    }

    getNextPuzzle() {
        const unsolved = this.puzzles.filter(p =>
            p.difficulty === this.currentDifficulty &&
            !this.solvedPuzzles.has(p.id)
        );

        if (unsolved.length === 0) {
            // Option: If all solved, reset for this difficulty or return null
            // For now, return null to show "No more puzzles"
            return null;
        }

        // Return a random unsolved puzzle instead of sequential
        const randomIndex = Math.floor(Math.random() * unsolved.length);
        return unsolved[randomIndex];
    }

    getPuzzleById(id) {
        return this.puzzles.find(p => p.id === parseInt(id));
    }
}
