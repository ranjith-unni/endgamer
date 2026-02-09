import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, Modal } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import GameScreen from './src/components/GameScreen';
import PuzzleManager from './src/utils/PuzzleManager';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('home'); // 'home', 'game'
  const [difficulty, setDifficulty] = useState('easy');

  const [stats, setStats] = useState({ totalPoints: 0, totalSolved: 0, hintsUsed: 0 });
  const [appIsReady, setAppIsReady] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load fonts, make any API calls you need to do here
        await PuzzleManager.init();
        loadStats();
        // Artificially delay for at least 2 seconds
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (e) {
        console.warn(e);
      } finally {
        // Tell the application to render
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  useEffect(() => {
    if (appIsReady) {
      SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  useEffect(() => {
    if (currentScreen === 'home') {
      loadStats();
    }
  }, [currentScreen]);

  const loadStats = () => {
    setStats(PuzzleManager.getStats());
  };

  const startGame = (level) => {
    setDifficulty(level);
    setCurrentScreen('game');
  };

  const goHome = () => {
    setCurrentScreen('home');
  };

  const handleReset = async () => {
    await PuzzleManager.resetProgress();
    loadStats();
    setShowResetConfirm(false);
  };

  if (!appIsReady) {
    return (
      <View style={styles.splashContainer}>
        <Image
          source={require('./assets/splash-icon.png')}
          style={styles.splashImage}
          resizeMode="contain"
        />
      </View>
    );
  }

  if (currentScreen === 'game') {
    return (
      <SafeAreaProvider>
        <GameScreen difficulty={difficulty} onBack={goHome} onChangeDifficulty={setDifficulty} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <StatusBar style="light" />

        <View style={styles.content}>
          <Text style={styles.title}>EndGamer</Text>
          <Text style={styles.subtitle}>Chess Endgame Trainer</Text>

          <View style={styles.menu}>
            <TouchableOpacity
              style={[styles.button, styles.easyBtn]}
              onPress={() => startGame('easy')}
            >
              <Text style={styles.btnText}>Easy (Mate in 1)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.mediumBtn]}
              onPress={() => startGame('medium')}
            >
              <Text style={styles.btnText}>Medium (Mate in 2)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.hardBtn]}
              onPress={() => startGame('hard')}
            >
              <Text style={styles.btnText}>Hard (Mate in 3)</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statsContainer}>
            <Text style={styles.statsText}>Unsolved Puzzles: {stats.totalUnsolved}</Text>
            <Text style={styles.statsText}>Solved: {stats.totalSolved}</Text>
            <Text style={styles.statsText}>Hints Used: {stats.hintsUsed}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity onPress={() => setShowAbout(true)} style={styles.aboutBtn}>
            <Text style={styles.aboutText}>About EndGamer</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setShowResetConfirm(true)} style={styles.resetBtn}>
            <Text style={styles.resetText}>Reset Progress</Text>
          </TouchableOpacity>
        </View>

        {/* About Modal */}
        {showAbout && (
          <View style={styles.aboutOverlay}>
            <View style={styles.aboutContent}>
              <Image
                source={require('./assets/splash-icon.png')}
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
        )}

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
                  style={[styles.modalBtn, styles.cancelBtn]}
                  onPress={() => setShowResetConfirm(false)}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalBtn, styles.confirmBtn]}
                  onPress={handleReset}
                >
                  <Text style={styles.confirmBtnText}>Reset Everything</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 40,
  },
  splashContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashImage: {
    width: 400,
    height: 400,
  },
  content: {
    width: '100%',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 18,
    color: '#aaaaaa',
    marginBottom: 80, // Increased spacing for better vertical centering
  },
  menu: {
    width: '100%',
    maxWidth: 300,
    gap: 15,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  easyBtn: {
    backgroundColor: '#22c55e', // green-500
  },
  mediumBtn: {
    backgroundColor: '#eab308', // yellow-500
  },
  hardBtn: {
    backgroundColor: '#ef4444', // red-500
  },
  btnText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  statsContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  statsText: {
    color: '#aaaaaa', // Same as subtitle
    fontSize: 16,
    marginBottom: 5,
  },
  footer: {
    alignItems: 'center',
    gap: 12,
    paddingBottom: 20,
  },
  aboutBtn: {
    padding: 10,
  },
  aboutText: {
    color: '#ffffff',
    fontSize: 14,
  },
  resetBtn: {
    padding: 10,
  },
  resetText: {
    color: '#ef4444',
    fontSize: 14,
    opacity: 0.8,
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
  cancelBtn: {
    backgroundColor: '#3a3a3a',
  },
  confirmBtn: {
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
  aboutOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
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
});
