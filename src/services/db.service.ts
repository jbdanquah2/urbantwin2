/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { db, isFirebaseConfigured } from '../firebase/config';
import { 
  collection, 
  getDocs, 
  addDoc, 
  doc, 
  updateDoc, 
  writeBatch,
  query,
  orderBy 
} from 'firebase/firestore';
import { Report, CityHealthSnapshot } from '../types';
import { INITIAL_REPORTS, INITIAL_SNAPSHOTS } from './seed-data';

// Local storage keys
const LOCAL_REPORTS_KEY = 'urban_twin_reports';
const LOCAL_SNAPSHOTS_KEY = 'urban_twin_snapshots';

// Recalculates category health based on reports list
export function calculateCityHealth(reports: Report[]): Omit<CityHealthSnapshot, 'id' | 'date' | 'aiNarration'> {
  let roadHealth = 95;
  let drainageHealth = 95;
  let wasteHealth = 95;
  let lightingHealth = 95;
  let waterHealth = 95;

  let incidentCount = reports.length;
  let resolvedCount = 0;
  let highPriorityCount = 0;

  reports.forEach((rep) => {
    const isResolved = rep.status === 'resolved';
    if (isResolved) {
      resolvedCount++;
    }

    // Determine impact value
    let impact = 0;
    if (!isResolved) {
      switch (rep.severity) {
        case 'low': impact = 3; break;
        case 'medium': impact = 7; break;
        case 'high': impact = 12; break;
        case 'critical': impact = 20; break;
      }
      
      if (rep.severity === 'high' || rep.severity === 'critical') {
        highPriorityCount++;
      }
    }

    // Apply impact to the respective category
    switch (rep.affectedInfrastructure) {
      case 'road':
        roadHealth -= impact;
        break;
      case 'drainage':
        drainageHealth -= impact;
        break;
      case 'waste':
        wasteHealth -= impact;
        break;
      case 'lighting':
        lightingHealth -= impact;
        break;
      case 'water':
        waterHealth -= impact;
        break;
    }
  });

  // Clamp values between 15% and 100%
  const clamp = (val: number) => Math.max(15, Math.min(100, val));

  roadHealth = clamp(roadHealth);
  drainageHealth = clamp(drainageHealth);
  wasteHealth = clamp(wasteHealth);
  lightingHealth = clamp(lightingHealth);
  waterHealth = clamp(waterHealth);

  const overallHealth = Math.round(
    (roadHealth + drainageHealth + wasteHealth + lightingHealth + waterHealth) / 5
  );

  return {
    overallHealth,
    roadHealth,
    drainageHealth,
    wasteHealth,
    lightingHealth,
    waterHealth,
    incidentCount,
    resolvedCount,
    highPriorityCount
  };
}

// Check if LocalStorage has reports, otherwise initialize them
function getLocalReports(): Report[] {
  const data = localStorage.getItem(LOCAL_REPORTS_KEY);
  if (!data) {
    localStorage.setItem(LOCAL_REPORTS_KEY, JSON.stringify(INITIAL_REPORTS));
    return INITIAL_REPORTS;
  }
  return JSON.parse(data);
}

function getLocalSnapshots(): CityHealthSnapshot[] {
  const data = localStorage.getItem(LOCAL_SNAPSHOTS_KEY);
  if (!data) {
    localStorage.setItem(LOCAL_SNAPSHOTS_KEY, JSON.stringify(INITIAL_SNAPSHOTS));
    return INITIAL_SNAPSHOTS;
  }
  return JSON.parse(data);
}

