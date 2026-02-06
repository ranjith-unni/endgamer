import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import NativeChessBoard from './NativeChessBoard'; // Changed
import { Chess } from 'chess.js';
import PuzzleManager from '../utils/PuzzleManager';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function GameScreen({ difficulty, onBack }) {
    const [puzzle, setPuzzle] = useState(null);
    const [chess, setChess] = useState(new Chess());
    const [feedback, setFeedback] = useState('');
    const [loading, setLoading] = useState(true);

    const [hintSquare, setHintSquare] = useState(null);
    const [stats, setStats] = useState({ totalSolved: 0, hintsUsed: 0 });
    const [boardKey, setBoardKey] = useState(0);
    const [jumpId, setJumpId] = useState('');

    useEffect(() => {
        loadNextPuzzle();
        updateStats();
    }, [difficulty]);

    const updateStats = async () => {
        const s = PuzzleManager.getStats();
        setStats(s);
    };

    const loadNextPuzzle = async () => {
        setLoading(true);
        setFeedback('');
        setHintSquare(null); // Reset hint
        setBoardKey(k => k + 1); // Reset board
        PuzzleManager.setDifficulty(difficulty);

        // Ensure manager is initialized
        await PuzzleManager.init();
        updateStats();

        const next = PuzzleManager.getNextPuzzle();
        if (next) {
            setPuzzle(next);
        } else {
            setPuzzle(null);
            Alert.alert('Congratulations!', `You have solved all ${difficulty} puzzles!`);
        }
        setLoading(false);
    };

    const jumpToPuzzle = async () => {
        if (!jumpId) return;
        setLoading(true);
        setFeedback('');
        setHintSquare(null);
        setBoardKey(k => k + 1);

        await PuzzleManager.init();
        const p = PuzzleManager.getPuzzleById(jumpId);
        if (p) {
            setPuzzle(p);
            setJumpId('');
        } else {
            setFeedback('Puzzle ID not found');
            setTimeout(() => setFeedback(''), 2000);
        }
        setLoading(false);
    };

    const onMove = useCallback(({ move }) => {
        if (!puzzle) return;

        // move from NativeChessBoard is a chess.js object (verbose)
        // { from: 'e2', to: 'e4', color: 'w', flags: 'n', piece: 'p', san: 'e4' }
        const { from, to, promotion } = move;
        const algebraicMove = from + to + (promotion ? promotion : '');
        const simpleMove = from + to;

        const expectedMove = puzzle.solution[0];

        if (algebraicMove === expectedMove || simpleMove === expectedMove) {
            setFeedback('Correct! Mate!');
            PuzzleManager.markAsSolved(puzzle.id).then(updateStats);
            // Allow user to see the move and the success message for a moment
            setTimeout(() => {
                loadNextPuzzle();
            }, 1500);
        } else {
            setFeedback('Incorrect move. Try again.');
            // Delay the reset so the user sees their bad move for a second
            setTimeout(() => {
                setFeedback(''); // Clear feedback
                setBoardKey(k => k + 1); // Force board reset
            }, 1000);
        }
    }, [puzzle]);

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#ffffff" />
            </View>
        );
    }

    if (!puzzle) {
        return (
            <View style={styles.center}>
                <Text style={styles.text}>No more puzzles in this category.</Text>
                <TouchableOpacity onPress={onBack} style={styles.button}>
                    <Text style={styles.btnText}>Choose Difficulty</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                        <Text style={styles.backText}>‹ Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Puzzle #{puzzle.id}</Text>
                </View>

                <View style={styles.statsBar}>
                    <Text style={styles.statText}>Solved: {stats.totalSolved}</Text>
                    <Text style={styles.statText}>Hints: {stats.hintsUsed}</Text>
                </View>

                <View style={styles.boardContainer}>
                    <View style={styles.feedbackContainer}>
                        {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}
                    </View>
                    <NativeChessBoard
                        key={boardKey}
                        fen={puzzle.fen}
                        onMove={onMove}
                        highlightSquare={hintSquare}
                        solution={puzzle.solution ? puzzle.solution[0] : null}
                    />
                    <Text style={styles.description}>{puzzle.description}</Text>
                </View>

                <View style={styles.controls}>
                    <TouchableOpacity
                        style={styles.hintBtn}
                        onPress={() => {
                            if (puzzle && puzzle.solution) {
                                const move = puzzle.solution[0]; // e.g. "e2e4"
                                const from = move.substring(0, 2);
                                const to = move.substring(2, 4);

                                // Get piece type at 'from' square
                                // We need a fresh chess instance with current FEN to know what is there
                                const tempChess = new Chess(puzzle.fen);
                                const piece = tempChess.get(from);

                                if (piece) {
                                    const PIECE_NAMES = {
                                        p: 'Pawn',
                                        n: 'Knight',
                                        b: 'Bishop',
                                        r: 'Rook',
                                        q: 'Queen',
                                        k: 'King'
                                    };
                                    const name = PIECE_NAMES[piece.type];
                                    setFeedback(`Hint: Move the ${name}`);
                                    setHintSquare(from);

                                    // Clear highlight after a delay so it can be re-triggered if clicked again?
                                    // Or just leave it. Leaving it selected is what the user asked.
                                    // "Clicking the hint should select the piece"
                                }

                                PuzzleManager.incrementHints().catch(console.error);
                            }
                        }}
                    >
                        <Text style={styles.btnText}>Show Hint</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.skipBtn}
                        onPress={loadNextPuzzle}
                    >
                        <Text style={styles.skipText}>Skip Puzzle</Text>
                    </TouchableOpacity>

                    <View style={styles.jumpContainer}>
                        <TextInput
                            style={styles.jumpInput}
                            placeholder="Jump to ID..."
                            placeholderTextColor="#666"
                            keyboardType="numeric"
                            value={jumpId}
                            onChangeText={setJumpId}
                        />
                        <TouchableOpacity style={styles.jumpBtn} onPress={jumpToPuzzle}>
                            <Text style={styles.jumpBtnText}>Go</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView >
        </GestureHandlerRootView >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#2a2a2a', // Dark theme like web
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#2a2a2a',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        justifyContent: 'space-between',
    },
    statsBar: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 20,
        paddingBottom: 10,
    },
    statText: {
        color: '#888',
        fontSize: 14,
        fontWeight: '500',
    },
    backBtn: {
        padding: 10,
    },
    backText: {
        color: '#aaa',
        fontSize: 18,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    boardContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1
    },
    controls: {
        padding: 20,
        alignItems: 'center',
    },
    description: {
        color: '#ccc',
        fontSize: 18,
        marginTop: 20,
        marginBottom: 10,
        textAlign: 'center',
    },
    feedbackContainer: {
        height: 50, // Fixed height to reserve space
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        marginBottom: 10,
    },
    feedback: {
        color: '#4ade80', // green
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    text: {
        color: '#fff',
    },
    button: {
        marginTop: 20,
        backgroundColor: '#4ade80',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    hintBtn: {
        backgroundColor: '#d97706', // amber
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 8,
        marginBottom: 10,
    },
    skipBtn: {
        padding: 10,
    },
    btnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    skipText: {
        color: '#888',
        fontSize: 14,
    },
    jumpContainer: {
        flexDirection: 'row',
        marginTop: 20,
        alignItems: 'center',
        gap: 10,
    },
    jumpInput: {
        backgroundColor: '#333',
        color: '#fff',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 8,
        width: 120,
        fontSize: 14,
    },
    jumpBtn: {
        backgroundColor: '#444',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 8,
    },
    jumpBtnText: {
        color: '#fff',
        fontWeight: 'bold',
    }
});

