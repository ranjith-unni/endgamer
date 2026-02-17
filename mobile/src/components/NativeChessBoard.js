import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions, Text } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { Chess } from 'chess.js';
import { PIECE_XML } from '../assets/PieceSVGs';

const SCREEN_WIDTH = Dimensions.get('window').width;
const BOARD_SIZE = Math.min(SCREEN_WIDTH - 20, 340); // Max width 340
const SQUARE_SIZE = BOARD_SIZE / 8;

export default function NativeChessBoard({ fen, onMove, highlightSquare, solution, orientation = 'white', showValidMoves = true }) {
    // We keep a local chess instance for legal move generation and piece placement
    // Note: 'fen' prop updates trigger a state reset
    const [game, setGame] = useState(new Chess(fen));
    const [selectedSquare, setSelectedSquare] = useState(null);
    const [possibleMoves, setPossibleMoves] = useState([]);
    // We need board layout
    const [board, setBoard] = useState([]);
    const [promotionSquare, setPromotionSquare] = useState(null);
    const [pendingMove, setPendingMove] = useState(null);

    useEffect(() => {
        if (fen) {
            const newGame = new Chess(fen);
            setGame(newGame);
            setBoard(newGame.board());
            setSelectedSquare(null);
            setPossibleMoves([]);
            setPromotionSquare(null);
            setPendingMove(null);
        }
    }, [fen]);

    useEffect(() => {
        if (highlightSquare) {
            selectSquare(highlightSquare);
        }
    }, [highlightSquare]);

    useEffect(() => {
        // Allow external component (GameScreen hints) to trigger selection
        if (onMove && fen) {
            // We only want to select if it's a valid piece of ours
            // But selectSquare handles safety checks anyway
        }
    }, []);

    const executeMove = (move) => {
        game.move(move);
        setBoard(game.board());
        onMove({ move: game.history({ verbose: true }).pop() });
        setSelectedSquare(null);
        setPossibleMoves([]);
        setPromotionSquare(null);
        setPendingMove(null);
    };

    const handleSquarePress = (row, col) => {
        if (promotionSquare) return; // Ignore clicks if promoting

        const isWhite = orientation === 'white';
        const files = isWhite ? ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] : ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'];
        const ranks = isWhite ? ['8', '7', '6', '5', '4', '3', '2', '1'] : ['1', '2', '3', '4', '5', '6', '7', '8'];
        const square = files[col] + ranks[row]; // e.g., 'e4'

        // If we have a selected square, try to move
        if (selectedSquare) {
            // Check if clicked square is a valid target
            const movesToSquare = possibleMoves.filter(m => m.to === square);

            if (movesToSquare.length > 0) {
                const move = movesToSquare[0];

                // Check for promotion
                if (move.flags.includes('p') || move.promotion) {
                    // Only allow promotion selection if it's the correct move destination
                    // solution e.g. "e7e8q" or "e7e8"
                    const solutionTarget = solution ? solution.substring(2, 4) : null;

                    if (solutionTarget && square === solutionTarget) {
                        setPendingMove({ from: selectedSquare, to: square });
                        setPromotionSquare(square);
                        return;
                    } else {
                        // If it's the wrong target square (but legal chess move), don't show modal.
                        // Just execute the default (usually Queen) so GameScreen fails it.
                        executeMove(move);
                        return;
                    }
                }

                // Execute move locally to update UI immediately
                executeMove(move);
                return;
            }

            // If not a valid move target, check if we clicked another piece of ours
            const piece = game.get(square);
            if (piece && piece.color === game.turn()) {
                selectSquare(square);
            } else {
                // Deselect
                setSelectedSquare(null);
                setPossibleMoves([]);
            }
        } else {
            // Select logic
            const piece = game.get(square);
            if (piece && piece.color === game.turn()) {
                selectSquare(square);
            }
        }
    };

    const selectSquare = (square) => {
        setSelectedSquare(square);
        const moves = game.moves({ square, verbose: true });
        setPossibleMoves(moves);
    };

    const handlePromotionSelect = (pieceType) => {
        if (!pendingMove) return;

        // Find the specific promotion move
        const move = possibleMoves.find(m =>
            m.from === pendingMove.from &&
            m.to === pendingMove.to &&
            m.promotion === pieceType
        );

        if (move) {
            executeMove(move);
        } else {
            executeMove({ ...pendingMove, promotion: pieceType });
        }
    };

    // Render Logic
    const renderSquare = (row, col) => {
        const isDark = (row + col) % 2 === 1;
        const color = isDark ? '#b58863' : '#f0d9b5';

        const isWhite = orientation === 'white';
        // Map visual row/col to board data indices
        // Board data is always rank 8 (index 0) to rank 1 (index 7), file a (0) to h (7)
        // If flipped:
        // Visual Row 0 (Top) -> Rank 1 (Index 7)
        // Visual Col 0 (Left) -> File h (Index 7)
        const dataRow = isWhite ? row : 7 - row;
        const dataCol = isWhite ? col : 7 - col;

        const squareData = board[dataRow] && board[dataRow][dataCol];

        const files = isWhite ? ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] : ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'];
        const ranks = isWhite ? ['8', '7', '6', '5', '4', '3', '2', '1'] : ['1', '2', '3', '4', '5', '6', '7', '8'];
        const squareId = files[col] + ranks[row];

        const isSelected = selectedSquare === squareId;
        const isPossibleMove = possibleMoves.some(m => m.to === squareId);

        // Highlight logic
        let backgroundColor = color;
        if (isSelected) backgroundColor = 'rgba(255, 255, 0, 0.6)';

        return (
            <TouchableOpacity
                key={`${row}-${col}`}
                style={[styles.square, { backgroundColor, width: SQUARE_SIZE, height: SQUARE_SIZE }]}
                onPress={() => handleSquarePress(row, col)}
                activeOpacity={0.9}
            >
                {squareData && (
                    <SvgXml
                        width={SQUARE_SIZE * 0.85}
                        height={SQUARE_SIZE * 0.85}
                        xml={PIECE_XML[squareData.color][squareData.type]}
                    />
                )}

                {/* Move Hint Dot */}
                {showValidMoves && isPossibleMove && !squareData && (
                    <View style={styles.moveDot} />
                )}
                {/* Capture Hint Ring */}
                {showValidMoves && isPossibleMove && squareData && (
                    <View style={styles.captureRing} />
                )}
            </TouchableOpacity>
        );
    };

    const renderBoard = () => {
        const rows = [];
        for (let r = 0; r < 8; r++) {
            const cols = [];
            for (let c = 0; c < 8; c++) {
                cols.push(renderSquare(r, c));
            }
            rows.push(<View key={r} style={styles.row}>{cols}</View>);
        }
        return rows;
    };

    const renderPromotionModal = () => {
        if (!promotionSquare) return null;

        const turn = game.turn(); // 'w' or 'b'
        const pieces = ['q', 'r', 'b', 'n'];

        return (
            <View style={styles.promotionOverlay}>
                <View style={styles.promotionContainer}>
                    <Text style={styles.promotionTitle}>Promote to:</Text>
                    <View style={styles.promotionOptions}>
                        {pieces.map(p => (
                            <TouchableOpacity
                                key={p}
                                style={styles.promotionPiece}
                                onPress={() => handlePromotionSelect(p)}
                            >
                                <SvgXml
                                    xml={PIECE_XML[turn][p]}
                                    width={50}
                                    height={50}
                                />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </View>
        );
    };

    return (
        <View style={[styles.board, { width: BOARD_SIZE, height: BOARD_SIZE }]}>
            {renderBoard()}
            {renderPromotionModal()}
        </View>
    );
}

const styles = StyleSheet.create({
    board: {
        flexDirection: 'column',
    },
    row: {
        flexDirection: 'row',
    },
    square: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    moveDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: 'rgba(0,0,0,0.2)',
        position: 'absolute'
    },
    captureRing: {
        width: SQUARE_SIZE,
        height: SQUARE_SIZE,
        borderWidth: 4,
        borderColor: 'rgba(0,0,0,0.2)',
        position: 'absolute',
        borderRadius: SQUARE_SIZE / 2
    },
    promotionOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    promotionContainer: {
        backgroundColor: '#333',
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
    },
    promotionTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    promotionOptions: {
        flexDirection: 'row',
        gap: 15,
    },
    promotionPiece: {
        padding: 10,
        backgroundColor: '#444',
        borderRadius: 8,
    },
});
