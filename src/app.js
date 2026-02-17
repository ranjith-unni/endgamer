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
        this.sessionSolvedPuzzles = new Set(); // Track puzzles solved in this session
        this.currentTheme = localStorage.getItem('endgamer_theme') || 'classic';
        this.showValidMoves = localStorage.getItem('endgamer_show_valid') === 'true'; // Default false
        this.showCoordinates = localStorage.getItem('endgamer_show_coords') === 'true'; // Default false
        this.randomSwapEnabled = localStorage.getItem('endgamer_random_swap') === 'true'; // Default false
        this.board.setShowValidMoves(this.showValidMoves);
        this.board.setShowCoordinates(this.showCoordinates);
        this.applyTheme(this.currentTheme);

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

        // Settings button
        document.getElementById('btn-settings').addEventListener('click', () => {
            this.toggleSettings(true);
        });

        // Settings Close button
        document.getElementById('settings-btn-close').addEventListener('click', () => {
            this.toggleSettings(false);
        });

        // Theme buttons
        document.querySelectorAll('.btn-theme').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const theme = e.currentTarget.dataset.theme;
                this.currentTheme = theme;
                localStorage.setItem('endgamer_theme', theme);
                this.applyTheme(theme);

                // Update UI
                document.querySelectorAll('.btn-theme').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
            });
        });

        // Go to puzzle button
        document.getElementById('btn-go-to-puzzle').addEventListener('click', () => {
            const puzzleId = document.getElementById('input-puzzle-number').value;
            if (puzzleId) {
                this.goToPuzzle(puzzleId);
                this.toggleSettings(false);
            }
        });

        // Show Valid Moves Checkbox
        document.getElementById('check-show-valid-moves').addEventListener('change', (e) => {
            this.showValidMoves = e.target.checked;
            localStorage.setItem('endgamer_show_valid', this.showValidMoves);
            this.board.setShowValidMoves(this.showValidMoves);
        });

        // Show Coordinates Checkbox
        document.getElementById('check-show-coordinates').addEventListener('change', (e) => {
            this.showCoordinates = e.target.checked;
            localStorage.setItem('endgamer_show_coords', this.showCoordinates);
            this.board.setShowCoordinates(this.showCoordinates);
        });

        // Random Swap Checkbox
        document.getElementById('check-random-swap').addEventListener('change', (e) => {
            this.randomSwapEnabled = e.target.checked;
            localStorage.setItem('endgamer_random_swap', this.randomSwapEnabled);
        });

        // Initial theme UI state
        document.querySelectorAll('.btn-theme').forEach(btn => {
            if (btn.dataset.theme === this.currentTheme) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Reset button (updated listener since it moved)
        document.getElementById('btn-reset').addEventListener('click', () => {
            this.toggleSettings(false); // Close settings first
            this.showModal(
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
                },
                "Confirm",
                "Cancel"
            );
        });
    }

    toggleSettings(show) {
        const overlay = document.getElementById('settings-overlay');
        if (show) {
            overlay.classList.remove('hidden');
            // Sync puzzle number input
            if (this.currentPuzzle) {
                document.getElementById('input-puzzle-number').value = this.currentPuzzle.id;
            }
            // Sync checkboxes
            document.getElementById('check-show-valid-moves').checked = this.showValidMoves;
            document.getElementById('check-show-coordinates').checked = this.showCoordinates;
            document.getElementById('check-random-swap').checked = this.randomSwapEnabled;
        } else {
            overlay.classList.add('hidden');
        }
    }

    applyTheme(themeName) {
        document.body.dataset.theme = themeName;
    }

    goToPuzzle(id) {
        const puzzle = this.puzzleManager.getPuzzleById(id);
        if (puzzle) {
            // Respect swap setting even for direct navigation? 
            // Maybe yes, for consistency.
            let puzzleToLoad = puzzle;
            if (this.randomSwapEnabled && Math.random() > 0.5) {
                puzzleToLoad = window.PuzzleManager.swapPuzzle(puzzle);
            }
            this.currentPuzzle = puzzleToLoad;
            this.setupPuzzle(puzzleToLoad);
            this.showFeedback(`Navigated to puzzle #${id}`, "info");
        } else {
            this.showFeedback(`Puzzle #${id} not found!`, "error");
        }
    }

    showModal(title, message, onConfirm, confirmText = "Confirm", cancelText = "Cancel", singleButton = false) {
        const overlay = document.getElementById('modal-overlay');
        const titleEl = document.getElementById('modal-title');
        const messageEl = document.getElementById('modal-message');
        const cancelBtn = document.getElementById('modal-btn-cancel');
        const confirmBtn = document.getElementById('modal-btn-confirm');

        titleEl.textContent = title;
        messageEl.textContent = message;
        confirmBtn.textContent = confirmText;
        cancelBtn.textContent = cancelText;

        if (singleButton) {
            cancelBtn.style.display = 'none';
        } else {
            cancelBtn.style.display = 'inline-block'; // or block/flex depending on css, inline-block is safe
        }

        overlay.classList.remove('hidden');

        const cleanup = () => {
            overlay.classList.add('hidden');
            cancelBtn.removeEventListener('click', onCancel);
            confirmBtn.removeEventListener('click', onConfirmInternal);
            // Reset style
            cancelBtn.style.display = '';
        };

        const onCancel = () => cleanup();
        const onConfirmInternal = () => {
            cleanup();
            if (onConfirm) onConfirm();
        };

        cancelBtn.addEventListener('click', onCancel);
        confirmBtn.addEventListener('click', onConfirmInternal);
    }

    startNewPuzzle() {
        let puzzle = this.puzzleManager.getNextPuzzle();
        if (!puzzle) {
            this.handleLevelComplete();
            return;
        }

        // Apply Random Swap
        if (this.randomSwapEnabled && Math.random() > 0.5) {
            puzzle = window.PuzzleManager.swapPuzzle(puzzle);
        }

        this.setupPuzzle(puzzle);
    }

    handleLevelComplete() {
        const currentDiff = this.puzzleManager.currentDifficulty;
        if (currentDiff === 'easy') {
            this.showModal(
                "Level Complete!",
                "You've solved all Easy puzzles! You are being promoted to the Medium level of challenge. Are you ready?",
                () => {
                    this.advanceLevel('medium');
                },
                "Let's Go!",
                "",
                true
            );
        } else if (currentDiff === 'medium') {
            this.showModal(
                "Level Complete!",
                "You've solved all Medium puzzles! You are being promoted to the Hard level of challenge. Are you ready?",
                () => {
                    this.advanceLevel('hard');
                },
                "Let's Go!",
                "",
                true
            );
        } else {
            this.showModal("Game Complete!", "You've solved all puzzles! Congratulations on mastering the endgame!", () => {
                // Do nothing or reset
            }, "Awesome!", "", true);
        }
    }

    advanceLevel(level) {
        // UI update for buttons
        document.querySelectorAll('.btn-difficulty').forEach(b => {
            b.classList.remove('active');
            if (b.dataset.level === level) b.classList.add('active');
        });

        this.puzzleManager.setDifficulty(level);
        this.startNewPuzzle();
    }

    setupPuzzle(puzzle) {
        this.currentPuzzle = puzzle;
        this.game.load(puzzle.fen);
        this.puzzleMoves = puzzle.solution; // e.g. ["e2g2", "g8h8"]
        this.moveIndex = 0;
        this.lastHintMoveIndex = -1; // Reset hint tracking

        // Determine orientation
        const turn = this.game.turn(); // 'w' or 'b'
        this.board.setGame(this.game); // Set game first!
        this.board.setOrientation('white'); // Always white orientation (User request)
        this.board.setHintSquare(null); // Clear hint on new puzzle

        this.updateStatus(puzzle.description);
        document.getElementById('puzzle-number').textContent = "#" + puzzle.id;

        // Update input in settings if it's open
        const input = document.getElementById('input-puzzle-number');
        if (input) input.value = puzzle.id;

        this.showFeedback(""); // Clear feedback
        this.updateScore();
    }

    handleMove(moveObj) {
        const fenBefore = this.game.fen();

        // 1. Validate with chess.js
        try {
            const move = this.game.move(moveObj);
            if (!move) {
                this.showFeedback("Illegal move!", "error");
                return false;
            }

            // 2. Check if it matches puzzle solution
            const expectedMoveStr = this.puzzleMoves[this.moveIndex];

            // Use a temporary game to resolve the expected move
            // This handles SAN, LAN, and provides square-based comparison
            const tempGame = new window.Chess(fenBefore);
            const expectedMove = tempGame.move(expectedMoveStr, { sloppy: true });

            if (expectedMove &&
                move.from === expectedMove.from &&
                move.to === expectedMove.to &&
                (!expectedMove.promotion || move.promotion === expectedMove.promotion)) {

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
        if (!this.currentPuzzle) return;

        // Check if already solved in this session
        if (this.sessionSolvedPuzzles.has(this.currentPuzzle.id)) {
            this.showFeedback("Puzzle Solved! (Already solved in this session)", "info");
            return;
        }

        this.puzzleManager.markAsSolved(this.currentPuzzle.id);
        this.sessionSolvedPuzzles.add(this.currentPuzzle.id);

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
        const highlightedMsg = msg
            .replace(/White/g, "<strong>White</strong>")
            .replace(/Black/g, "<strong>Black</strong>");
        document.getElementById('instruction').innerHTML = highlightedMsg;
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
