import * as SQLite from 'expo-sqlite';

// Open the database synchronously
const getDB = () => {
  return SQLite.openDatabase('agriscan.db');
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
  return new Promise((resolve, reject) => {
    try {
      const db = getDB();
      db.transaction((tx: any) => {
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS local_reports (
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
          );`
        );
      }, (error: any) => {
        console.error("SQLite initialization error:", error);
        reject(error);
      }, () => {
        console.log("SQLite: local_reports table initialized.");
        resolve();
      });
    } catch (error) {
      console.error("SQLite initialization error:", error);
      reject(error);
    }
  });
};

export const saveOfflineReport = async (report: Omit<LocalReport, 'sync_status'>): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      const db = getDB();
      db.transaction((tx: any) => {
        tx.executeSql(
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
      }, (error: any) => {
        console.error("SQLite write error:", error);
        reject(error);
      }, () => {
        console.log(`SQLite: Saved offline report ${report.id}`);
        resolve();
      });
    } catch (error) {
      console.error("SQLite write error:", error);
      reject(error);
    }
  });
};

export const getPendingReports = async (): Promise<LocalReport[]> => {
  return new Promise((resolve, reject) => {
    try {
      const db = getDB();
      db.transaction((tx: any) => {
        tx.executeSql(
          `SELECT * FROM local_reports WHERE sync_status = 'PENDING';`,
          [],
          (_resultSet: any, resultSet: any) => {
            const reports: LocalReport[] = [];
            for (let i = 0; i < resultSet.rows.length; i++) {
              reports.push(resultSet.rows.item(i));
            }
            resolve(reports);
          },
          (_error: any, error: any) => {
            console.error("SQLite read pending error:", error);
            reject(error);
            return false;
          }
        );
      });
    } catch (error) {
      console.error("SQLite read pending error:", error);
      reject(error);
    }
  });
};

export const markReportsAsSynced = async (ids: string[]): Promise<void> => {
  if (ids.length === 0) return;
  return new Promise((resolve, reject) => {
    try {
      const db = getDB();
      const placeholders = ids.map(() => '?').join(',');
      
      db.transaction((tx: any) => {
        tx.executeSql(
          `UPDATE local_reports SET sync_status = 'SYNCED' WHERE id IN (${placeholders});`,
          ids
        );
      }, (error: any) => {
        console.error("SQLite update sync status error:", error);
        reject(error);
      }, () => {
        console.log(`SQLite: Synced reports updated in database: ${ids.length}`);
        resolve();
      });
    } catch (error) {
      console.error("SQLite update sync status error:", error);
      reject(error);
    }
  });
};

export const getLocalHistory = async (): Promise<LocalReport[]> => {
  return new Promise((resolve, reject) => {
    try {
      const db = getDB();
      db.transaction((tx: any) => {
        tx.executeSql(
          `SELECT * FROM local_reports ORDER BY offline_created_at DESC;`,
          [],
          (_resultSet: any, resultSet: any) => {
            const reports: LocalReport[] = [];
            for (let i = 0; i < resultSet.rows.length; i++) {
              reports.push(resultSet.rows.item(i));
            }
            resolve(reports);
          },
          (_error: any, error: any) => {
            console.error("SQLite history read error:", error);
            reject(error);
            return false;
          }
        );
      });
    } catch (error) {
      console.error("SQLite history read error:", error);
      reject(error);
    }
  });
};
