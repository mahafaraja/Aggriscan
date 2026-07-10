import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { getLocalHistory } from '../services/db';
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

  const loadDashboardStats = async () => {
    try {
      const history = await getLocalHistory();
      setTotalScans(history.length);
      
      const pendingCount = history.filter(r => r.sync_status === 'PENDING').length;
      setPendingSync(pendingCount);
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

        {/* Additional Stats */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Performance Metrics</Text>
          
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Diagnostic Accuracy</Text>
            <Text style={styles.metricValue}>94.5%</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '94.5%' }]} />
            </View>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Avg. Processing Time</Text>
            <Text style={styles.metricValue}>2.3s</Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Diseases Detected</Text>
            <Text style={styles.metricValue}>12 Types</Text>
          </View>
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