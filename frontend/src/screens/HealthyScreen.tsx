import React from 'react';
import { Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ArrowLeft2, Scan, TickCircle } from 'iconsax-react-native';
import { theme } from '../theme/Index';
import { ScanPayload } from '../types/scan';

interface HealthyScreenProps {
  scan: ScanPayload;
  onBack: () => void;
  onScanAgain: () => void;
}

export default function HealthyScreen({ scan, onBack, onScanAgain }: HealthyScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} bounces={false}>
        <View style={styles.hero}>
          <Image source={{ uri: scan.imageUri }} style={styles.heroImage} />
          <Pressable accessibilityRole="button" style={styles.backButton} onPress={onBack}>
            <ArrowLeft2 size={20} color={theme.colors.darkTeal} variant="Linear" />
          </Pressable>
        </View>

        <View style={styles.sheet}>
          <View style={styles.statusContainer}>
            <View style={styles.iconContainer}>
              <TickCircle size={48} color={theme.colors.success} variant="Bold" />
            </View>
            <Text style={styles.title}>Healthy Leaf</Text>
          </View>

          <View style={styles.metricRow}>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>Crop</Text>
              <Text style={styles.metricValue}>{scan.cropType}</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>Confidence</Text>
              <Text style={styles.metricValue}>
                {(scan.diagnostic.confidence_score * 100).toFixed(1)}%
              </Text>
            </View>
          </View>

          <Text style={styles.message}>
            Great news! Your leaf appears to be healthy with no signs of disease detected.
          </Text>

          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [styles.scanButton, pressed && styles.pressed]}
            onPress={onScanAgain}
          >
            <Scan size={16} color={theme.colors.textOnDark} variant="Linear" />
            <Text style={styles.scanButtonText}>Scan Again</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  content: {
    flexGrow: 1,
    backgroundColor: theme.colors.surface,
  },
  hero: {
    height: 310,
    backgroundColor: theme.colors.darkTeal,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 34,
    height: 34,
    borderRadius: theme.radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.82)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheet: {
    marginTop: -12,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.lg,
    alignItems: 'center',
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
  },
  metricRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
    width: '100%',
  },
  metric: {
    flex: 1,
    minHeight: 58,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.sm,
    alignItems: 'center',
  },
  metricLabel: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 3,
  },
  metricValue: {
    color: theme.colors.darkTeal,
    fontSize: 12,
    fontWeight: '800',
  },
  message: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.body.fontSize,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.md,
  },
  scanButton: {
    minHeight: 42,
    borderRadius: 8,
    backgroundColor: '#5DAF1B',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
    width: '100%',
  },
  scanButtonText: {
    color: theme.colors.textOnDark,
    fontSize: theme.typography.caption.fontSize,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.82,
  },
});
