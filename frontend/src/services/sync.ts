import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../config/api';
import { getPendingReports, markReportsAsSynced } from './db';

export const syncOfflineReports = async (): Promise<number> => {
  try {
    // 1. Fetch pending reports from SQLite cache
    const pendingReports = await getPendingReports();
    if (pendingReports.length === 0) {
      console.log("Sync Engine: No pending reports found.");
      return 0;
    }

    // 2. Fetch authenticated JWT from secure memory storage
    const token = await SecureStore.getItemAsync('user_token');
    if (!token) {
      console.warn("Sync Engine: Sync skipped. User is not authenticated.");
      return 0;
    }

    console.log(`Sync Engine: Attempting to upload ${pendingReports.length} pending reports...`);

    // 3. Format payload matching backend ReportCreate schema
    const payload = pendingReports.map(report => ({
      crop_type: report.crop_type,
      disease_label: report.disease_label,
      confidence_score: report.confidence_score,
      latitude: report.latitude,
      longitude: report.longitude,
      severity: report.severity,
      offline_created_at: report.offline_created_at,
      image_url: report.image_url || null
    }));

    // 4. Post batch payload to FastAPI sync route
    const response = await fetch(`${API_BASE_URL}/api/v1/reports/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    if (response.status === 201) {
      const successData = await response.json();
      console.log("Sync Engine: Remote ingestion successful. Updating SQLite statuses...");
      
      // Extract array of synced IDs
      const syncedIds = pendingReports.map(r => r.id);
      
      // Update local storage values to 'SYNCED'
      await markReportsAsSynced(syncedIds);
      return syncedIds.length;
    } else {
      console.error(`Sync Engine: Backend upload failed with status ${response.status}`);
      return 0;
    }

  } catch (error) {
    console.error("Sync Engine: Synchronization network connection failed:", error);
    return 0;
  }
};
