import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { GalleryAdd } from 'iconsax-react-native';
import { getLocalHistory } from '../services/db';
import { syncOfflineReports } from '../services/sync';
import { theme } from '../theme/Index';

interface HomeScreenProps {
  onNavigate: (screen: 'Home' | 'Camera' | 'AddPhoto' | 'History') => void;
}

function HomeScreen({ onNavigate }: HomeScreenProps) {
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
    // Refresh stats every time screen gains focus in mock routing
    const interval = setInterval(loadDashboardStats, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleManualSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const syncedCount = await syncOfflineReports();
      alert(syncedCount > 0 ? `Successfully uploaded ${syncedCount} records!` : "No pending records uploaded.");
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
        
        {/* Header Branding */}
        <View style={styles.header}>
          <Text style={styles.subtitle}>Victoria University Kampala</Text>
          <Text style={styles.title}>Agriscan Mobile</Text>
          <Text style={styles.tagline}>UG Crop Disease Diagnostics</Text>
        </View>

        {/* Sync Status Banner */}
        <View style={[styles.syncBanner, pendingSync > 0 ? styles.syncWarning : styles.syncSuccess]}>
          <Text style={styles.syncText}>
            {pendingSync > 0 
              ? `${pendingSync} Diagnostics Cached Offline (Pending Sync)` 
              : 'All Data Synchronized to PostGIS'}
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

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Field Operations</Text>
        
        <TouchableOpacity 
          style={styles.actionCardPrimary} 
          onPress={() => onNavigate('Camera')}
        >
          <View style={styles.actionIconPlaceholder}>
            <Text style={styles.actionEmoji}>📸</Text>
          </View>
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionTitle}>Diagnose Leaf Crop</Text>
            <Text style={styles.actionDesc}>Point camera at leaf/stem to run offline ML diagnosis</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCardSecondary}
          onPress={() => onNavigate('AddPhoto')}
        >
          <View style={[styles.actionIconPlaceholder, styles.actionIconSecondary]}>
            <GalleryAdd size={26} color={theme.colors.deepTeal} variant="Bold" />
          </View>
          <View style={styles.actionTextContainer}>
            <Text style={[styles.actionTitle, styles.actionTitleSecondary]}>Add Photo</Text>
            <Text style={styles.actionDesc}>Choose an existing leaf image and run the same model diagnosis</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionCardSecondary} 
          onPress={() => onNavigate('History')}
        >
          <View style={[styles.actionIconPlaceholder, styles.actionIconSecondary]}>
            <Text style={styles.actionEmoji}>📂</Text>
          </View>
          <View style={styles.actionTextContainer}>
            <Text style={[styles.actionTitle, styles.actionTitleSecondary]}>Diagnostic Logs</Text>
            <Text style={styles.actionDesc}>View past diagnostic history, coordinates, and recommendations</Text>
          </View>
        </TouchableOpacity>

        {/* Localized Tip Card */}
        <View style={styles.tipCard}>
          <Text style={styles.tipTitle}>💡 Mukene / Extension Tip</Text>
          <Text style={styles.tipContent}>
            Ekilwadde kya BBW kyolekebwa nnyo mu matooke. Uproot infected banana stems immediately at ground level to prevent further spread.
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  header: {
    width: '100%',
    alignItems: 'flex-start',
    marginVertical: theme.spacing.lg,
  },
  subtitle: {
    fontSize: theme.typography.caption.fontSize,
    fontWeight: '700',
    color: theme.colors.deepTeal,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: theme.typography.h1.fontSize,
    fontWeight: '800',
    color: theme.colors.darkTeal,
  },
  tagline: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm / 2,
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
  sectionTitle: {
    fontSize: theme.typography.h2.fontSize,
    fontWeight: '700',
    color: theme.colors.darkTeal,
    width: '100%',
    marginBottom: theme.spacing.md,
  },
  actionCardPrimary: {
    backgroundColor: theme.colors.deepTeal,
    width: '100%',
    borderRadius: theme.radius.card,
    padding: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    shadowColor: theme.colors.darkTeal,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  actionCardSecondary: {
    backgroundColor: theme.colors.surface,
    width: '100%',
    borderRadius: theme.radius.card,
    padding: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    borderWidth: 1.5,
    borderColor: theme.colors.mint,
    shadowColor: theme.colors.darkTeal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIconPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.mint,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionEmoji: {
    fontSize: theme.typography.h2.fontSize,
  },
  actionTextContainer: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  actionTitle: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '700',
    color: theme.colors.textOnDark,
  },
  actionTitleSecondary: {
    color: theme.colors.deepTeal,
  },
  actionIconSecondary: {
    backgroundColor: theme.colors.background,
  },
  actionDesc: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm / 2,
    lineHeight: theme.typography.caption.lineHeight,
  },
  tipCard: {
    backgroundColor: theme.colors.surface,
    width: '100%',
    borderRadius: theme.radius.input,
    padding: theme.spacing.md,
    borderLeftWidth: 5,
    borderLeftColor: theme.colors.success,
    marginBottom: theme.spacing.lg,
  },
  tipTitle: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '700',
    color: theme.colors.deepTeal,
    marginBottom: theme.spacing.sm / 2,
  },
  tipContent: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
    lineHeight: theme.typography.caption.lineHeight,
  },
});
