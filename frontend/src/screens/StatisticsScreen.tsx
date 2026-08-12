import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { getLocalHistory, getPendingReports } from '../services/db';
import { syncOfflineReports } from '../services/sync';
import { getUserStatistics, UserStatisticsResponse } from '../services/backendApi';
import { theme } from '../theme/Index';

interface StatisticsScreenProps {
  onNavigate: (screen: 'Home' | 'Camera' | 'AddPhoto' | 'History') => void;
  onBack: () => void;
}

function StatisticsScreen({ onNavigate, onBack }: StatisticsScreenProps) {
  const [totalScans, setTotalScans] = useState<number>(0);
  const [pendingSync, setPendingSync] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isLoadingStats, setIsLoadingStats] = useState<boolean>(false);
  const [diseasesDetected, setDiseasesDetected] = useState<number>(0);
  const [diseasesList, setDiseasesList] = useState<{ name: string; count: number }[]>([]);
  const [healthyCount, setHealthyCount] = useState<number>(0);
  const [diseasedCount, setDiseasedCount] = useState<number>(0);
  const [avgConfidence, setAvgConfidence] = useState<number>(0);
  const [avgProcessingTime, setAvgProcessingTime] = useState<number>(0);
  const [statsSource, setStatsSource] = useState<string>('local');

  const loadLocalStats = async () => {
    try {
      const history = await getLocalHistory();
      const pendingCount = history.filter(r => r.sync_status === 'PENDING').length;
      setPendingSync(pendingCount);
      setTotalScans(history.length);

      const nonHealthy = history.filter(
        (r) => !(r.disease_label || '').toLowerCase().includes('healthy')
      );
      const healthy = history.length - nonHealthy.length;
      setHealthyCount(healthy);
      setDiseasedCount(nonHealthy.length);

      const diseaseMap = new Map<string, number>();
      nonHealthy.forEach((r) => {
        const key = (r.disease_label || 'Unknown').trim();
        diseaseMap.set(key, (diseaseMap.get(key) || 0) + 1);
      });
      setDiseasesDetected(diseaseMap.size);
      setDiseasesList(
        Array.from(diseaseMap.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
      );

      if (history.length > 0) {
        const confSum = history.reduce((sum, r) => sum + (r.confidence_score || 0), 0);
        setAvgConfidence(confSum / history.length);
      } else {
        setAvgConfidence(0);
      }

      const timed = history.filter((r) => r.processing_time_ms && r.processing_time_ms > 0);
      if (timed.length > 0) {
        const timeSum = timed.reduce((sum, r) => sum + (r.processing_time_ms || 0), 0);
        setAvgProcessingTime(timeSum / timed.length);
      } else {
        setAvgProcessingTime(0);
      }
    } catch (error) {
      console.error("Dashboard: Error fetching local logs", error);
    }
  };

    const _safePendingCount = async (): Promise<number> => {
    try {
      const pending = await getPendingReports();
      return pending.length;
    } catch (error) {
      console.error('Statistics: Error reading pending reports', error);
      return 0;
    }
  };

  const loadBackendStats = async () => {
    setIsLoadingStats(true);
    try {
      const data: UserStatisticsResponse = await getUserStatistics();
      const pendingCount = await _safePendingCount();
      setStatsSource('backend');
      // Backend holds synced reports; local holds offline/pending records that
      // may not have been uploaded yet. Surface both so statistics always
      // reflect everything recorded on the device.
      setPendingSync(pendingCount);
      setTotalScans(data.total_scans + pendingCount);
      setHealthyCount(data.healthy_count);
      setDiseasedCount(data.diseased_count);
      setDiseasesDetected(data.diseases_detected);
      setDiseasesList(data.diseases_list || []);
      setAvgConfidence(data.avg_confidence);
      // avgProcessingTime is only tracked locally; keep the value set above.
    } catch (error) {
      console.error('Statistics: Backend stats unavailable, keeping local data:', error);
      setStatsSource('local');
    } finally {
      setIsLoadingStats(false);
    }
  };

  useEffect(() => {
    // Local stats are the offline-first baseline (always recorded on device).
    // Backend stats are an enhancement on top — only shown when authenticated.
    // Loading local first guarantees the screen never shows "nothing recorded".
    const refresh = async () => {
      await loadLocalStats();
      await loadBackendStats();
    };
    refresh();
    const interval = setInterval(refresh, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleManualSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const result = await syncOfflineReports();
      alert(result.synced > 0 ? `Successfully uploaded ${result.synced} records!` : "No pending records uploaded.");
      await loadBackendStats();
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
            {isLoadingStats
              ? 'Loading statistics...'
              : pendingSync > 0
                ? `${pendingSync} Diagnostics Cached Offline (Pending Sync)`
                : statsSource === 'backend'
                  ? 'Live statistics from server'
                  : 'Showing local statistics'}
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

        {/* Additional Stats */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Performance Metrics</Text>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Diagnostic Accuracy</Text>
            <Text style={styles.metricValue}>
              {avgConfidence > 0 ? `${(avgConfidence * 100).toFixed(1)}%` : '—'}
            </Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${Math.min(100, Math.round(avgConfidence * 100))}%` }]} />
            </View>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Avg. Processing Time</Text>
            <Text style={styles.metricValue}>
              {avgProcessingTime > 0 ? `${(avgProcessingTime / 1000).toFixed(1)}s` : '—'}
            </Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Diseases Detected</Text>
            <Text style={styles.metricValue}>
              {diseasesDetected} {diseasesDetected === 1 ? 'Type' : 'Types'}
            </Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Healthy vs Diseased Scans</Text>
            <Text style={styles.metricValue}>{healthyCount} / {totalScans - healthyCount}</Text>
          </View>

          {diseasesList.length > 0 && (
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Detected Diseases Breakdown</Text>
              {diseasesList.map((d) => (
                <View key={d.name} style={styles.diseaseRow}>
                  <Text style={styles.diseaseName}>{d.name.replace(/_/g, ' ')}</Text>
                  <Text style={styles.diseaseCount}>{d.count}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

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
  diseaseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm / 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  diseaseName: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.deepTeal,
    fontWeight: '600',
    flex: 1,
    textTransform: 'capitalize',
  },
  diseaseCount: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '800',
    color: theme.colors.darkTeal,
    marginLeft: theme.spacing.md,
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
});