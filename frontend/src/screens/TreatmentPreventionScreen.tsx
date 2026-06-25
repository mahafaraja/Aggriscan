import React from 'react';
import { Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ArrowLeft2, Health, Scan, ShieldTick } from 'iconsax-react-native';
import { getTreatmentGuide } from '../services/treatmentGuide';
import { theme } from '../theme/Index';
import { ScanPayload } from '../types/scan';

interface TreatmentPreventionScreenProps {
  scan: ScanPayload;
  onBack: () => void;
  onScanAgain: () => void;
}

export default function TreatmentPreventionScreen({
  scan,
  onBack,
  onScanAgain,
}: TreatmentPreventionScreenProps) {
  const guide = getTreatmentGuide(scan.diagnostic.disease_label);

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
          <Text style={styles.title}>{guide.title}</Text>
          {guide.scientificName && (
            <Text style={styles.scientificName}>{guide.scientificName}</Text>
          )}
          <Text style={styles.description}>{guide.description}</Text>

          <GuideSection
            icon={<Health size={15} color={theme.colors.deepTeal} variant="Bold" />}
            title="Treatment"
            items={guide.treatment}
          />
          <GuideSection
            icon={<ShieldTick size={15} color={theme.colors.deepTeal} variant="Bold" />}
            title="Prevention"
            items={guide.prevention}
          />

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

function GuideSection({
  icon,
  title,
  items,
}: {
  icon: React.ReactNode;
  title: string;
  items: string[];
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeading}>
        {icon}
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {items.map((item) => (
        <View key={item} style={styles.bulletRow}>
          <View style={styles.bullet} />
          <Text style={styles.bulletText}>{item}</Text>
        </View>
      ))}
    </View>
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
    height: 260,
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
  title: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '800',
  },
  scientificName: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption.fontSize,
    fontWeight: '700',
    marginTop: 2,
  },
  description: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.caption.fontSize,
    lineHeight: 18,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  section: {
    marginTop: theme.spacing.md,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: theme.spacing.sm,
  },
  sectionTitle: {
    color: theme.colors.darkTeal,
    fontSize: theme.typography.caption.fontSize,
    fontWeight: '800',
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  bullet: {
    width: 5,
    height: 5,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.green,
    marginTop: 7,
    marginRight: theme.spacing.sm,
  },
  bulletText: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontSize: theme.typography.caption.fontSize,
    lineHeight: 18,
  },
  scanButton: {
    minHeight: 42,
    borderRadius: 8,
    backgroundColor: '#5DAF1B',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
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
