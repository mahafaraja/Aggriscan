import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraIcon, MenuIcon, LeafIcon, TreeIcon } from '../components/Icons';
import { theme } from '../theme/Index';

interface HomeScreenProps {
  onNavigate: (screen: 'Camera' | 'AddPhoto' | 'History') => void;
  onMenuPress: () => void;
}

function HomeScreen({ onNavigate, onMenuPress }: HomeScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={[
          styles.scrollContent, 
          { paddingTop: insets.top + theme.spacing.lg }
        ]}
      >
        
        {/* Menu Button */}
        <TouchableOpacity style={[styles.menuButton, { top: insets.top + theme.spacing.md }]} onPress={onMenuPress}>
          <MenuIcon size={28} color={theme.colors.textOnDark} />
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Scan the LEAF and find{'\n'}the Disease..</Text>
          <Text style={styles.subtitle}>Reveal the Tree Behind Every Leaf{'\n'}Effortlessly!</Text>
        </View>

        {/* Illustration */}
        <View style={styles.illustrationContainer}>
          <View style={styles.illustration}>
            {/* Leaf Icon */}
            <View style={styles.leafIcon}>
              <LeafIcon size={70} color={theme.colors.mint} />
            </View>
            
            {/* Scanner Frame */}
            <View style={styles.scannerFrame}>
              <View style={styles.scannerCorner} />
              <View style={[styles.scannerCorner, styles.scannerCornerTopRight]} />
              <View style={[styles.scannerCorner, styles.scannerCornerBottomLeft]} />
              <View style={[styles.scannerCorner, styles.scannerCornerBottomRight]} />
            </View>

            {/* Tree Icon */}
            <View style={styles.treeIcon}>
              <TreeIcon size={100} color={theme.colors.green} />
            </View>
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsText}>
            Simply Tap the Scan Button Below{'\n'}and Point at the Leaf to Identify the{'\n'}affected disease
          </Text>
        </View>

        {/* Scan Button */}
        <TouchableOpacity 
          style={styles.scanButton} 
          onPress={() => onNavigate('Camera')}
        >
          <View style={styles.scanButtonInner}>
            <CameraIcon size={40} color={theme.colors.darkTeal} />
          </View>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2D4A3E', // Dark green background matching Figma
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  menuButton: {
    position: 'absolute',
    top: theme.spacing.lg,
    left: theme.spacing.lg,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  menuIcon: {
    // Replaced with SVG icon
  },
  header: {
    width: '100%',
    alignItems: 'center',
    marginTop: theme.spacing.xxl,
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.mint,
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: theme.spacing.md,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.mint,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.9,
  },
  illustrationContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: theme.spacing.xl,
    height: 200,
  },
  illustration: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: theme.spacing.lg,
  },
  leafIcon: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerFrame: {
    width: 100,
    height: 100,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerCorner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: theme.colors.mint,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    top: 0,
    left: 0,
  },
  scannerCornerTopRight: {
    top: 0,
    left: 'auto',
    right: 0,
    borderLeftWidth: 0,
    borderRightWidth: 3,
  },
  scannerCornerBottomLeft: {
    top: 'auto',
    bottom: 0,
    left: 0,
    borderTopWidth: 0,
    borderBottomWidth: 3,
  },
  scannerCornerBottomRight: {
    top: 'auto',
    bottom: 0,
    left: 'auto',
    right: 0,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 3,
    borderBottomWidth: 3,
  },
  treeIcon: {
    width: 100,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionsContainer: {
    width: '100%',
    alignItems: 'center',
    marginVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
  },
  instructionsText: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.mint,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.95,
  },
  scanButton: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.xl,
  },
  scanButtonInner: {
    width: 90,
    height: 90,
    borderRadius: 20,
    backgroundColor: theme.colors.green,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});