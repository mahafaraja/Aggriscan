import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView } from 'react-native';
import { BrandLogo } from '../components/BrandLogo';
import { theme } from '../theme/Index';

interface GetStartedScreenProps {
  onGetStarted: () => void;
}

export default function GetStartedScreen({ onGetStarted }: GetStartedScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <BrandLogo style={styles.logo} />
        
        <Text style={styles.welcomeText}>Welcome Samin!</Text>
        
        <TouchableOpacity style={styles.button} onPress={onGetStarted}>
          <Text style={styles.buttonText}>Get Start</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  logo: {
    marginBottom: theme.spacing.xl,
  },
  welcomeText: {
    fontSize: theme.typography.h1.fontSize,
    fontWeight: '800',
    color: theme.colors.darkTeal,
    marginBottom: theme.spacing.xl * 2,
  },
  button: {
    backgroundColor: theme.colors.deepTeal,
    paddingHorizontal: theme.spacing.xl * 2,
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.radius.card,
    shadowColor: theme.colors.darkTeal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: theme.colors.textOnDark,
    fontSize: theme.typography.body.fontSize,
    fontWeight: '700',
  },
});