export const dbService = {
  // Fetch all incident reports
  async getReports(): Promise<Report[]> {
    if (isFirebaseConfigured && db) {
      try {
        const reportsCol = collection(db, 'reports');
        const q = query(reportsCol, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        // If empty in Firestore, seed it!
        if (querySnapshot.empty) {
          console.log('Firestore reports is empty, seeding initial reports...');
          const batch = writeBatch(db);
          INITIAL_REPORTS.forEach((rep) => {
            const docRef = doc(collection(db, 'reports'), rep.id);
            batch.set(docRef, rep);
          });
          await batch.commit();
          return INITIAL_REPORTS;
        }

        const reports: Report[] = [];
        querySnapshot.forEach((doc) => {
          reports.push({ ...doc.data() as Report, id: doc.id });
        });
        return reports;
      } catch (error) {
        console.error('Error fetching Firestore reports, using fallback:', error);
        return getLocalReports();
      }
    } else {
      return getLocalReports();
    }
  },

  // Add a new report
  async addReport(newReport: Omit<Report, 'id'>): Promise<Report> {
    const id = 'rep-' + Math.random().toString(36).substr(2, 9);
    const report: Report = {
      ...newReport,
      id,
    };

    if (isFirebaseConfigured && db) {
      try {
        const reportsCol = collection(db, 'reports');
        await addDoc(reportsCol, report);
        
        // Also trigger timeline health update
        await this.updateLatestHealthSnapshot(report, 'added');
        
        return report;
      } catch (error) {
        console.error('Error adding report to Firestore, using fallback:', error);
      }
    }

    // Local Storage Fallback
    const reports = getLocalReports();
    reports.unshift(report);
    localStorage.setItem(LOCAL_REPORTS_KEY, JSON.stringify(reports));

    // Update snapshots locally
    this.updateLatestHealthSnapshotLocal(report, 'added');

    return report;
  },

  // Update report status (e.g. resolve it)
  async updateReportStatus(id: string, status: 'pending' | 'in_progress' | 'resolved'): Promise<void> {
    const updatedAt = new Date().toISOString();
    const resolvedAt = status === 'resolved' ? new Date().toISOString() : undefined;

    if (isFirebaseConfigured && db) {
      try {
        const reportRef = doc(db, 'reports', id);
        await updateDoc(reportRef, { status, updatedAt, ...(resolvedAt && { resolvedAt }) });
        
        // Fetch full reports to recalculate
        const allReports = await this.getReports();
        const updatedReport = allReports.find(r => r.id === id);
        if (updatedReport) {
          await this.updateLatestHealthSnapshot({ ...updatedReport, status, resolvedAt }, 'updated');
        }
        return;
      } catch (error) {
        console.error('Error updating status in Firestore, using fallback:', error);
      }
    }

    // Local Storage Fallback
    const reports = getLocalReports();
    const index = reports.findIndex((r) => r.id === id);
    if (index !== -1) {
      reports[index].status = status;
      reports[index].updatedAt = updatedAt;
      if (resolvedAt) {
        reports[index].resolvedAt = resolvedAt;
      } else {
        delete reports[index].resolvedAt;
      }
      localStorage.setItem(LOCAL_REPORTS_KEY, JSON.stringify(reports));
      this.updateLatestHealthSnapshotLocal(reports[index], 'updated');
    }
  },

  // Fetch health snapshots
  async getSnapshots(): Promise<CityHealthSnapshot[]> {
    if (isFirebaseConfigured && db) {
      try {
        const snapCol = collection(db, 'cityHealthSnapshots');
        const q = query(snapCol, orderBy('date', 'asc'));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          console.log('Firestore snapshots empty, seeding snapshots...');
          const batch = writeBatch(db);
          INITIAL_SNAPSHOTS.forEach((snap) => {
            const docRef = doc(collection(db, 'cityHealthSnapshots'), snap.id);
            batch.set(docRef, snap);
          });
          await batch.commit();
          return INITIAL_SNAPSHOTS;
        }

        const snapshots: CityHealthSnapshot[] = [];
        querySnapshot.forEach((doc) => {
          snapshots.push({ ...doc.data() as CityHealthSnapshot, id: doc.id });
        });
        return snapshots;
      } catch (error) {
        console.error('Error fetching snapshots from Firestore, using fallback:', error);
        return getLocalSnapshots();
      }
    } else {
      return getLocalSnapshots();
    }
  },

  // Update latest snapshot based on a report action (firebase)
  async updateLatestHealthSnapshot(report: Report, action: 'added' | 'updated'): Promise<void> {
    try {
      const snapshots = await this.getSnapshots();
      const reports = await this.getReports();
      
      const newHealth = calculateCityHealth(reports);
      const latestSnap = snapshots[snapshots.length - 1];

      let actionDesc = '';
      if (action === 'added') {
        actionDesc = `A new high-priority ${report.issueType} was reported near ${report.locationName}, affecting city ${report.affectedInfrastructure} systems.`;
      } else if (report.status === 'resolved') {
        actionDesc = `The municipal department resolved a critical ${report.issueType} on ${report.locationName}, lifting the localized infrastructure score.`;
      } else {
        actionDesc = `The status of ${report.issueType} at ${report.locationName} was updated to ${report.status}, signifying ongoing response operations.`;
      }

      const updatedSnap: CityHealthSnapshot = {
        ...latestSnap,
        ...newHealth,
        aiNarration: `On this current cycle, overall city health was dynamically adjusted to ${newHealth.overallHealth}%. ${actionDesc} Roads stand at ${newHealth.roadHealth}%, and drainage systems register at ${newHealth.drainageHealth}% efficiency.`
      };

      if (isFirebaseConfigured && db) {
        const snapRef = doc(db, 'cityHealthSnapshots', latestSnap.id);
        await updateDoc(snapRef, { ...updatedSnap });
      }
    } catch (e) {
      console.error('Error updating Firestore health snapshot:', e);
    }
  },

  // Local storage equivalent of updating latest snapshot
  updateLatestHealthSnapshotLocal(report: Report, action: 'added' | 'updated'): void {
    const snapshots = getLocalSnapshots();
    const reports = getLocalReports();
    const newHealth = calculateCityHealth(reports);
    
    if (snapshots.length === 0) return;
    const latestSnap = snapshots[snapshots.length - 1];

    let actionDesc = '';
    if (action === 'added') {
      actionDesc = `A new high-priority ${report.issueType} was reported near ${report.locationName}, affecting city ${report.affectedInfrastructure} systems.`;
    } else if (report.status === 'resolved') {
      actionDesc = `The municipal department resolved a critical ${report.issueType} on ${report.locationName}, lifting the localized infrastructure score.`;
    } else {
      actionDesc = `The status of ${report.issueType} at ${report.locationName} was updated to ${report.status}, signifying ongoing response operations.`;
    }

    const updatedSnap: CityHealthSnapshot = {
      ...latestSnap,
      ...newHealth,
      aiNarration: `On this current cycle, overall city health was dynamically adjusted to ${newHealth.overallHealth}%. ${actionDesc} Roads stand at ${newHealth.roadHealth}%, and drainage systems register at ${newHealth.drainageHealth}% efficiency.`
    };

    snapshots[snapshots.length - 1] = updatedSnap;
    localStorage.setItem(LOCAL_SNAPSHOTS_KEY, JSON.stringify(snapshots));
  },

  // Create a new snapshot (e.g. for a new day on timeline)
  async createNewDaySnapshot(narration?: string): Promise<CityHealthSnapshot> {
    const snapshots = await this.getSnapshots();
    const reports = await this.getReports();
    const newHealth = calculateCityHealth(reports);

    const nextDayNum = snapshots.length + 1;
    const newSnap: CityHealthSnapshot = {
      id: `snap-${nextDayNum}`,
      date: `Day ${nextDayNum}`,
      ...newHealth,
      aiNarration: narration || `On Day ${nextDayNum}, the digital twin simulation calculated a stabilized health coefficient of ${newHealth.overallHealth}%. Maintenance operations remain active across all five primary city infrastructure divisions.`
    };

    if (isFirebaseConfigured && db) {
      try {
        const snapCol = collection(db, 'cityHealthSnapshots');
        await addDoc(snapCol, newSnap);
        return newSnap;
      } catch (error) {
        console.error('Error adding snapshot to Firestore:', error);
      }
    }

    snapshots.push(newSnap);
    localStorage.setItem(LOCAL_SNAPSHOTS_KEY, JSON.stringify(snapshots));
    return newSnap;
  }
};
