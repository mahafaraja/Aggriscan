import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { getLocalHistory, LocalReport } from '../services/db';
import { syncOfflineReports } from '../services/sync';
import { theme } from '../theme/Index';

interface StatisticsScreenProps {
  onNavigate: (screen: 'Home' | 'Camera' | 'AddPhoto' | 'History') => void;
  onBack: () => void;
}

function StatisticsScreen({ onNavigate, onBack }: StatisticsScreenProps) {
  const [totalScans, setTotalScans] = useState<number>(0);
  const [pendingSync, setPendingSync] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [cropDistribution, setCropDistribution] = useState<{ [key: string]: number }>({});
  const [diseaseDistribution, setDiseaseDistribution] = useState<{ [key: string]: number }>({});
  const [severityBreakdown, setSeverityBreakdown] = useState<{ Low: number; Medium: number; High: number }>({ Low: 0, Medium: 0, High: 0 });
  const [avgConfidence, setAvgConfidence] = useState<number>(0);
  const [modelUsage, setModelUsage] = useState<{ [key: string]: number }>({});
  const [recentScans, setRecentScans] = useState<LocalReport[]>([]);

  const loadDashboardStats = async () => {
    try {
      const history = await getLocalHistory();
      setTotalScans(history.length);
      
      const pendingCount = history.filter(r => r.sync_status === 'PENDING').length;
      setPendingSync(pendingCount);

      // Calculate crop type distribution
      const cropCounts: { [key: string]: number } = {};
      history.forEach(report => {
        const crop = report.crop_type || 'Unknown';
        cropCounts[crop] = (cropCounts[crop] || 0) + 1;
      });
      setCropDistribution(cropCounts);

      // Calculate disease distribution
      const diseaseCounts: { [key: string]: number } = {};
      history.forEach(report => {
        const disease = report.disease_label || 'Unknown';
        diseaseCounts[disease] = (diseaseCounts[disease] || 0) + 1;
      });
      setDiseaseDistribution(diseaseCounts);

      // Calculate severity breakdown
      const severity = { Low: 0, Medium: 0, High: 0 };
      history.forEach(report => {
        const sev = report.severity || 'Low';
        if (severity[sev as keyof typeof severity] !== undefined) {
          severity[sev as keyof typeof severity]++;
        }
      });
      setSeverityBreakdown(severity);

      // Calculate average confidence
      if (history.length > 0) {
        const totalConfidence = history.reduce((sum, report) => sum + (report.confidence_score || 0), 0);
        const avg = totalConfidence / history.length;
        setAvgConfidence(avg);
      }

      // Calculate model usage from real data
      const modelCounts: { [key: string]: number } = {};
      history.forEach(report => {
        // Check if model_used is stored in the report (we'll add it to the interface)
        const modelUsed = (report as any).model_used;
        if (modelUsed) {
          modelCounts[modelUsed] = (modelCounts[modelUsed] || 0) + 1;
        } else {
          // If not tracked, count as "local_inference"
          modelCounts['local_inference'] = (modelCounts['local_inference'] || 0) + 1;
        }
      });
      setModelUsage(modelCounts);

      // Store recent scans with real GPS data for display
      setRecentScans(history.slice(0, 5));

    } catch (error) {
      console.error("Dashboard: Error fetching logs", error);
    }
  };

  useEffect(() => {
    loadDashboardStats();
    const interval = setInterval(loadDashboardStats, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleManualSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const result = await syncOfflineReports();
      alert(result.synced > 0 ? `Successfully uploaded ${result.synced} records!` : "No pending records uploaded.");
      await loadDashboardStats();
    } catch (e) {
      alert("Synchronization failed. Check server connectivity.");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Statistics</Text>
        </View>

        {/* Sync Status Banner */}
        <View style={[styles.syncBanner, pendingSync > 0 ? styles.syncWarning : styles.syncSuccess]}>
          <Text style={styles.syncText}>
            {pendingSync > 0 
              ? `${pendingSync} Diagnostics Cached Offline (Pending Sync)` 
              : 'All Data Synchronized to PostGIS'
            }
          </Text>
          {pendingSync > 0 && (
            <TouchableOpacity 
              style={styles.syncButton} 
              onPress={handleManualSync}
              disabled={isSyncing}
            >
              <Text style={styles.syncButtonText}>{isSyncing ? 'Syncing...' : 'Sync Now'}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Metrics Section */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{totalScans}</Text>
            <Text style={styles.statLabel}>Total Scans</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, styles.statNumberError]}>
              {pendingSync}
            </Text>
            <Text style={styles.statLabel}>Offline Queue</Text>
          </View>
        </View>

        {/* Performance Metrics */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Performance Metrics</Text>
          
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Average Confidence Score</Text>
            <Text style={styles.metricValue}>{(avgConfidence * 100).toFixed(1)}%</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${avgConfidence * 100}%` }]} />
            </View>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Total Scans Completed</Text>
            <Text style={styles.metricValue}>{totalScans}</Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Unique Diseases Detected</Text>
            <Text style={styles.metricValue}>{Object.keys(diseaseDistribution).length} Types</Text>
          </View>
        </View>

        {/* Severity Breakdown */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Severity Breakdown</Text>
          
          <View style={styles.severityContainer}>
            <View style={styles.severityCard}>
              <View style={[styles.severityIndicator, { backgroundColor: theme.colors.success }]} />
              <View style={styles.severityInfo}>
                <Text style={styles.severityLabel}>Low</Text>
                <Text style={styles.severityCount}>{severityBreakdown.Low}</Text>
              </View>
            </View>

            <View style={styles.severityCard}>
              <View style={[styles.severityIndicator, { backgroundColor: theme.colors.warning }]} />
              <View style={styles.severityInfo}>
                <Text style={styles.severityLabel}>Medium</Text>
                <Text style={styles.severityCount}>{severityBreakdown.Medium}</Text>
              </View>
            </View>

            <View style={styles.severityCard}>
              <View style={[styles.severityIndicator, { backgroundColor: theme.colors.error }]} />
              <View style={styles.severityInfo}>
                <Text style={styles.severityLabel}>High</Text>
                <Text style={styles.severityCount}>{severityBreakdown.High}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Crop Distribution */}
        {Object.keys(cropDistribution).length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Crop Distribution</Text>
            {Object.entries(cropDistribution)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 5)
              .map(([crop, count]) => {
                const percentage = totalScans > 0 ? (count / totalScans) * 100 : 0;
                return (
                  <View key={crop} style={styles.distributionCard}>
                    <View style={styles.distributionHeader}>
                      <Text style={styles.distributionLabel}>{crop}</Text>
                      <Text style={styles.distributionCount}>{count} scans</Text>
                    </View>
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: `${percentage}%` }]} />
                    </View>
                  </View>
                );
              })}
          </View>
        )}

        {/* Top Diseases */}
        {Object.keys(diseaseDistribution).length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Top Detected Diseases</Text>
            {Object.entries(diseaseDistribution)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 5)
              .map(([disease, count]) => (
                <View key={disease} style={styles.diseaseCard}>
                  <View style={styles.diseaseInfo}>
                    <Text style={styles.diseaseName}>{disease}</Text>
                    <Text style={styles.diseaseCount}>{count} detection{count !== 1 ? 's' : ''}</Text>
                  </View>
                </View>
              ))}
          </View>
        )}

        {/* Model Usage Statistics */}
        {Object.keys(modelUsage).length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Model Usage</Text>
            {Object.entries(modelUsage)
              .sort(([, a], [, b]) => b - a)
              .map(([model, count]) => (
                <View key={model} style={styles.modelCard}>
                  <View style={styles.modelInfo}>
                    <Text style={styles.modelName}>{model.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Text>
                    <Text style={styles.modelCount}>{count} scan{count !== 1 ? 's' : ''}</Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${totalScans > 0 ? (count / totalScans) * 100 : 0}%` }]} />
                  </View>
                </View>
              ))}
          </View>
        )}

        {/* Recent Scans with Real GPS Locations */}
        {recentScans.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Recent Scans (Real GPS Data)</Text>
            {recentScans.map((scan) => (
              <View key={scan.id} style={styles.recentScanCard}>
                <View style={styles.recentScanHeader}>
                  <Text style={styles.recentScanCrop}>{scan.crop_type}</Text>
                  <View style={[styles.badge, scan.sync_status === 'SYNCED' ? styles.syncedBadge : styles.pendingBadge]}>
                    <Text style={[styles.badgeText, scan.sync_status === 'SYNCED' ? styles.syncedText : styles.pendingText]}>
                      {scan.sync_status}
                    </Text>
                  </View>
                </View>
                <Text style={styles.recentScanDisease}>{scan.disease_label.replace(/_/g, ' ')}</Text>
                <View style={styles.gpsRow}>
                  <Text style={styles.gpsLabel}>📍 Real Location:</Text>
                  <Text style={styles.gpsCoords}>
                    {scan.latitude.toFixed(6)}, {scan.longitude.toFixed(6)}
                  </Text>
                </View>
                <Text style={styles.recentScanDate}>
                  {new Date(scan.offline_created_at).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity 
            style={styles.actionCard} 
            onPress={() => onNavigate('Camera')}
          >
            <Text style={styles.actionText}>New Scan</Text>
            <Text style={styles.actionArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => onNavigate('History')}
          >
            <Text style={styles.actionText}>View History</Text>
            <Text style={styles.actionArrow}>→</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

export default StatisticsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  backIcon: {
    fontSize: 28,
    color: theme.colors.deepTeal,
    fontWeight: '300',
  },
  title: {
    fontSize: theme.typography.h1.fontSize,
    fontWeight: '800',
    color: theme.colors.darkTeal,
  },
  syncBanner: {
    width: '100%',
    borderRadius: theme.radius.input,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  syncWarning: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.warning,
  },
  syncSuccess: {
    backgroundColor: theme.colors.mint,
    borderWidth: 1,
    borderColor: theme.colors.success,
  },
  syncText: {
    fontSize: theme.typography.caption.fontSize,
    fontWeight: '600',
    color: theme.colors.deepTeal,
    flex: 1,
    paddingRight: theme.spacing.sm,
  },
  syncButton: {
    backgroundColor: theme.colors.darkTeal,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.input / 2,
  },
  syncButtonText: {
    color: theme.colors.textOnDark,
    fontSize: theme.typography.caption.fontSize,
    fontWeight: '700',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: theme.spacing.lg,
  },
  statCard: {
    backgroundColor: theme.colors.surface,
    width: '48%',
    borderRadius: theme.radius.card,
    padding: theme.spacing.lg,
    alignItems: 'center',
    shadowColor: theme.colors.darkTeal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  statNumber: {
    fontSize: theme.typography.h1.fontSize,
    fontWeight: '800',
    color: theme.colors.deepTeal,
  },
  statNumberError: {
    color: theme.colors.error,
  },
  statLabel: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm / 2,
    fontWeight: '500',
  },
  sectionContainer: {
    width: '100%',
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.h2.fontSize,
    fontWeight: '700',
    color: theme.colors.darkTeal,
    marginBottom: theme.spacing.md,
  },
  metricCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.card,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    shadowColor: theme.colors.darkTeal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  metricLabel: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  metricValue: {
    fontSize: theme.typography.h1.fontSize,
    fontWeight: '800',
    color: theme.colors.deepTeal,
    marginBottom: theme.spacing.sm,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: theme.colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.success,
    borderRadius: 4,
  },
  actionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.card,
    padding: theme.spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    borderWidth: 1.5,
    borderColor: theme.colors.mint,
  },
  actionText: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
    color: theme.colors.deepTeal,
  },
  actionArrow: {
    fontSize: 24,
    color: theme.colors.deepTeal,
    fontWeight: '300',
  },
  recentScanCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.card,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    shadowColor: theme.colors.darkTeal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  recentScanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm / 2,
  },
  recentScanCrop: {
    fontSize: theme.typography.caption.fontSize,
    fontWeight: '800',
    color: theme.colors.textSecondary,
    letterSpacing: 1,
  },
  recentScanDisease: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '700',
    color: theme.colors.darkTeal,
    marginBottom: theme.spacing.sm,
  },
  gpsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm / 2,
    marginBottom: theme.spacing.sm / 2,
  },
  gpsLabel: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  gpsCoords: {
    fontSize: 11,
    color: theme.colors.deepTeal,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  recentScanDate: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm / 2,
  },
  badge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm / 2,
    borderRadius: theme.radius.input,
  },
  syncedBadge: {
    backgroundColor: theme.colors.mint,
  },
  pendingBadge: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.warning,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  syncedText: {
    color: theme.colors.deepTeal,
  },
  pendingText: {
    color: theme.colors.warning,
  },
  severityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  severityCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.card,
    padding: theme.spacing.md,
    alignItems: 'center',
    marginHorizontal: theme.spacing.sm,
    shadowColor: theme.colors.darkTeal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  severityIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: theme.spacing.sm,
  },
  severityInfo: {
    alignItems: 'center',
  },
  severityLabel: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
    fontWeight: '500',
  },
  severityCount: {
    fontSize: theme.typography.h2.fontSize,
    fontWeight: '800',
    color: theme.colors.deepTeal,
  },
  distributionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.card,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    shadowColor: theme.colors.darkTeal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  distributionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  distributionLabel: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
    color: theme.colors.deepTeal,
    textTransform: 'capitalize',
  },
  distributionCount: {
    fontSize: theme.typography.caption.fontSize,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  diseaseCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.card,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: theme.colors.darkTeal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  diseaseInfo: {
    flex: 1,
  },
  diseaseName: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
    color: theme.colors.deepTeal,
    marginBottom: theme.spacing.sm,
  },
  diseaseCount: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
});
