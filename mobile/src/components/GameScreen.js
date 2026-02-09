import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, ActivityIndicator, TextInput, Modal, Pressable, Image } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import NativeChessBoard from './NativeChessBoard'; // Changed
import { Chess } from 'chess.js';
import PuzzleManager from '../utils/PuzzleManager';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function GameScreen({ difficulty, onBack, onChangeDifficulty }) {
    const [puzzle, setPuzzle] = useState(null);
    const [chess, setChess] = useState(new Chess());
    const [feedback, setFeedback] = useState('');
    const [loading, setLoading] = useState(true);

    const [hintSquare, setHintSquare] = useState(null);
    const [stats, setStats] = useState({ totalSolved: 0, hintsUsed: 0 });
    const [boardKey, setBoardKey] = useState(0);
    const [jumpId, setJumpId] = useState('');
    const [showSettings, setShowSettings] = useState(false);
    const [showAbout, setShowAbout] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [showLevelComplete, setShowLevelComplete] = useState(false);

    const SETTINGS_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`;

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
            setShowLevelComplete(true);
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
            setShowSettings(false);
        } else {
            Alert.alert('Error', 'Puzzle ID not found');
        }
        setLoading(false);
    };

    const handleReset = async () => {
        await PuzzleManager.resetProgress();
        updateStats();
        loadNextPuzzle();
        setShowResetConfirm(false);
        setShowSettings(false);
    };

    const handleNextLevel = () => {
        setShowLevelComplete(false);
        if (difficulty === 'easy') onChangeDifficulty('medium');
        else if (difficulty === 'medium') onChangeDifficulty('hard');
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
            const delay = PuzzleManager.getStats().successDelay * 1000;
            setTimeout(() => {
                loadNextPuzzle();
            }, delay);
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
                    <TouchableOpacity onPress={() => setShowSettings(true)} style={styles.settingsBtn}>
                        <SvgXml xml={SETTINGS_ICON} width={24} height={24} />
                    </TouchableOpacity>
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
                </View>

                {/* Settings Modal */}
                <Modal
                    visible={showSettings}
                    animationType="fade"
                    transparent={true}
                    onRequestClose={() => setShowSettings(false)}
                >
                    <Pressable
                        style={styles.modalOverlay}
                        onPress={() => setShowSettings(false)}
                    >
                        <Pressable style={styles.settingsModal}>
                            <Text style={styles.modalTitle}>Settings</Text>

                            <View style={styles.settingsGroup}>
                                <Text style={styles.settingsLabel}>Go to Puzzle #</Text>
                                <View style={styles.jumpContainer}>
                                    <TextInput
                                        style={styles.jumpInput}
                                        placeholder="Enter number..."
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

                            <View style={styles.separator} />

                            <TouchableOpacity
                                style={styles.aboutBtn}
                                onPress={() => {
                                    setShowSettings(false);
                                    setShowAbout(true);
                                }}
                            >
                                <Text style={styles.aboutBtnText}>About EndGamer</Text>
                            </TouchableOpacity>

                            <View style={styles.separator} />

                            <TouchableOpacity
                                style={styles.resetBtn}
                                onPress={() => setShowResetConfirm(true)}
                            >
                                <Text style={styles.resetBtnText}>Reset Progress</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.closeBtn}
                                onPress={() => setShowSettings(false)}
                            >
                                <Text style={styles.closeBtnText}>Close</Text>
                            </TouchableOpacity>
                        </Pressable>
                    </Pressable>
                </Modal>

                {/* About Modal */}
                <Modal
                    visible={showAbout}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => setShowAbout(false)}
                >
                    <View style={styles.aboutOverlay}>
                        <View style={styles.aboutContent}>
                            <Image
                                source={require('../../assets/splash-icon.png')}
                                style={styles.aboutLogo}
                                resizeMode="contain"
                            />
                            <Text style={styles.aboutTitle}>EndGamer</Text>
                            <Text style={styles.aboutVersion}>v1.0.0 (2026)</Text>

                            <Text style={styles.aboutDescription}>
                                Master the Endgame. Train tactics with select mate-in-N puzzles for chess enthusiasts.
                            </Text>

                            <View style={styles.featuresList}>
                                <Text style={[styles.featureItem, { textAlign: 'center' }]}>300+ Curated Endgame Puzzles</Text>
                                <Text style={[styles.featureItem, { textAlign: 'center' }]}>Mate in 1, 2, and 3 Challenges</Text>
                                <Text style={[styles.featureItem, { textAlign: 'center' }]}>Intelligent Piece Highlighting Hints</Text>
                                <Text style={[styles.featureItem, { textAlign: 'center' }]}>Progress Synchronization</Text>
                            </View>

                            <Text style={styles.authorText}>Developed by WildCraft Labs</Text>

                            <TouchableOpacity
                                style={styles.closeAboutBtn}
                                onPress={() => setShowAbout(false)}
                            >
                                <Text style={styles.closeAboutBtnText}>Back to the Game!</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                {/* Reset Confirmation Modal */}
                <Modal
                    visible={showResetConfirm}
                    animationType="fade"
                    transparent={true}
                    onRequestClose={() => setShowResetConfirm(false)}
                >
                    <TouchableOpacity
                        style={styles.modalOverlay}
                        activeOpacity={1}
                        onPress={() => setShowResetConfirm(false)}
                    >
                        <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
                            <Text style={styles.modalTitle}>Reset Progress?</Text>
                            <Text style={styles.modalMessage}>
                                This will clear all your solved puzzles and stats. This action cannot be undone.
                            </Text>

                            <View style={styles.modalButtons}>
                                <TouchableOpacity
                                    style={[styles.modalBtn, styles.cancelModalBtn]}
                                    onPress={() => setShowResetConfirm(false)}
                                >
                                    <Text style={styles.cancelBtnText}>Cancel</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.modalBtn, styles.confirmModalBtn]}
                                    onPress={handleReset}
                                >
                                    <Text style={styles.confirmBtnText}>Reset Everything</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </TouchableOpacity>
                </Modal>

                {/* Level Complete / Promotion Modal */}
                <Modal
                    visible={showLevelComplete}
                    animationType="fade"
                    transparent={true}
                    onRequestClose={() => setShowLevelComplete(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>
                                {difficulty === 'hard' ? "Game Complete!" : "Level Complete!"}
                            </Text>
                            <Text style={styles.modalMessage}>
                                {difficulty === 'hard'
                                    ? "You have solved all puzzles! Congratulations on mastering the endgame!"
                                    : `You have solved all ${difficulty} puzzles. You are being promoted to the ${difficulty === 'easy' ? 'Medium' : 'Hard'} level of challenge.`}
                            </Text>

                            <View style={styles.modalButtons}>
                                {difficulty !== 'hard' ? (
                                    <TouchableOpacity
                                        style={[styles.modalBtn, styles.confirmModalBtn]}
                                        onPress={handleNextLevel}
                                    >
                                        <Text style={styles.confirmBtnText}>Let's Go!</Text>
                                    </TouchableOpacity>
                                ) : (
                                    <TouchableOpacity
                                        style={[styles.modalBtn, styles.cancelModalBtn]}
                                        onPress={() => setShowLevelComplete(false)}
                                    >
                                        <Text style={styles.cancelBtnText}>Dismiss</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    </View>
                </Modal>
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
        flex: 1,
        textAlign: 'center',
    },
    settingsBtn: {
        padding: 10,
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
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    settingsModal: {
        backgroundColor: '#2a2a2a',
        width: '85%',
        maxWidth: 400,
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#444',
    },
    modalTitle: {
        color: '#fff',
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    settingsGroup: {
        width: '100%',
        marginBottom: 20,
    },
    settingsLabel: {
        color: '#aaa',
        fontSize: 14,
        marginBottom: 10,
    },
    separator: {
        height: 1,
        backgroundColor: '#444',
        width: '100%',
        marginVertical: 15,
    },
    resetBtn: {
        width: '100%',
        padding: 12,
        alignItems: 'center',
    },
    resetBtnText: {
        color: '#ef4444',
        fontSize: 16,
        fontWeight: '500',
    },
    closeBtn: {
        marginTop: 20,
        backgroundColor: '#444',
        width: '100%',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    closeBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    aboutBtn: {
        width: '100%',
        paddingVertical: 12,
        alignItems: 'center',
    },
    aboutBtnText: {
        color: '#aaaaaa',
        fontSize: 14,
    },
    aboutOverlay: {
        flex: 1,
        backgroundColor: '#1a1a1a',
        justifyContent: 'center',
        alignItems: 'center',
    },
    aboutContent: {
        width: '100%',
        maxWidth: 400,
        padding: 30,
        alignItems: 'center',
    },
    aboutLogo: {
        width: 120,
        height: 120,
        marginBottom: 10,
    },
    aboutTitle: {
        color: '#fff',
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    aboutVersion: {
        color: '#666',
        fontSize: 14,
        marginBottom: 24,
    },
    aboutDescription: {
        color: '#ccc',
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 30,
    },
    featuresList: {
        width: '100%',
        marginBottom: 40,
        gap: 8,
    },
    featureItem: {
        color: '#aaa',
        fontSize: 14,
    },
    authorText: {
        color: '#888',
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 40,
    },
    closeAboutBtn: {
        backgroundColor: '#22c55e',
        paddingVertical: 14,
        paddingHorizontal: 60,
        borderRadius: 12,
    },
    closeAboutBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#2a2a2a',
        borderRadius: 20,
        padding: 24,
        width: '100%',
        maxWidth: 340,
        alignItems: 'center',
    },
    modalTitle: {
        color: '#ffffff',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    modalMessage: {
        color: '#aaaaaa',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    modalBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
    },
    cancelModalBtn: {
        backgroundColor: '#3a3a3a',
    },
    confirmModalBtn: {
        backgroundColor: '#ef4444',
    },
    cancelBtnText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    confirmBtnText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
});

