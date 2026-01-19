// Imports removed, using globals: window.ChessBoard, window.PuzzleManager

// Import Chess from CDN global
// In module, we can access window.Chess
class App {
    constructor() {
        this.game = new window.Chess();
        this.puzzleManager = new window.PuzzleManager();
        this.board = new window.ChessBoard('board', this.handleMove.bind(this));

        this.currentPuzzle = null;
        this.puzzleMoves = []; // Expected moves
        this.moveIndex = 0;
        this.lastHintMoveIndex = -1; // Track which move index last received a hint

        this.score = this.loadScore();

        this.init();
    }

    loadScore() {
        const solvedCount = localStorage.getItem('endgamer_solved_count');
        const hintCount = localStorage.getItem('endgamer_hint_count');
        return {
            solved: solvedCount ? parseInt(solvedCount) : 0,
            hints: hintCount ? parseInt(hintCount) : 0
        };
    }

    saveScore() {
        localStorage.setItem('endgamer_solved_count', this.score.solved);
        localStorage.setItem('endgamer_hint_count', this.score.hints);
    }

    async init() {
        await this.puzzleManager.loadPuzzles();
        this.setupEventListeners();
        this.startNewPuzzle();
    }

    setupEventListeners() {
        // Difficulty buttons
        document.querySelectorAll('.btn-difficulty').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // UI update
                document.querySelectorAll('.btn-difficulty').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');

                // Logic update
                const level = e.target.dataset.level;
                this.puzzleManager.setDifficulty(level);
                this.startNewPuzzle();
            });
        });

        // Next Puzzle button
        document.getElementById('btn-next').addEventListener('click', () => {
            this.startNewPuzzle();
        });

        // Hint button
        document.getElementById('btn-hint').addEventListener('click', () => {
            this.handleHint();
        });

        // Reset button
        document.getElementById('btn-reset').addEventListener('click', () => {
            this.showCustomConfirm(
                "Reset Progress?",
                "This will clear all your solved puzzles and statistics. Are you sure you want to start over?",
                () => {
                    this.puzzleManager.clearSolved();
                    this.score.solved = 0;
                    this.score.hints = 0;
                    this.saveScore();
                    this.updateScore();

                    // Check if current puzzle is worth keeping
                    const isInProgress = this.currentPuzzle && this.moveIndex < this.puzzleMoves.length;

                    if (!isInProgress) {
                        this.startNewPuzzle();
                    } else {
                        this.showFeedback("Progress reset! Current puzzle kept.", "info");
                    }
                }
            );
        });
    }

    showCustomConfirm(title, message, onConfirm) {
        const overlay = document.getElementById('modal-overlay');
        const titleEl = document.getElementById('modal-title');
        const messageEl = document.getElementById('modal-message');
        const cancelBtn = document.getElementById('modal-btn-cancel');
        const confirmBtn = document.getElementById('modal-btn-confirm');

        titleEl.textContent = title;
        messageEl.textContent = message;
        overlay.classList.remove('hidden');

        const cleanup = () => {
            overlay.classList.add('hidden');
            cancelBtn.removeEventListener('click', onCancel);
            confirmBtn.removeEventListener('click', onConfirmInternal);
        };

        const onCancel = () => cleanup();
        const onConfirmInternal = () => {
            cleanup();
            onConfirm();
        };

        cancelBtn.addEventListener('click', onCancel);
        confirmBtn.addEventListener('click', onConfirmInternal);
    }

    startNewPuzzle() {
        const puzzle = this.puzzleManager.getNextPuzzle();
        if (!puzzle) {
            alert('No more puzzles in this difficulty!');
            return;
        }

        this.currentPuzzle = puzzle;
        this.game.load(puzzle.fen);
        this.puzzleMoves = puzzle.solution; // e.g. ["e2g2", "g8h8"]
        this.moveIndex = 0;
        this.lastHintMoveIndex = -1; // Reset hint tracking

        // Determine orientation
        const turn = this.game.turn(); // 'w' or 'b'
        this.board.setGame(this.game); // Set game first!
        this.board.setOrientation(turn === 'w' ? 'white' : 'black');
        this.board.setHintSquare(null); // Clear hint on new puzzle

        this.updateStatus(puzzle.description);
        document.getElementById('puzzle-number').textContent = "#" + puzzle.id;
        this.showFeedback(""); // Clear feedback
        this.updateScore();
    }

    handleMove(moveObj) {
        // moveObj: {from, to, promotion}

        // 1. Validate with chess.js
        try {
            const move = this.game.move(moveObj);
            if (!move) {
                this.showFeedback("Illegal move!", "error");
                return false;
            }

            // 2. Check if it matches puzzle solution
            const expectedMoveLan = this.puzzleMoves[this.moveIndex]; // e.g. "e2g2"
            const actualMoveLan = move.from + move.to; // e.g. "e2g2" (ignore promotion char for now or handle it)

            // Handle promotion in LAN if needed (e.g. "a7a8q")
            const actualMoveLanFull = move.from + move.to + (move.promotion || '');

            // Simple check: does actual match expected?
            // Note: puzzle solutions usually alternate moves.
            // Index 0: User move
            // Index 1: Computer response
            // Index 2: User move

            if (actualMoveLan === expectedMoveLan || actualMoveLanFull === expectedMoveLan) {
                // Correct move
                this.board.setHintSquare(null); // Clear hint on correct move
                this.board.render();
                this.moveIndex++;

                // Check if puzzle solved
                if (this.moveIndex >= this.puzzleMoves.length) {
                    this.handleWin();
                } else {
                    // Computer's turn
                    setTimeout(() => this.makeComputerMove(), 500);
                }
                return true;
            } else {
                // Wrong move (but legal chess move)
                this.game.undo();
                this.showFeedback("Wrong move! Try again.", "error");
                return false;
            }

        } catch (e) {
            return false;
        }
    }

    makeComputerMove() {
        if (this.moveIndex >= this.puzzleMoves.length) return;

        const expectedMoveLan = this.puzzleMoves[this.moveIndex];
        const from = expectedMoveLan.substring(0, 2);
        const to = expectedMoveLan.substring(2, 4);
        const promotion = expectedMoveLan.length > 4 ? expectedMoveLan[4] : undefined;

        this.game.move({ from, to, promotion });
        this.board.render();
        this.moveIndex++;

        // Check if user needs to move again
        if (this.moveIndex < this.puzzleMoves.length) {
            this.updateStatus("Your turn!");
        } else {
            this.handleWin();
        }
    }

    handleWin() {
        if (this.currentPuzzle) {
            this.puzzleManager.markAsSolved(this.currentPuzzle.id);
        }
        this.score.solved++;
        this.saveScore();
        this.updateScore();
        this.showFeedback("Puzzle Solved! +1 Point", "success");
    }

    handleHint() {
        if (!this.currentPuzzle || this.moveIndex >= this.puzzleMoves.length) return;

        // Prevent multiple hints for the same move
        if (this.lastHintMoveIndex === this.moveIndex) {
            this.showFeedback("Hint already used for this move!", "info");
            return;
        }

        this.lastHintMoveIndex = this.moveIndex;

        // Increment hints used
        this.score.hints++;
        this.saveScore();
        this.updateScore();

        // Reveal which piece to move
        const expectedMoveLan = this.puzzleMoves[this.moveIndex]; // e.g. "e2g2"
        const fromSquare = expectedMoveLan.substring(0, 2);
        const piece = this.game.get(fromSquare);

        const pieceNames = {
            'p': 'Pawn',
            'n': 'Knight',
            'b': 'Bishop',
            'r': 'Rook',
            'q': 'Queen',
            'k': 'King'
        };

        const pieceName = pieceNames[piece.type];
        this.showFeedback(`Hint: Move the ${pieceName} on ${fromSquare}`, "info");

        // Set the hint square on the board
        this.board.setHintSquare(fromSquare);
    }

    updateStatus(msg) {
        document.getElementById('instruction').textContent = msg;
    }

    showFeedback(msg, type = "") {
        const el = document.getElementById('feedback-msg');
        el.textContent = msg;
        el.className = msg ? `show ${type}` : "";

        if (msg && type === "error") {
            // Auto-hide error feedback after 2 seconds
            if (this.feedbackTimeout) clearTimeout(this.feedbackTimeout);
            this.feedbackTimeout = setTimeout(() => {
                el.classList.remove('show');
            }, 2000);
        }
    }

    updateScore() {
        document.getElementById('score-solved').textContent = this.score.solved;
        document.getElementById('score-hints').textContent = this.score.hints;
    }
}

// Start app
window.addEventListener('DOMContentLoaded', () => {
    // Check if Chess is loaded
    if (window.Chess) {
        new App();
    } else {
        // Wait for script load if needed, or alert error
        console.error("Chess.js not loaded");
        // Fallback: load it dynamically?
        // For now assume CDN works.
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/chess.js/0.10.3/chess.min.js';
        script.onload = () => new App();
        document.head.appendChild(script);
    }
});
