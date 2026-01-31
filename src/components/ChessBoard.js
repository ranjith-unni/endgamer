// We assume chess.js is loaded globally via CDN in index.html as 'Chess'

window.ChessBoard = class ChessBoard {
    constructor(elementId, onMove) {
        this.element = document.getElementById(elementId);
        this.onMove = onMove;
        this.game = null; // Chess instance
        this.orientation = 'white';
        this.selectedSquare = null;
        this.hintSquare = null;
        this.showValidMoves = false;
        this.showCoordinates = false;
        this.possibleMoves = [];

        // Bind methods
        this.handleSquareClick = this.handleSquareClick.bind(this);
        this.handlePromotionSelect = this.handlePromotionSelect.bind(this);

        this.pendingMove = null;
        this.setupPromotionListeners();
    }

    setupPromotionListeners() {
        document.querySelectorAll('.btn-promotion').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const piece = e.currentTarget.dataset.piece;
                this.handlePromotionSelect(piece);
            });
        });
    }

    setGame(chessInstance) {
        this.game = chessInstance;
        this.render();
    }

    setOrientation(color) {
        this.orientation = color;
        this.render();
    }

    setHintSquare(squareId) {
        this.hintSquare = squareId;
        this.render();
    }

    setShowValidMoves(show) {
        this.showValidMoves = show;
        this.render();
    }

    setShowCoordinates(show) {
        this.showCoordinates = show;
        this.render();
    }

    render() {
        this.element.innerHTML = '';
        if (!this.game) return; // Guard clause: wait for game instance

        const board = this.game.board(); // 8x8 array

        // Adjust for orientation
        const isWhite = this.orientation === 'white';
        const rows = isWhite ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];
        const cols = isWhite ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];

        // Create squares
        // We need to iterate rows 0-7 (rank 8 to 1) for visual top-to-bottom
        // chess.js board()[0] is rank 8 (a8...h8)

        // Actually chess.js board() returns:
        // [ [ {type: 'r', color: 'b'}, ... ], ... ] where index 0 is rank 8.

        // If orientation is white:
        // Visual Row 0 = Rank 8 (Index 0)
        // Visual Row 7 = Rank 1 (Index 7)
        // Visual Col 0 = File a (Index 0)

        // If orientation is black:
        // Visual Row 0 = Rank 1 (Index 7)
        // Visual Row 7 = Rank 8 (Index 0)
        // Visual Col 0 = File h (Index 7)

        // Calculate valid moves if enabled and piece selected
        const validMoveSquares = new Set();
        if (this.showValidMoves && this.selectedSquare) {
            const moves = this.game.moves({ square: this.selectedSquare, verbose: true });
            moves.forEach(m => validMoveSquares.add(m.to));
        }

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const rowIdx = isWhite ? r : 7 - r;
                const colIdx = isWhite ? c : 7 - c;

                const squareData = board[rowIdx][colIdx];
                const squareEl = document.createElement('div');

                // Determine square color
                const isLight = (rowIdx + colIdx) % 2 === 0;
                squareEl.className = `square ${isLight ? 'light' : 'dark'}`;

                // Data attributes for logic
                const file = 'abcdefgh'[colIdx];
                const rank = 8 - rowIdx;
                const squareId = `${file}${rank}`;
                squareEl.dataset.square = squareId;

                // Highlight selected
                if (this.selectedSquare === squareId) {
                    squareEl.classList.add('selected');
                }

                // Highlight hint
                if (this.hintSquare === squareId) {
                    squareEl.classList.add('hint');
                }

                // Highlight valid moves
                if (validMoveSquares.has(squareId)) {
                    squareEl.classList.add('valid-move');
                }

                // Highlight last move (optional, TODO)

                // Add piece if exists
                if (squareData) {
                    const pieceEl = document.createElement('div');
                    pieceEl.className = 'piece';
                    // Use wikipedia SVG pieces or similar
                    const pieceCode = `${squareData.color}${squareData.type.toUpperCase()}`;
                    pieceEl.style.backgroundImage = `url('https://upload.wikimedia.org/wikipedia/commons/${this.getPieceUrl(squareData.color, squareData.type)}')`;
                    squareEl.appendChild(pieceEl);
                }

                // Add click listener
                squareEl.addEventListener('click', () => this.handleSquareClick(squareId));

                // Add coordinates if enabled
                if (this.showCoordinates) {
                    // Rank numbers (1-8) on the Right side
                    // If white orientation, right side is file 'h'.
                    // If black orientation, right side is file 'a'.
                    const rightMostFile = isWhite ? 7 : 0; // Index 7 (h) or 0 (a)
                    if (colIdx === rightMostFile) {
                        const rankLabel = document.createElement('div');
                        rankLabel.className = 'coordinate-rank';
                        rankLabel.textContent = rank; // 1-8
                        squareEl.appendChild(rankLabel);
                    }

                    // File letters (a-h) on the Bottom side
                    // If white orientation, bottom row is rank 1 (rowIdx 7).
                    // If black orientation, bottom row is rank 8 (rowIdx 0).
                    const bottomRow = isWhite ? 7 : 0; // Index 7 or 0
                    if (rowIdx === bottomRow) {
                        const fileLabel = document.createElement('div');
                        fileLabel.className = 'coordinate-file';
                        fileLabel.textContent = file; // a-h
                        squareEl.appendChild(fileLabel);
                    }
                }

                this.element.appendChild(squareEl);
            }
        }
    }

    getPieceUrl(color, type) {
        // Map to reliable Wikimedia SVG paths
        const pieces = {
            'wl': '4/45/Chess_plt45.svg',
            'wn': '7/70/Chess_nlt45.svg',
            'wb': 'b/b1/Chess_blt45.svg',
            'wr': '7/72/Chess_rlt45.svg',
            'wq': '1/15/Chess_qlt45.svg',
            'wk': '4/42/Chess_klt45.svg',
            'bl': 'c/c7/Chess_pdt45.svg',
            'bn': 'e/ef/Chess_ndt45.svg',
            'bb': '9/98/Chess_bdt45.svg',
            'br': 'f/ff/Chess_rdt45.svg',
            'bq': '4/47/Chess_qdt45.svg',
            'bk': 'f/f0/Chess_kdt45.svg'
        };

        const key = `${color}${type === 'p' ? 'l' : type}`; // Note: 'p' is pawn, but my mapping used 'l' for White pawn 'pl'? No, wait.
        // Let's re-align the naming:
        // White: plt, nlt, blt, rlt, qlt, klt
        // Black: pdt, ndt, bdt, rdt, qdt, kdt

        const pieceKey = color === 'w' ?
            { 'p': '4/45/Chess_plt45.svg', 'n': '7/70/Chess_nlt45.svg', 'b': 'b/b1/Chess_blt45.svg', 'r': '7/72/Chess_rlt45.svg', 'q': '1/15/Chess_qlt45.svg', 'k': '4/42/Chess_klt45.svg' }[type] :
            { 'p': 'c/c7/Chess_pdt45.svg', 'n': 'e/ef/Chess_ndt45.svg', 'b': '9/98/Chess_bdt45.svg', 'r': 'f/ff/Chess_rdt45.svg', 'q': '4/47/Chess_qdt45.svg', 'k': 'f/f0/Chess_kdt45.svg' }[type];

        return pieceKey;
    }

    handleSquareClick(square) {
        // If we have a selected square, try to move
        if (this.selectedSquare) {
            // If clicking same square, deselect
            if (this.selectedSquare === square) {
                this.selectedSquare = null;
                this.render();
                return;
            }

            // If clicking another piece of our playing color, switch selection to that piece
            // This prevents "Illegal Move" errors when just trying to change selection
            const targetPiece = this.game.get(square);
            if (targetPiece && targetPiece.color === this.game.turn()) {
                this.selectedSquare = square;
                this.render();
                return;
            }

            // Check if it's a promotion move
            const piece = this.game.get(this.selectedSquare);
            const isPawn = piece && piece.type === 'p';
            const targetRank = parseInt(square[1]);
            const isPromotionRank = (piece.color === 'w' && targetRank === 8) || (piece.color === 'b' && targetRank === 1);

            if (isPawn && isPromotionRank) {
                // Verify it's a legal move first
                const moves = this.game.moves({ square: this.selectedSquare, verbose: true });
                const isLegal = moves.some(m => m.to === square);

                if (isLegal) {
                    this.pendingMove = { from: this.selectedSquare, to: square };
                    this.showPromotionModal(piece.color);
                    return;
                }
            }

            // Try normal move
            const move = {
                from: this.selectedSquare,
                to: square,
                promotion: 'q' // Default for non-pawn-to-8th moves (shouldn't matter)
            };

            // Validate move via callback (which calls chess.js)
            const result = this.onMove(move);

            if (result) {
                // Move successful
                this.selectedSquare = null;
                this.render();
            } else {
                // Invalid move. 
                // If clicked on another own piece, select it instead
                const pieceAtTarget = this.game.get(square);
                if (pieceAtTarget && pieceAtTarget.color === this.game.turn()) {
                    this.selectedSquare = square;
                    this.render();
                } else {
                    this.selectedSquare = null;
                    this.render();
                }
            }
        } else {
            // Select piece
            const piece = this.game.get(square);
            if (piece && piece.color === this.game.turn()) {
                this.selectedSquare = square;
                this.render();
            }
        }
    }

    showPromotionModal(color) {
        const overlay = document.getElementById('promotion-overlay');
        overlay.classList.remove('hidden');
        document.body.classList.toggle('body-turn-black', color === 'b');
    }

    handlePromotionSelect(piece) {
        if (!this.pendingMove) return;

        const move = {
            ...this.pendingMove,
            promotion: piece
        };

        const result = this.onMove(move);
        if (result) {
            this.selectedSquare = null;
            this.pendingMove = null;
            document.getElementById('promotion-overlay').classList.add('hidden');
        } else {
            // This shouldn't happen if isLegal passed
            this.pendingMove = null;
            document.getElementById('promotion-overlay').classList.add('hidden');
            this.render();
        }
    }
}
