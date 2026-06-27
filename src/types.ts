/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Report {
  id: string;
  imageUrl?: string;
  locationName: string;
  latitude: number;
  longitude: number;
  issueType: 'pothole' | 'flooding' | 'blocked_drain' | 'broken_streetlight' | 'illegal_dumping' | 'damaged_road' | 'unsafe_sidewalk' | 'traffic_sign_damage' | 'water_leakage' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: 'low' | 'medium' | 'high';
  description: string;
  publicSafetyRisk: string;
  environmentalImpact: string;
  recommendedAction: string;
  estimatedRepairUrgency: string;
  priorityScore: number; // 0 - 100
  affectedInfrastructure: 'road' | 'drainage' | 'waste' | 'lighting' | 'water' | 'public_safety' | 'other';
  suggestedDepartment: string;
  duplicateLikelihood: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'resolved';
  createdAt: string; // ISO String
  updatedAt: string; // ISO String
  resolvedAt?: string; // ISO String
  reportedBy?: string; // Anonymous UID or manual
}

export interface CityHealthSnapshot {
  id: string;
  date: string; // YYYY-MM-DD
  overallHealth: number;
  roadHealth: number;
  drainageHealth: number;
  wasteHealth: number;
  lightingHealth: number;
  waterHealth: number;
  incidentCount: number;
  resolvedCount: number;
  highPriorityCount: number;
  aiNarration: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export interface CityAnalytics {
  topIssues: { type: string; count: number; change: string }[];
  highestRiskAreas: { area: string; riskLevel: string; score: number }[];
  weeklySummary: string;
  monthlySummary: string;
  recommendations: string[];
}
