import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { getLocalHistory, LocalReport } from '../services/db';
import { syncOfflineReports } from '../services/sync';
import { theme } from '../theme/Index';

interface HistoryScreenProps {
  onNavigate: (screen: 'Home' | 'Camera' | 'History') => void;
}

export default function HistoryScreen({ onNavigate }: HistoryScreenProps) {
  const [reports, setReports] = useState<LocalReport[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const fetchLogs = async () => {
    try {
      const logs = await getLocalHistory();
      setReports(logs);
    } catch (e) {
      console.error("History: Error loading logs", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const triggerSync = async () => {
    setIsSyncing(true);
    try {
      const count = await syncOfflineReports();
      if (count > 0) {
        alert(`Successfully synchronized ${count} reports.`);
        await fetchLogs();
      } else {
        alert("No unsynced reports found or server is unreachable.");
      }
    } catch (error) {
      alert("Sync error. Check server logs.");
    } finally {
      setIsSyncing(false);
    }
  };

  const renderItem = ({ item }: { item: LocalReport }) => {
    const formattedDate = new Date(item.offline_created_at).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.cropType}>{item.crop_type.toUpperCase()}</Text>
            <Text style={styles.diseaseLabel}>{item.disease_label.replace('_', ' ')}</Text>
          </View>
          <View style={[styles.badge, item.sync_status === 'SYNCED' ? styles.syncedBadge : styles.pendingBadge]}>
            <Text style={[styles.badgeText, item.sync_status === 'SYNCED' ? styles.syncedText : styles.pendingText]}>
              {item.sync_status}
            </Text>
          </View>
        </View>

        <View style={styles.cardDetails}>
          <Text style={styles.detailText}>🎯 Confidence: {(item.confidence_score * 100).toFixed(1)}%</Text>
          <Text style={styles.detailText}>📍 GPS: {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}</Text>
          <Text style={styles.detailText}>📅 Scanned: {formattedDate}</Text>
          <Text style={[styles.detailText, styles.severityText, item.severity === 'High' ? styles.highSeverityText : styles.lowSeverityText]}>
            ⚠️ Severity: {item.severity}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      
      {/* Header */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => onNavigate('Home')}>
          <Text style={styles.backBtnText}>← Dashboard</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Diagnostic Logs</Text>
        <TouchableOpacity style={styles.syncBtn} onPress={triggerSync} disabled={isSyncing}>
          <Text style={styles.syncBtnText}>{isSyncing ? '...' : 'Sync'}</Text>
        </TouchableOpacity>
      </View>

      {/* List content */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.deepTeal} />
        </View>
      ) : reports.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyEmoji}>📂</Text>
          <Text style={styles.emptyTitle}>No scans recorded yet</Text>
          <Text style={styles.emptySub}>Diagnostic logs will appear here after scanning crops in the field.</Text>
          <TouchableOpacity style={styles.scanNowBtn} onPress={() => onNavigate('Camera')}>
            <Text style={styles.scanNowText}>Diagnose Now</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={reports}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
        />
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.darkTeal,
  },
  backBtn: {
    padding: theme.spacing.sm,
  },
  backBtnText: {
    color: theme.colors.textOnDark,
    fontSize: theme.typography.body.fontSize,
    fontWeight: '700',
  },
  headerTitle: {
    color: theme.colors.textOnDark,
    fontSize: theme.typography.h2.fontSize,
    fontWeight: '700',
  },
  syncBtn: {
    backgroundColor: theme.colors.deepTeal,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.input / 2,
  },
  syncBtnText: {
    color: theme.colors.textOnDark,
    fontWeight: '700',
    fontSize: theme.typography.caption.fontSize,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  listContainer: {
    padding: theme.spacing.md,
  },
  card: {
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingBottom: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  cropType: {
    fontSize: theme.typography.caption.fontSize,
    fontWeight: '800',
    color: theme.colors.textSecondary,
    letterSpacing: 1,
  },
  diseaseLabel: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '700',
    color: theme.colors.darkTeal,
    marginTop: theme.spacing.sm / 4,
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
    fontSize: theme.typography.caption.fontSize,
    fontWeight: '700',
  },
  syncedText: {
    color: theme.colors.deepTeal,
  },
  pendingText: {
    color: theme.colors.warning,
  },
  cardDetails: {
    gap: theme.spacing.sm / 2,
  },
  detailText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
  },
  severityText: {
    fontWeight: '700',
  },
  highSeverityText: {
    color: theme.colors.error,
  },
  lowSeverityText: {
    color: theme.colors.deepTeal,
  },
  emptyEmoji: {
    fontSize: theme.typography.h1.fontSize * 2,
    marginBottom: theme.spacing.md,
  },
  emptyTitle: {
    fontSize: theme.typography.h2.fontSize,
    fontWeight: '700',
    color: theme.colors.darkTeal,
    marginBottom: theme.spacing.sm / 2,
  },
  emptySub: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: theme.typography.caption.lineHeight,
    marginBottom: theme.spacing.lg,
  },
  scanNowBtn: {
    backgroundColor: theme.colors.deepTeal,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.input,
  },
  scanNowText: {
    color: theme.colors.textOnDark,
    fontWeight: '700',
  },
});
