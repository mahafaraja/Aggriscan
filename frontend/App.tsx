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

  useEffect(() => {
    initSQLiteDatabase().catch((error) => {
      console.error('App: SQLite initialization failed:', error);
    });
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
