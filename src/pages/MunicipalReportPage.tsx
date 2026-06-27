/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { dbService, calculateCityHealth } from '../services/db.service';
import { Report, CityHealthSnapshot } from '../types';
import { 
  FileText, 
  Printer, 
  Activity, 
  Calendar, 
  CheckCircle, 
  AlertTriangle, 
  HardHat, 
  Award,
  ShieldCheck,
  TrendingUp,
  Inbox
} from 'lucide-react';
import { motion } from 'motion/react';
import { 
  ResponsiveContainer, 
  BarChart, 
  CartesianGrid, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Bar,
  Legend
} from 'recharts';

export const MunicipalReportPage: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [snapshots, setSnapshots] = useState<CityHealthSnapshot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const reps = await dbService.getReports();
        const snaps = await dbService.getSnapshots();
        setReports(reps);
        setSnapshots(snaps);
      } catch (err) {
        console.error('Error loading report page:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const healthMetrics = calculateCityHealth(reports);

  // Active high-priority backlogs
  const priorityIncidents = reports.filter(r => 
    r.status !== 'resolved' && 
    (r.severity === 'high' || r.severity === 'critical')
  );

  const barChartData = [
    { name: 'Roads', Health: healthMetrics.roadHealth, Target: 95 },
    { name: 'Drainage', Health: healthMetrics.drainageHealth, Target: 95 },
    { name: 'Waste', Health: healthMetrics.wasteHealth, Target: 95 },
    { name: 'Lighting', Health: healthMetrics.lightingHealth, Target: 95 },
    { name: 'Water', Health: healthMetrics.waterHealth, Target: 95 }
  ];

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh] bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-blue-600/30 border-t-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Assembling Printable Municipal Report...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 print:p-0 print:m-0">
      
      {/* Top action bar (hidden in print mode) */}
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs print:hidden">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Official Municipal Briefing Document</span>
        </div>
        <button
          onClick={handlePrint}
          id="btn-print-report"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
        >
          <Printer className="w-4 h-4" /> Print Document
        </button>
      </div>

      {/* PRINTABLE ENVELOPE SHEET */}
      <div className="bg-white text-slate-900 p-8 sm:p-12 border border-slate-250 rounded-2xl shadow-sm space-y-8 print:border-none print:shadow-none print:p-0 font-sans print:text-black">
        
        {/* Document Header */}
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 print:text-black">Urban Twin Operating System</span>
            <h1 className="text-3xl font-black text-slate-900 mt-1 tracking-tight">MUNICIPAL PERFORMANCE BRIEF</h1>
            <span className="block text-xs text-slate-500 mt-1 font-medium">Digital Representation of Metro Twin City • San Francisco District</span>
          </div>
          <div className="text-right text-xs">
            <span className="block font-bold">REPORT REF: UT-2026-A</span>
            <span className="block text-slate-500 mt-0.5">DATE: June 27, 2026</span>
            <span className="block text-slate-500">CYCLE: Weekly Snapshot</span>
          </div>
        </div>

        {/* Executive summary statement */}
        <div className="bg-slate-50 p-5 rounded-xl border border-slate-150 print:bg-white print:border-slate-300">
          <h3 className="font-extrabold text-sm text-slate-900 mb-2 uppercase tracking-wide">1. Strategic Overview</h3>
          <p className="text-xs text-slate-700 leading-relaxed print:text-black">
            This document outlines the cumulative municipal scorecards calculated automatically by the Urban Twin AI engine. Shifting conditions are assessed dynamically from aggregate public reports filed within the preceding cycle. All telemetry data is stored and checked securely in our distributed system to optimize maintenance dispatch and prevent localized infrastructure failure.
          </p>
        </div>

        {/* Health Scores layout */}
        <div className="space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide border-b border-slate-200 pb-1.5">2. Infrastructure Scorecard</h3>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
            {[
              { label: 'OVERALL', val: healthMetrics.overallHealth },
              { label: 'ROADS', val: healthMetrics.roadHealth },
              { label: 'DRAINAGE', val: healthMetrics.drainageHealth },
              { label: 'WASTE', val: healthMetrics.wasteHealth },
              { label: 'LIGHTS', val: healthMetrics.lightingHealth },
              { label: 'WATER', val: healthMetrics.waterHealth }
            ].map((s, idx) => (
              <div key={idx} className={`p-4 rounded-xl border ${idx === 0 ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'}`}>
                <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">{s.label}</span>
                <span className="block text-2xl font-black mt-1">{s.val}%</span>
                <span className="block text-[8px] mt-2 font-semibold">
                  {s.val >= 85 ? 'OPTIMAL' : s.val >= 70 ? 'STABILIZED' : 'CRITICAL'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Comparison chart */}
        <div className="space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide border-b border-slate-200 pb-1.5">3. Metric Comparison vs Target Baseline</h3>
          <div className="h-60 w-full bg-slate-50/50 p-2 rounded-xl border border-slate-100 print:bg-white print:border-none">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#475569" fontSize={11} fontWeight={600} />
                <YAxis stroke="#475569" fontSize={11} domain={[40, 100]} />
                <Tooltip />
                <Bar dataKey="Health" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Target" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* High priority backlogs */}
        <div className="space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide border-b border-slate-200 pb-1.5">4. Critical & High Urgency Dispatch List</h3>
          
          {priorityIncidents.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No critical backlogs outstanding for this cycle.</p>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold print:bg-slate-100">
                  <tr>
                    <th className="px-4 py-3">REF ID</th>
                    <th className="px-4 py-3">CATEGORY</th>
                    <th className="px-4 py-3">SEVERITY</th>
                    <th className="px-4 py-3">STREET SITE</th>
                    <th className="px-4 py-3 text-right">PRIORITY SCORE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {priorityIncidents.map((rep) => (
                    <tr key={rep.id} className="hover:bg-slate-50/40">
                      <td className="px-4 py-3 font-mono font-bold text-slate-600">{rep.id}</td>
                      <td className="px-4 py-3 uppercase font-medium">{rep.issueType.replace('_', ' ')}</td>
                      <td className="px-4 py-3 font-bold text-rose-600 uppercase">{rep.severity}</td>
                      <td className="px-4 py-3 text-slate-600 truncate max-w-xs">{rep.locationName}</td>
                      <td className="px-4 py-3 text-right font-black">{rep.priorityScore}/100</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* AI Recommendations */}
        <div className="space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide border-b border-slate-200 pb-1.5">5. Suggested Department Priorities</h3>
          
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-4 border border-slate-200 rounded-xl space-y-2">
              <h4 className="font-bold text-xs text-blue-700 flex items-center gap-1">
                <HardHat className="w-4 h-4 text-slate-600" /> Infrastructure Dispatch Directives
              </h4>
              <ul className="space-y-2 text-xs text-slate-600 list-disc pl-4 leading-relaxed">
                <li>Deploy high-performance warm-mix asphalt patch teams to central roadways immediately.</li>
                <li>Initiate emergency storm sewer main flushing on low-elevation catch basins.</li>
                <li>Monitor water loop isolations on secondary lines to curb soil-undermining pressure surges.</li>
              </ul>
            </div>

            <div className="p-4 border border-slate-200 rounded-xl space-y-2">
              <h4 className="font-bold text-xs text-blue-700 flex items-center gap-1">
                <TrendingUp className="w-4 h-4 text-slate-600" /> Administrative Policy Guidance
              </h4>
              <ul className="space-y-2 text-xs text-slate-600 list-disc pl-4 leading-relaxed">
                <li>Transition streetlighting assets from citizen reporting dependencies to smart telemetry nodes.</li>
                <li>Establish quarterly bulky-waste collections near community spaces to curb dumping behavior.</li>
                <li>Milling campaigns should be prioritized over short-term patching schedules to save long-term expenditure.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Signature lines */}
        <div className="grid grid-cols-2 gap-12 pt-12 border-t border-slate-200 text-xs">
          <div>
            <div className="w-48 border-b border-slate-900 h-10 mb-2" />
            <span className="block font-bold">Public Works Representative</span>
            <span className="block text-slate-500">Operations Board Approval</span>
          </div>
          <div className="text-right">
            <div className="w-48 border-b border-slate-900 h-10 mb-2 ml-auto" />
            <span className="block font-bold">Urban Twin AI Engine</span>
            <span className="block text-slate-500">Autonomous Verifications Certificate</span>
          </div>
        </div>
      </div>
    </div>
  );
};
