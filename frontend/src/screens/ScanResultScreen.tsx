import React from 'react';
import { Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ArrowLeft2, Health, Scan, ShieldSearch, DocumentText } from 'iconsax-react-native';
import { theme } from '../theme/Index';
import { ScanPayload, PlantAnalysisResponse } from '../types/scan';

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
  
  // Check if this is a Green-Sense analysis
  const plantAnalysis = scan.diagnostic.plant_analysis as PlantAnalysisResponse | undefined;
  const isGreenSense = plantAnalysis && plantAnalysis.image_validated && plantAnalysis.plant_identified;
  
  // Get service info if Green-Sense was used
  const serviceUsed = isGreenSense ? plantAnalysis.summary.service_used : 'TFLite Model';
  const fallbackUsed = isGreenSense ? plantAnalysis.summary.fallback_used : false;

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
              {isHealthy ? 'Healthy leaf detected' : 'Disease identified'}
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

          {/* Green-Sense Analysis Info */}
          {isGreenSense && (
            <View style={[styles.greenSenseInfo, { backgroundColor: '#E8F5E9' }]}>
              <Text style={styles.greenSenseTitle}>🌱 Green-Sense Analysis</Text>
              <View style={styles.serviceRow}>
                <Text style={styles.serviceLabel}>Service Used:</Text>
                <Text style={styles.serviceValue}>
                  {serviceUsed} {fallbackUsed && '(Fallback)'}
                </Text>
              </View>
              {plantAnalysis.care_recommendations_generated && (
                <View style={styles.availableRow}>
                  <Text style={styles.availableText}>✓ Care guide available</Text>
                </View>
              )}
              {plantAnalysis.pdf_report_generated && (
                <View style={styles.availableRow}>
                  <Text style={styles.availableText}>✓ PDF report generated</Text>
                </View>
              )}
            </View>
          )}

          {scan.diagnostic.detected_raw_crop && !isGreenSense && (
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

          {/* Care Recommendations Section */}
          {isGreenSense && plantAnalysis.care_recommendations_generated && (
            <View style={styles.careSection}>
              <Text style={styles.careTitle}>Treatment & Prevention</Text>
              
              {plantAnalysis.care_recommendations.care_guide.disease_info && (
                <View style={styles.careCard}>
                  <Text style={styles.careDiseaseName}>
                    {plantAnalysis.care_recommendations.care_guide.disease_info.name}
                  </Text>
                  <View style={styles.severityBadge}>
                    <Text style={styles.severityText}>
                      Severity: {plantAnalysis.care_recommendations.care_guide.disease_info.severity}
                    </Text>
                  </View>
                  
                  {plantAnalysis.care_recommendations.care_guide.disease_info.symptoms.length > 0 && (
                    <View style={styles.careSubsection}>
                      <Text style={styles.careSubtitle}>Symptoms:</Text>
                      {plantAnalysis.care_recommendations.care_guide.disease_info.symptoms.map((symptom, idx) => (
                        <Text key={idx} style={styles.careBullet}>• {symptom}</Text>
                      ))}
                    </View>
                  )}
                  
                  {plantAnalysis.care_recommendations.care_guide.disease_info.immediate_actions.length > 0 && (
                    <View style={styles.careSubsection}>
                      <Text style={styles.careSubtitle}>Immediate Actions:</Text>
                      {plantAnalysis.care_recommendations.care_guide.disease_info.immediate_actions.map((action, idx) => (
                        <Text key={idx} style={styles.careBullet}>• {action}</Text>
                      ))}
                    </View>
                  )}
                </View>
              )}
              
              {plantAnalysis.care_recommendations.care_guide.treatment && (
                <View style={styles.careCard}>
                  <Text style={styles.careSubtitle}>Treatment Options:</Text>
                  
                  {plantAnalysis.care_recommendations.care_guide.treatment.chemical.length > 0 && (
                    <View style={styles.careSubsection}>
                      <Text style={styles.careSubtitle}>Chemical:</Text>
                      {plantAnalysis.care_recommendations.care_guide.treatment.chemical.map((treatment, idx) => (
                        <Text key={idx} style={styles.careBullet}>• {treatment}</Text>
                      ))}
                    </View>
                  )}
                  
                  {plantAnalysis.care_recommendations.care_guide.treatment.organic.length > 0 && (
                    <View style={styles.careSubsection}>
                      <Text style={styles.careSubtitle}>Organic:</Text>
                      {plantAnalysis.care_recommendations.care_guide.treatment.organic.map((treatment, idx) => (
                        <Text key={idx} style={styles.careBullet}>• {treatment}</Text>
                      ))}
                    </View>
                  )}
                </View>
              )}
              
              {plantAnalysis.care_recommendations.care_guide.prevention && plantAnalysis.care_recommendations.care_guide.prevention.length > 0 && (
                <View style={styles.careCard}>
                  <Text style={styles.careSubtitle}>Prevention:</Text>
                  {plantAnalysis.care_recommendations.care_guide.prevention!.map((tip, idx) => (
                    <Text key={idx} style={styles.careBullet}>• {tip}</Text>
                  ))}
                </View>
              )}
            </View>
          )}

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
  greenSenseInfo: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.green || '#4CAF50',
  },
  greenSenseTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.darkTeal,
    marginBottom: theme.spacing.sm,
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  serviceLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  serviceValue: {
    fontSize: 12,
    color: theme.colors.darkTeal,
    fontWeight: '700',
  },
  availableRow: {
    marginTop: 4,
  },
  availableText: {
    fontSize: 11,
    color: theme.colors.green || '#2E7D32',
    fontWeight: '600',
  },
  reportButton: {
    minHeight: 42,
    borderRadius: 8,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.green || '#4CAF50',
  },
  reportButtonText: {
    color: theme.colors.darkTeal,
    fontSize: theme.typography.caption.fontSize,
    fontWeight: '800',
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
  careSection: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: '#F5F5F5',
    borderRadius: theme.radius.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  careTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.darkTeal,
    marginBottom: theme.spacing.md,
  },
  careCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  careDiseaseName: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.deepTeal,
    marginBottom: theme.spacing.sm,
  },
  severityBadge: {
    backgroundColor: theme.colors.warning || '#FF9800',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  severityText: {
    color: theme.colors.surface,
    fontSize: 11,
    fontWeight: '700',
  },
  careSubsection: {
    marginTop: theme.spacing.sm,
  },
  careSubtitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.darkTeal,
    marginBottom: 4,
  },
  careBullet: {
    fontSize: 12,
    color: theme.colors.textPrimary,
    lineHeight: 18,
    marginBottom: 2,
    paddingLeft: 8,
  },
});
