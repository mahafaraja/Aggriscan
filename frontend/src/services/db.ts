import * as SQLite from 'expo-sqlite';

// Open the database asynchronously
const getDB = async () => {
  return await SQLite.openDatabaseAsync('agriscan.db');
};

export interface LocalReport {
  id: string;
  crop_type: string;
  disease_label: string;
  confidence_score: number;
  latitude: number;
  longitude: number;
  severity: string;
  offline_created_at: string;
  image_url?: string;
  sync_status: 'PENDING' | 'SYNCED';
}

export const initSQLiteDatabase = async (): Promise<void> => {
  try {
    const db = await getDB();
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS local_reports (
        id TEXT PRIMARY KEY,
        crop_type TEXT NOT NULL,
        disease_label TEXT NOT NULL,
        confidence_score REAL NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        severity TEXT NOT NULL,
        offline_created_at TEXT NOT NULL,
        image_url TEXT,
        sync_status TEXT DEFAULT 'PENDING'
      );
    `);
    console.log("SQLite: local_reports table initialized.");
  } catch (error) {
    console.error("SQLite initialization error:", error);
    throw error;
  }
};

export const saveOfflineReport = async (report: Omit<LocalReport, 'sync_status'>): Promise<void> => {
  try {
    const db = await getDB();
    await db.runAsync(
      `INSERT INTO local_reports 
      (id, crop_type, disease_label, confidence_score, latitude, longitude, severity, offline_created_at, image_url, sync_status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING');`,
      [
        report.id,
        report.crop_type,
        report.disease_label,
        report.confidence_score,
        report.latitude,
        report.longitude,
        report.severity,
        report.offline_created_at,
        report.image_url || null
      ]
    );
    console.log(`SQLite: Saved offline report ${report.id}`);
  } catch (error) {
    console.error("SQLite write error:", error);
    throw error;
  }
};

export const getPendingReports = async (): Promise<LocalReport[]> => {
  try {
    const db = await getDB();
    const result = await db.getAllAsync<LocalReport>(
      `SELECT * FROM local_reports WHERE sync_status = 'PENDING';`
    );
    return result;
  } catch (error) {
    console.error("SQLite read pending error:", error);
    throw error;
  }
};

export const markReportsAsSynced = async (ids: string[]): Promise<void> => {
  if (ids.length === 0) return;
  try {
    const db = await getDB();
    const placeholders = ids.map(() => '?').join(',');
    
    await db.runAsync(
      `UPDATE local_reports SET sync_status = 'SYNCED' WHERE id IN (${placeholders});`,
      ids
    );
    console.log(`SQLite: Synced reports updated in database: ${ids.length}`);
  } catch (error) {
    console.error("SQLite update sync status error:", error);
    throw error;
  }
};

export const getLocalHistory = async (): Promise<LocalReport[]> => {
  try {
    const db = await getDB();
    const result = await db.getAllAsync<LocalReport>(
      `SELECT * FROM local_reports ORDER BY offline_created_at DESC;`
    );
    return result;
  } catch (error) {
    console.error("SQLite history read error:", error);
    throw error;
  }
};