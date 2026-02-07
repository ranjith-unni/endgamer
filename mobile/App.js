import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native';
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

  const handleReset = () => {
    // In a real app, use Alert to confirm
    // Alert.alert('Reset Progress', 'Are you sure?', [ ... ])
    PuzzleManager.resetProgress().then(() => {
      loadStats();
      // Alert.alert('Reset', 'Progress has been reset.');
    });
  };

  if (!appIsReady) {
    return null; // Keep native splash screen or show nothing while waiting
  }

  if (currentScreen === 'game') {
    return (
      <SafeAreaProvider>
        <GameScreen difficulty={difficulty} onBack={goHome} />
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

          <TouchableOpacity onPress={handleReset} style={styles.resetBtn}>
            <Text style={styles.resetText}>Reset Progress</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
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
    marginBottom: 50,
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
    color: '#888',
    fontSize: 16,
    marginBottom: 5,
  },
  resetBtn: {
    marginTop: 20,
    padding: 10,
  },
  resetText: {
    color: '#ef4444', // red
    fontSize: 14,
  }
});
