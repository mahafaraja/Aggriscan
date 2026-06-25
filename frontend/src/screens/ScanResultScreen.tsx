import React from 'react';
import { Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ArrowLeft2, Health, Scan, ShieldSearch } from 'iconsax-react-native';
import { theme } from '../theme/Index';
import { ScanPayload } from '../types/scan';

interface ScanResultScreenProps {
  scan: ScanPayload;
  onBack: () => void;
  onScanAgain: () => void;
  onTreatment: () => void;
}

export default function ScanResultScreen({
  scan,
  onBack,
  onScanAgain,
  onTreatment,
}: ScanResultScreenProps) {
  const confidence = `${(scan.diagnostic.confidence_score * 100).toFixed(1)}%`;
  const diseaseName = scan.diagnostic.disease_label.replace(/_/g, ' ');
  const isHealthy = scan.diagnostic.disease_label.toLowerCase().includes('healthy');

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
          <View style={styles.statusLine}>
            <Health
              size={15}
              color={isHealthy ? theme.colors.success : theme.colors.deepTeal}
              variant="Bold"
            />
            <Text style={styles.statusText}>
              {isHealthy ? 'Healthy leaf detected' : 'Model identified the disease'}
            </Text>
          </View>

          <Text style={styles.title}>{diseaseName}</Text>

          <View style={styles.metricRow}>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>Crop</Text>
              <Text style={styles.metricValue}>{scan.cropType}</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>Confidence</Text>
              <Text style={styles.metricValue}>{confidence}</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>Severity</Text>
              <Text
                style={[
                  styles.metricValue,
                  scan.diagnostic.severity === 'High' && styles.highSeverity,
                ]}
              >
                {scan.diagnostic.severity}
              </Text>
            </View>
          </View>

          {scan.diagnostic.detected_raw_crop && (
            <Text style={styles.modelDetail}>
              Raw model crop: {scan.diagnostic.detected_raw_crop}
            </Text>
          )}

          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
            onPress={onTreatment}
          >
            <ShieldSearch size={16} color={theme.colors.darkTeal} variant="Bold" />
            <Text style={styles.primaryButtonText}>Treatment & Prevention</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
            onPress={onScanAgain}
          >
            <Scan size={16} color={theme.colors.textOnDark} variant="Linear" />
            <Text style={styles.secondaryButtonText}>Scan Again</Text>
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
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
  },
  statusLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: theme.spacing.sm,
  },
  statusText: {
    color: theme.colors.deepTeal,
    fontSize: theme.typography.caption.fontSize,
    fontWeight: '700',
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '800',
    marginBottom: theme.spacing.md,
  },
  metricRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  metric: {
    flex: 1,
    minHeight: 58,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.sm,
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
  highSeverity: {
    color: theme.colors.error,
  },
  modelDetail: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption.fontSize,
    marginBottom: theme.spacing.md,
  },
  primaryButton: {
    minHeight: 42,
    borderRadius: 8,
    backgroundColor: theme.colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  primaryButtonText: {
    color: theme.colors.darkTeal,
    fontSize: theme.typography.caption.fontSize,
    fontWeight: '800',
  },
  secondaryButton: {
    minHeight: 42,
    borderRadius: 8,
    backgroundColor: '#5DAF1B',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  secondaryButtonText: {
    color: theme.colors.textOnDark,
    fontSize: theme.typography.caption.fontSize,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.82,
  },
});
