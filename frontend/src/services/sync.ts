import { getPendingReports, markReportsAsSynced } from './db';
import { API_BASE_URL } from '../config/api';

/**
 * Sync pending reports to the backend server
 * This ensures scan data is available for the admin dashboard
 */
export async function syncPendingReports(): Promise<{ synced: number; failed: number }> {
  try {
    const pendingReports = await getPendingReports();
    
    if (pendingReports.length === 0) {
      console.log('Sync: No pending reports to sync');
      return { synced: 0, failed: 0 };
    }

    console.log(`Sync: Found ${pendingReports.length} pending reports to sync`);
    
    // Get auth token
    const token = await getAuthToken();
    if (!token) {
      console.log('Sync: User not authenticated, skipping sync');
      return { synced: 0, failed: pendingReports.length };
    }

    const syncedIds: string[] = [];
    const failedIds: string[] = [];

    // Sync each report
    for (const report of pendingReports) {
      try {
        const success = await syncReportToBackend(report, token);
        if (success) {
          syncedIds.push(report.id);
        } else {
          failedIds.push(report.id);
        }
      } catch (error) {
        console.error(`Sync: Failed to sync report ${report.id}:`, error);
        failedIds.push(report.id);
      }
    }

    // Mark synced reports
    if (syncedIds.length > 0) {
      await markReportsAsSynced(syncedIds);
      console.log(`Sync: Successfully synced ${syncedIds.length} reports`);
    }

    if (failedIds.length > 0) {
      console.log(`Sync: Failed to sync ${failedIds.length} reports (will retry later)`);
    }

    return { synced: syncedIds.length, failed: failedIds.length };
  } catch (error) {
    console.error('Sync: Error during sync:', error);
    return { synced: 0, failed: 0 };
  }
}

/**
 * Sync a single report to the backend
 */
async function syncReportToBackend(report: any, token: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/reports/sync`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([{
        crop_type: report.crop_type,
        disease_label: report.disease_label,
        confidence_score: report.confidence_score,
        latitude: report.latitude,
        longitude: report.longitude,
        severity: report.severity,
        offline_created_at: report.offline_created_at,
      }]),
    });

    if (!response.ok) {
      console.error(`Sync: Backend returned status ${response.status}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Sync: Error syncing report to backend:', error);
    return false;
  }
}

/**
 * Get auth token from secure storage
 */
async function getAuthToken(): Promise<string | null> {
  try {
    const SecureStore = await import('expo-secure-store');
    return await SecureStore.default.getItemAsync('auth_token');
  } catch (error) {
    console.error('Sync: Error getting auth token:', error);
    return null;
  }
}

/**
 * Auto-sync reports when app comes to foreground
 * This ensures data is synced regularly without user intervention
 */
export function setupAutoSync(onSyncComplete?: (result: { synced: number; failed: number }) => void): () => void {
  // Sync immediately
  syncPendingReports().then(onSyncComplete);

  // Set up periodic sync every 5 minutes
  const intervalId = setInterval(() => {
    syncPendingReports().then(onSyncComplete);
  }, 5 * 60 * 1000);

  // Return cleanup function
  return () => {
    clearInterval(intervalId);
  };
}

/**
 * Manual sync trigger (e.g., when user pulls to refresh)
 */
export async function manualSync(): Promise<{ synced: number; failed: number }> {
  console.log('Sync: Manual sync triggered');
  return await syncPendingReports();
}

// Alias for backward compatibility
export const syncOfflineReports = syncPendingReports;
