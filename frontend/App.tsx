import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AuthFlow from './src/screens/auth/AuthFlow';
import HomeScreen from './src/screens/HomeScreen';
import CameraScreen from './src/screens/CameraScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import AddPhotoScreen from './src/screens/AddPhotoScreen';
import ScanResultScreen from './src/screens/ScanResultScreen';
import TreatmentPreventionScreen from './src/screens/TreatmentPreventionScreen';
import HealthyScreen from './src/screens/HealthyScreen';
import { initSQLiteDatabase } from './src/services/db';
import { theme } from './src/theme/Index';
import { ScanPayload } from './src/types/scan';
import * as SecureStore from 'expo-secure-store';
import { setupAutoSync } from './src/services/sync';

type Screen =
  | 'Auth'
  | 'Home'
  | 'Camera'
  | 'AddPhoto'
  | 'History'
  | 'ScanResult'
  | 'TreatmentPrevention'
  | 'Healthy';

function App() {
  const [screen, setScreen] = useState<Screen>('Auth');
  const [latestScan, setLatestScan] = useState<ScanPayload | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    initSQLiteDatabase().catch((error) => {
      console.error('App: SQLite initialization failed:', error);
    });

    // Check for existing authentication on app startup
    const checkAuthStatus = async () => {
      try {
        const token = await SecureStore.getItemAsync('auth_token');
        if (token) {
          // User is already authenticated, go directly to Home
          setScreen('Home');
        }
      } catch (error) {
        console.error('App: Auth check failed:', error);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuthStatus();

    // Setup auto-sync for reports
    const cleanupSync = setupAutoSync((result) => {
      if (result.synced > 0) {
        console.log(`App: Auto-synced ${result.synced} reports to backend`);
      }
    });

    // Cleanup on unmount
    return () => {
      cleanupSync();
    };
  }, []);

  const onNavigate = (nextScreen: Exclude<Screen, 'Auth' | 'ScanResult' | 'TreatmentPrevention' | 'Healthy'>) =>
    setScreen(nextScreen);

  const handleScanComplete = (scan: ScanPayload) => {
    setLatestScan(scan);
    const isHealthy = scan.diagnostic.disease_label.toLowerCase().includes('healthy');
    setScreen(isHealthy ? 'Healthy' : 'ScanResult');
  };

  const goToScanAgain = () => {
    setLatestScan(null);
    setScreen('Camera');
  };

  if (isCheckingAuth) {
    // Show a loading screen while checking authentication
    return (
      <SafeAreaProvider>
        <View style={styles.container}>
          <StatusBar style="light" />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <StatusBar style="light" />
        {screen === 'Auth' && <AuthFlow onAuthSuccess={() => setScreen('Home')} />}
        {screen === 'Home' && <HomeScreen onNavigate={onNavigate} />}
        {screen === 'Camera' && (
          <CameraScreen onNavigate={onNavigate} onScanComplete={handleScanComplete} />
        )}
        {screen === 'AddPhoto' && (
          <AddPhotoScreen onBack={() => setScreen('Home')} onScanComplete={handleScanComplete} />
        )}
        {screen === 'History' && <HistoryScreen onNavigate={onNavigate} />}
        {screen === 'ScanResult' && latestScan && (
          <ScanResultScreen
            scan={latestScan}
            onBack={() => setScreen('Camera')}
            onScanAgain={goToScanAgain}
            onTreatment={() => setScreen('TreatmentPrevention')}
          />
        )}
        {screen === 'TreatmentPrevention' && latestScan && (
          <TreatmentPreventionScreen
            scan={latestScan}
            onBack={() => setScreen('ScanResult')}
            onScanAgain={goToScanAgain}
          />
        )}
        {screen === 'Healthy' && latestScan && (
          <HealthyScreen
            scan={latestScan}
            onBack={() => setScreen('Camera')}
            onScanAgain={goToScanAgain}
          />
        )}
      </View>
    </SafeAreaProvider>
  );
}

export default App;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
});
