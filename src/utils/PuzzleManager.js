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
        return PuzzleManager.normalizeDescription(unsolved[randomIndex]);
    }

    getPuzzleById(id) {
        const p = this.puzzles.find(p => p.id === parseInt(id));
        return PuzzleManager.normalizeDescription(p);
    }

    // Static helper to swap colors and pieces
    static swapPuzzle(puzzle) {
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
            isSwapped: !puzzle.isSwapped // Toggle if already swapped
        };
    }

    // Helper to normalize description for any puzzle
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

        // 1. Transform Placement
        // Split into rows
        const rows = placement.split('/');
        // Reverse rows (Rank 8 becomes Rank 1, etc.)
        const reversedRows = rows.reverse();
        // Swap case of every piece
        const transformedRows = reversedRows.map(row => {
            return row.split('').map(char => {
                if (/[a-z]/.test(char)) return char.toUpperCase();
                if (/[A-Z]/.test(char)) return char.toLowerCase();
                return char;
            }).join('');
        });
        const newPlacement = transformedRows.join('/');

        // 2. Transform Active Color
        const newActiveColor = activeColor === 'w' ? 'b' : 'w';

        // 3. Transform Castling
        // K <-> k, Q <-> q. 
        // Example: KQkq -> kqSQ -> (sort?) -> KQkq.
        // Actually, logic is: convert case, then sort usually? 
        // Standard FEN usually has K Q k q order.
        let newCastling = '-';
        if (castling !== '-') {
            newCastling = castling.split('').map(char => {
                if (/[a-z]/.test(char)) return char.toUpperCase();
                return char.toLowerCase();
            }).join('');
            // Optional: Sort to keep canonical FEN (K Q k q)
            // But chess.js might not care about order.
        }

        // 4. Transform En Passant
        // e3 -> e6. Rank = 9 - Rank.
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
        // move is like "e2e4" or "a7a8q"
        // Transform ranks: 1->8, 2->7, 3->6, 4->5, 5->4, 6->3, 7->2, 8->1.
        // Formula: NewRank = 9 - OldRank.

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
}
