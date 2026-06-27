/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dbService, calculateCityHealth } from '../services/db.service';
import { Report, CityHealthSnapshot } from '../types';
import { 
  Activity, 
  ArrowRight, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  HardHat, 
  MapPin, 
  ArrowUpRight, 
  ArrowDownRight, 
  TrendingUp,
  Inbox
} from 'lucide-react';
import { motion } from 'motion/react';
import { 
  ResponsiveContainer, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  AreaChart, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Area,
  Legend 
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [snapshots, setSnapshots] = useState<CityHealthSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  // Load database on mount
  useEffect(() => {
    async function loadData() {
      try {
        const reps = await dbService.getReports();
        const snaps = await dbService.getSnapshots();
        setReports(reps);
        setSnapshots(snaps);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Recalculate metrics dynamically from reports
  const healthMetrics = calculateCityHealth(reports);

  // Filter active issues (not resolved)
  const activeReports = reports.filter(r => r.status !== 'resolved');
  const resolvedCount = reports.filter(r => r.status === 'resolved').length;

  // Recharts radar data format
  const radarData = [
    { name: 'Roads', Current: healthMetrics.roadHealth, Optimal: 95 },
    { name: 'Drainage', Current: healthMetrics.drainageHealth, Optimal: 95 },
    { name: 'Waste', Current: healthMetrics.wasteHealth, Optimal: 95 },
    { name: 'Lighting', Current: healthMetrics.lightingHealth, Optimal: 95 },
    { name: 'Water', Current: healthMetrics.waterHealth, Optimal: 95 },
  ];

  // Recharts area charts data (last 7 historical points)
  const chartData = snapshots.map(s => ({
    name: s.date,
    'Overall Health': s.overallHealth,
    'Incidents': s.incidentCount,
    'Resolved': s.resolvedCount,
  }));

  const handleResolve = async (id: string) => {
    setResolvingId(id);
    try {
      await dbService.updateReportStatus(id, 'resolved');
      // Reload reports
      const updatedReps = await dbService.getReports();
      setReports(updatedReps);
      // Reload snapshots to show timeline update
      const updatedSnaps = await dbService.getSnapshots();
      setSnapshots(updatedSnaps);
    } catch (err) {
      console.error('Error resolving report:', err);
    } finally {
      setResolvingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh] bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-blue-600/30 border-t-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Synchronizing Digital Twin Environment...</p>
        </div>
      </div>
    );
  }

  // Helper colors for health percentage
  const getHealthColorClass = (val: number) => {
    if (val >= 85) return 'text-emerald-500 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/50';
    if (val >= 70) return 'text-amber-500 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/50';
    return 'text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/50';
  };

  const getHealthProgressColor = (val: number) => {
    if (val >= 85) return 'bg-emerald-500';
    if (val >= 70) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const getSeverityBadgeClass = (sev: string) => {
    switch (sev) {
      case 'low': return 'text-green-700 bg-green-50 border-green-200 dark:bg-green-950/40 dark:text-green-400 dark:border-green-900/40';
      case 'medium': return 'text-yellow-700 bg-yellow-50 border-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-400 dark:border-yellow-900/40';
      case 'high': return 'text-orange-700 bg-orange-50 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-900/40';
      default: return 'text-red-700 bg-red-50 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/40';
    }
  };

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
      {/* Upper header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold uppercase text-slate-900 dark:text-white tracking-tight">City Console</h1>
          <p className="text-slate-500 dark:text-slate-400 text-[11px] font-medium">Real-time infrastructure health matrix and active reporting diagnostics.</p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Link
            to="/report"
            id="dash-report-btn"
            className="flex-1 md:flex-none px-3.5 py-1.5 rounded font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm"
          >
            <AlertTriangle className="w-4 h-4" /> Report Civic Issue
          </Link>
          <Link
            to="/map"
            className="flex-1 md:flex-none px-3 py-1.5 rounded bg-white text-slate-800 border border-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5"
          >
            <MapPin className="w-4 h-4" /> Launch Live Map
          </Link>
        </div>
      </div>

      {/* Main KPI Grid of Health Elements */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
        {/* Overall Health Card */}
        <motion.div 
          className={`p-3 rounded-lg border flex flex-col justify-between shadow-xs ${getHealthColorClass(healthMetrics.overallHealth)} col-span-1 sm:col-span-2`}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider">Overall City Health</span>
              <Activity className="w-4 h-4 opacity-85" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black">{healthMetrics.overallHealth}%</span>
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-75 flex items-center">
                {healthMetrics.overallHealth >= 80 ? (
                  <>Stable <ArrowUpRight className="w-3 h-3 inline" /></>
                ) : (
                  <>Stress <ArrowDownRight className="w-3 h-3 inline" /></>
                )}
              </span>
            </div>
          </div>
          <div className="mt-2.5">
            <div className="w-full bg-slate-200/50 dark:bg-slate-800/50 rounded h-1.5 mb-1.5">
              <div 
                className={`h-1.5 rounded transition-all duration-500 ${getHealthProgressColor(healthMetrics.overallHealth)}`} 
                style={{ width: `${healthMetrics.overallHealth}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-600 dark:text-slate-300 font-medium leading-normal opacity-95">
              Cumulative health calculated across road, storm drainage, water loop, lighting, and sanitation twin states.
            </p>
          </div>
        </motion.div>

        {/* Element Card: Roads */}
        <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider">Road Health</span>
              <HardHat className="w-3.5 h-3.5" />
            </div>
            <span className="text-2xl font-bold text-slate-950 dark:text-white">{healthMetrics.roadHealth}%</span>
          </div>
          <div className="mt-2.5">
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded h-1.5 mb-1.5">
              <div 
                className={`h-1.5 rounded transition-all duration-500 ${getHealthProgressColor(healthMetrics.roadHealth)}`} 
                style={{ width: `${healthMetrics.roadHealth}%` }}
              />
            </div>
            <span className="text-[9px] text-slate-500 dark:text-slate-400 leading-tight block">
              {healthMetrics.roadHealth >= 80 ? 'Optimal paving density.' : 'Pothole backlogs detected.'}
            </span>
          </div>
        </div>

        {/* Element Card: Drainage */}
        <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider">Drainage Health</span>
              <Activity className="w-3.5 h-3.5" />
            </div>
            <span className="text-2xl font-bold text-slate-950 dark:text-white">{healthMetrics.drainageHealth}%</span>
          </div>
          <div className="mt-2.5">
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded h-1.5 mb-1.5">
              <div 
                className={`h-1.5 rounded transition-all duration-500 ${getHealthProgressColor(healthMetrics.drainageHealth)}`} 
                style={{ width: `${healthMetrics.drainageHealth}%` }}
              />
            </div>
            <span className="text-[9px] text-slate-500 dark:text-slate-400 leading-tight block">
              {healthMetrics.drainageHealth >= 80 ? 'Main storm drains clear.' : 'Localized ponding risks.'}
            </span>
          </div>
        </div>

        {/* Element Card: Waste */}
        <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider">Waste Health</span>
              <Inbox className="w-3.5 h-3.5" />
            </div>
            <span className="text-2xl font-bold text-slate-950 dark:text-white">{healthMetrics.wasteHealth}%</span>
          </div>
          <div className="mt-2.5">
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded h-1.5 mb-1.5">
              <div 
                className={`h-1.5 rounded transition-all duration-500 ${getHealthProgressColor(healthMetrics.wasteHealth)}`} 
                style={{ width: `${healthMetrics.wasteHealth}%` }}
              />
            </div>
            <span className="text-[9px] text-slate-500 dark:text-slate-400 leading-tight block">
              {healthMetrics.wasteHealth >= 80 ? 'No bulk garbage overflows.' : 'Dumping backlogs registered.'}
            </span>
          </div>
        </div>

        {/* Element Card: Lighting */}
        <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider">Street Lighting</span>
              <Activity className="w-3.5 h-3.5" />
            </div>
            <span className="text-2xl font-bold text-slate-950 dark:text-white">{healthMetrics.lightingHealth}%</span>
          </div>
          <div className="mt-2.5">
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded h-1.5 mb-1.5">
              <div 
                className={`h-1.5 rounded transition-all duration-500 ${getHealthProgressColor(healthMetrics.lightingHealth)}`} 
                style={{ width: `${healthMetrics.lightingHealth}%` }}
              />
            </div>
            <span className="text-[9px] text-slate-500 dark:text-slate-400 leading-tight block">
              {healthMetrics.lightingHealth >= 80 ? 'Regional grid fully lit.' : 'Grid lamp failures reported.'}
            </span>
          </div>
        </div>

        {/* Element Card: Water */}
        <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider">Water Infra</span>
              <Activity className="w-3.5 h-3.5" />
            </div>
            <span className="text-2xl font-bold text-slate-950 dark:text-white">{healthMetrics.waterHealth}%</span>
          </div>
          <div className="mt-2.5">
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded h-1.5 mb-1.5">
              <div 
                className={`h-1.5 rounded transition-all duration-500 ${getHealthProgressColor(healthMetrics.waterHealth)}`} 
                style={{ width: `${healthMetrics.waterHealth}%` }}
              />
            </div>
            <span className="text-[9px] text-slate-500 dark:text-slate-400 leading-tight block">
              {healthMetrics.waterHealth >= 80 ? 'Main supply loops active.' : 'Main supply pipe leaks detected.'}
            </span>
          </div>
        </div>
      </div>

      {/* Visual Analytics Sector */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
        {/* Spider Web Radar Chart (Left Col) */}
        <div className="lg:col-span-2 p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col">
          <div className="flex items-center gap-1.5 mb-3">
            <TrendingUp className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-micro">Infrastructure Footprint</h3>
          </div>
          <div className="flex-1 min-h-[250px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                <PolarGrid stroke="#e2e8f0" className="dark:stroke-slate-800" />
                <PolarAngleAxis dataKey="name" stroke="#64748b" fontSize={10} fontWeight={600} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#64748b" fontSize={8} />
                <Radar name="Active Health" dataKey="Current" stroke="#2563eb" fill="#3b82f6" fillOpacity={0.25} />
                <Radar name="Baseline" dataKey="Optimal" stroke="#10b981" fill="#10b981" fillOpacity={0.05} />
                <Legend iconSize={6} wrapperStyle={{ fontSize: 10 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cumulative Historical Snapshots Graph (Right Col) */}
        <div className="lg:col-span-3 p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <Activity className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-micro">Historical City Evolution</h3>
            </div>
            <Link to="/timeline" className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline">
              Digital Twin Replay <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorOverall" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-800" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={9} />
                <YAxis stroke="#64748b" fontSize={9} domain={[40, 100]} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(30, 41, 59, 0.95)', 
                    border: 'none', 
                    borderRadius: '4px',
                    color: '#fff',
                    fontSize: '10px'
                  }} 
                />
                <Area type="monotone" dataKey="Overall Health" stroke="#2563eb" strokeWidth={1.5} fillOpacity={1} fill="url(#colorOverall)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Split Grid: Bottom Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Active Incident Reports Feed */}
        <div className="xl:col-span-2 p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-micro flex items-center gap-2">
              Active Incident Feed
              <span className="text-[9px] font-bold text-white bg-blue-600 px-1.5 py-0.5 rounded">
                {activeReports.length} Active
              </span>
            </h3>
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
              Resolved: {resolvedCount}
            </span>
          </div>

          {activeReports.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle className="w-12 h-12 text-emerald-500 mb-4" />
              <h4 className="font-bold text-base text-slate-900 dark:text-white">All Clear! No Active Incidents</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1">
                Your city infrastructure is fully repaired. Feel free to report a new issue to see the health system dynamically decay.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[450px] overflow-y-auto pr-2">
              {activeReports.map((report) => (
                <div 
                  key={report.id}
                  className="p-2.5 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 hover:border-blue-400 dark:hover:border-blue-800 transition-all duration-200 flex flex-col sm:flex-row gap-3 items-start sm:items-center"
                >
                  {/* Thumbnail */}
                  {report.imageUrl && (
                    <img 
                      src={report.imageUrl} 
                      alt={report.issueType}
                      className="w-12 h-12 rounded object-cover border border-slate-200 dark:border-slate-800 self-start sm:self-auto"
                      referrerPolicy="no-referrer"
                    />
                  )}

                  {/* Body details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap gap-1.5 items-center mb-0.5">
                      <span className="font-bold text-xs text-slate-900 dark:text-white capitalize">
                        {report.issueType.replace('_', ' ')}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${getSeverityBadgeClass(report.severity)}`}>
                        {report.severity}
                      </span>
                      <span className="text-[9px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" /> Priority: {report.priorityScore}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-tight">
                      {report.description}
                    </p>
                    <div className="text-[9px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3 text-red-500" /> {report.locationName}
                    </div>
                  </div>

                  {/* Action */}
                  <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
                    <Link
                      to={`/map?id=${report.id}`}
                      className="p-1.5 rounded border border-slate-200 hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                      title="Inspect on map"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                    </Link>
                    <button
                      onClick={() => handleResolve(report.id)}
                      disabled={resolvingId === report.id}
                      className="px-2.5 py-1 rounded text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:bg-slate-300 transition-colors flex items-center gap-1"
                    >
                      {resolvingId === report.id ? 'Fixing...' : 'Resolve'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Department Health Status Grid */}
        <div className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col">
          <h3 className="text-micro mb-3">Muni Performance</h3>
          <div className="flex-1 space-y-2">
            {[
              {
                dept: "Roads Department",
                count: reports.filter(r => r.affectedInfrastructure === 'road' && r.status !== 'resolved').length,
                status: healthMetrics.roadHealth >= 80 ? 'Good' : 'Overload',
                color: healthMetrics.roadHealth >= 80 ? 'text-green-500' : 'text-amber-500',
              },
              {
                dept: "Drainage Department",
                count: reports.filter(r => r.affectedInfrastructure === 'drainage' && r.status !== 'resolved').length,
                status: healthMetrics.drainageHealth >= 80 ? 'Good' : 'Action Required',
                color: healthMetrics.drainageHealth >= 80 ? 'text-green-500' : 'text-rose-500',
              },
              {
                dept: "Sanitation Department",
                count: reports.filter(r => r.affectedInfrastructure === 'waste' && r.status !== 'resolved').length,
                status: healthMetrics.wasteHealth >= 80 ? 'Good' : 'Pending',
                color: healthMetrics.wasteHealth >= 80 ? 'text-green-500' : 'text-amber-500',
              },
              {
                dept: "Electricity Division",
                count: reports.filter(r => r.affectedInfrastructure === 'lighting' && r.status !== 'resolved').length,
                status: healthMetrics.lightingHealth >= 80 ? 'Good' : 'Outage Logs',
                color: healthMetrics.lightingHealth >= 80 ? 'text-green-500' : 'text-rose-500',
              },
              {
                dept: "Water Infrastructure",
                count: reports.filter(r => r.affectedInfrastructure === 'water' && r.status !== 'resolved').length,
                status: healthMetrics.waterHealth >= 80 ? 'Good' : 'Leaks Active',
                color: healthMetrics.waterHealth >= 80 ? 'text-green-500' : 'text-amber-500',
              }
            ].map((d, index) => (
              <div key={index} className="flex justify-between items-center p-2 rounded border border-slate-100 dark:border-slate-800/40 bg-slate-50/50 dark:bg-slate-950/20">
                <div>
                  <span className="block text-xs font-bold text-slate-800 dark:text-slate-200">{d.dept}</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    Workload: {d.count} issues
                  </span>
                </div>
                <div className="text-right">
                  <span className={`text-[10px] uppercase font-extrabold tracking-wider ${d.color}`}>{d.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
