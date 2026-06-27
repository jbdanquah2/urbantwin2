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
  Inbox,
  Trash2,
  Lightbulb,
  Droplet,
  Check,
  Filter,
  ShieldAlert,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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

  // Advanced UI Interaction states
  const [activeTab, setActiveTab] = useState<'trend' | 'radar'>('trend');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<boolean>(false);

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

  // Filtered active feed list based on user selections
  const filteredActiveReports = activeReports.filter(rep => {
    const matchesCategory = categoryFilter === 'all' || rep.affectedInfrastructure === categoryFilter;
    const matchesPriority = !priorityFilter || rep.severity === 'high' || rep.severity === 'critical';
    return matchesCategory && matchesPriority;
  });

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
          <div className="w-12 h-12 rounded-full border-4 border-blue-600/35 border-t-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Syncing Kumasi Twin Console...</p>
        </div>
      </div>
    );
  }

  // Helper colors for health percentage
  const getHealthColorClass = (val: number) => {
    if (val >= 85) return 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/50';
    if (val >= 70) return 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/50';
    return 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/50';
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
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Upper header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest block mb-1 font-mono">Ashanti Region • Operations Console</span>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Kumasi Digital Twin</h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">Real-time civic diagnostics, dynamic infrastructure health tracking, and worker routing.</p>
        </div>
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <Link
            to="/report"
            id="dash-report-btn"
            className="flex-1 md:flex-none px-4 py-2 rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-98 transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs"
          >
            <AlertTriangle className="w-4 h-4" /> Report Issue
          </Link>
          <Link
            to="/map"
            className="flex-1 md:flex-none px-4 py-2 rounded-lg bg-white text-slate-800 border border-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 transition-all text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2"
          >
            <MapPin className="w-4 h-4" /> View Map
          </Link>
        </div>
      </div>

      {/* Main KPI Grid of Health Elements */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {/* Hero KPI Card: Overall Health */}
        <motion.div 
          className={`p-4 rounded-xl border flex flex-col justify-between shadow-xs ${getHealthColorClass(healthMetrics.overallHealth)} col-span-1 md:col-span-2`}
          initial={{ scale: 0.98, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.25 }}
        >
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest font-mono">Overall City Health</span>
              <Activity className="w-4 h-4 opacity-80" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black tracking-tight">{healthMetrics.overallHealth}%</span>
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-0.5">
                {healthMetrics.overallHealth >= 80 ? (
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">Stable <ArrowUpRight className="w-3 h-3" /></span>
                ) : (
                  <span className="text-rose-600 dark:text-rose-400 flex items-center gap-0.5">Under Stress <ArrowDownRight className="w-3 h-3" /></span>
                )}
              </span>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-slate-200/60 dark:bg-slate-800/60 rounded-full h-2 mb-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${getHealthProgressColor(healthMetrics.overallHealth)}`} 
                style={{ width: `${healthMetrics.overallHealth}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-600 dark:text-slate-350 font-medium leading-relaxed opacity-90">
              Aggregated from real-time road repairs, drainage capacities, refuse heap clearance, and water supply leakages.
            </p>
          </div>
        </motion.div>

        {/* Roads Health Card */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-xs transition-colors">
          <div>
            <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest font-mono">Road Network</span>
              <div className="p-1 rounded bg-slate-50 dark:bg-slate-800/80">
                <HardHat className="w-4 h-4 text-blue-500" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white">{healthMetrics.roadHealth}%</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase">Health</span>
            </div>
          </div>
          <div className="mt-3">
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mb-2">
              <div 
                className={`h-1.5 rounded-full transition-all duration-500 ${getHealthProgressColor(healthMetrics.roadHealth)}`} 
                style={{ width: `${healthMetrics.roadHealth}%` }}
              />
            </div>
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 block truncate">
              {healthMetrics.roadHealth >= 80 ? 'Pavements in good shape' : 'Pothole repairs backlogged'}
            </span>
          </div>
        </div>

        {/* Drainage Health Card */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-xs transition-colors">
          <div>
            <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest font-mono">Storm Drainage</span>
              <div className="p-1 rounded bg-slate-50 dark:bg-slate-800/80">
                <Activity className="w-4 h-4 text-emerald-500" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white">{healthMetrics.drainageHealth}%</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase">Health</span>
            </div>
          </div>
          <div className="mt-3">
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mb-2">
              <div 
                className={`h-1.5 rounded-full transition-all duration-500 ${getHealthProgressColor(healthMetrics.drainageHealth)}`} 
                style={{ width: `${healthMetrics.drainageHealth}%` }}
              />
            </div>
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 block truncate">
              {healthMetrics.drainageHealth >= 80 ? 'Primary culverts clear' : 'Choked gutters detected'}
            </span>
          </div>
        </div>

        {/* Waste Health Card */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-xs transition-colors">
          <div>
            <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest font-mono">Sanitation / Waste</span>
              <div className="p-1 rounded bg-slate-50 dark:bg-slate-800/80">
                <Trash2 className="w-4 h-4 text-amber-500" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white">{healthMetrics.wasteHealth}%</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase">Health</span>
            </div>
          </div>
          <div className="mt-3">
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mb-2">
              <div 
                className={`h-1.5 rounded-full transition-all duration-500 ${getHealthProgressColor(healthMetrics.wasteHealth)}`} 
                style={{ width: `${healthMetrics.wasteHealth}%` }}
              />
            </div>
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 block truncate">
              {healthMetrics.wasteHealth >= 80 ? 'Market spaces cleaned' : 'Bulk dump piles registered'}
            </span>
          </div>
        </div>

        {/* Lighting Health Card */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-xs transition-colors">
          <div>
            <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest font-mono">Street Lighting</span>
              <div className="p-1 rounded bg-slate-50 dark:bg-slate-800/80">
                <Lightbulb className="w-4 h-4 text-yellow-500" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white">{healthMetrics.lightingHealth}%</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase">Health</span>
            </div>
          </div>
          <div className="mt-3">
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mb-2">
              <div 
                className={`h-1.5 rounded-full transition-all duration-500 ${getHealthProgressColor(healthMetrics.lightingHealth)}`} 
                style={{ width: `${healthMetrics.lightingHealth}%` }}
              />
            </div>
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 block truncate">
              {healthMetrics.lightingHealth >= 80 ? 'Public lamps operational' : 'Dark street lamps blacked'}
            </span>
          </div>
        </div>

        {/* Water Health Card */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-xs transition-colors">
          <div>
            <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest font-mono">Water Loop</span>
              <div className="p-1 rounded bg-slate-50 dark:bg-slate-800/80">
                <Droplet className="w-4 h-4 text-sky-500" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white">{healthMetrics.waterHealth}%</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase">Health</span>
            </div>
          </div>
          <div className="mt-3">
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mb-2">
              <div 
                className={`h-1.5 rounded-full transition-all duration-500 ${getHealthProgressColor(healthMetrics.waterHealth)}`} 
                style={{ width: `${healthMetrics.waterHealth}%` }}
              />
            </div>
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 block truncate">
              {healthMetrics.waterHealth >= 80 ? 'Mains pressures uniform' : 'Leakages and pipe bursts'}
            </span>
          </div>
        </div>
      </div>

      {/* Visual Analytics Sector - Tabbed Layout for Simplification & Space Optimization */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-150 dark:border-slate-800 pb-4 mb-5">
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-500" /> City Analytics Deck
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Toggle between historical metrics trend curves and category footprint vectors.</p>
          </div>
          
          {/* Elegant tab switcher */}
          <div className="flex p-1 bg-slate-100 dark:bg-slate-950 rounded-lg border border-slate-200/50 dark:border-slate-800/50">
            <button
              onClick={() => setActiveTab('trend')}
              className={`px-3.5 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all duration-150 flex items-center gap-1.5 ${
                activeTab === 'trend'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" /> Historical Trend
            </button>
            <button
              onClick={() => setActiveTab('radar')}
              className={`px-3.5 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all duration-150 flex items-center gap-1.5 ${
                activeTab === 'radar'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" /> Sector Footprint
            </button>
          </div>
        </div>

        {/* Content Panel */}
        <div className="min-h-[280px] flex items-center justify-center">
          <AnimatePresence mode="wait">
            {activeTab === 'trend' ? (
              <motion.div 
                key="trend"
                className="w-full"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
              >
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorOverall" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-850" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={10} fontWeight={500} />
                      <YAxis stroke="#64748b" fontSize={10} domain={[40, 100]} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                          border: 'none', 
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '11px',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                        }} 
                      />
                      <Area type="monotone" name="Twin Health" dataKey="Overall Health" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#colorOverall)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="radar"
                className="w-full max-w-lg"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
              >
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                      <PolarGrid stroke="#e2e8f0" className="dark:stroke-slate-800" />
                      <PolarAngleAxis dataKey="name" stroke="#64748b" fontSize={10} fontWeight={600} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#64748b" fontSize={8} />
                      <Radar name="Active State" dataKey="Current" stroke="#2563eb" fill="#3b82f6" fillOpacity={0.25} />
                      <Radar name="Optimal Target" dataKey="Optimal" stroke="#10b981" fill="#10b981" fillOpacity={0.05} strokeDasharray="4 4" />
                      <Legend iconSize={6} wrapperStyle={{ fontSize: 10, marginTop: '10px' }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Split Grid: Bottom Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Active Incident Reports Feed */}
        <div className="xl:col-span-2 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col">
          
          {/* Feed title and Quick Stats */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 dark:border-slate-850 pb-4 mb-4">
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-800 dark:text-slate-200 flex items-center gap-2">
                Active Incident Feed
                <span className="text-[10px] font-black text-white bg-blue-600 px-2 py-0.5 rounded-full font-mono">
                  {activeReports.length}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Real-time reports flagged by citizens & processed by Gemini.</p>
            </div>
            <div className="text-[11px] font-bold text-slate-400 bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800/85 px-2.5 py-1 rounded-lg">
              Cumulative Resolved: <span className="text-emerald-500">{resolvedCount}</span>
            </div>
          </div>

          {/* New Interactive Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-150 dark:border-slate-850">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
              <Filter className="w-3.5 h-3.5 text-blue-500" />
              <span>Filter:</span>
            </div>
            
            {/* Category pills */}
            <div className="flex flex-wrap gap-1.5 flex-1">
              {[
                { label: 'All', id: 'all' },
                { label: 'Roads', id: 'road' },
                { label: 'Drainage', id: 'drainage' },
                { label: 'Waste', id: 'waste' },
                { label: 'Lighting', id: 'lighting' },
                { label: 'Water', id: 'water' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setCategoryFilter(item.id)}
                  className={`px-3 py-1 text-[10px] font-bold rounded-lg border uppercase tracking-wider transition-all duration-150 ${
                    categoryFilter === item.id
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-850'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* High Priority Switcher */}
            <button
              onClick={() => setPriorityFilter(!priorityFilter)}
              className={`px-3 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition-all duration-150 flex items-center gap-1.5 ${
                priorityFilter
                  ? 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/40'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-850'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" /> High Priority Only
            </button>
          </div>

          {/* Active list display */}
          {filteredActiveReports.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-14 text-center bg-slate-50/50 dark:bg-slate-950/20 rounded-xl border border-dashed border-slate-200 dark:border-slate-850">
              <CheckCircle className="w-10 h-10 text-emerald-500 mb-3" />
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider">No Incidents Found</h4>
              <p className="text-xs text-slate-400 dark:text-slate-400 max-w-xs mt-1">
                No active issues match your filter. Try clearing filters or report a new issue.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
              <AnimatePresence initial={false}>
                {filteredActiveReports.map((report) => (
                  <motion.div 
                    key={report.id}
                    layoutId={report.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:shadow-xs transition-all flex flex-col sm:flex-row gap-3 items-start sm:items-center"
                  >
                    {/* Thumbnail */}
                    {report.imageUrl && (
                      <div className="relative group self-start sm:self-auto">
                        <img 
                          src={report.imageUrl} 
                          alt={report.issueType}
                          className="w-14 h-14 rounded-lg object-cover border border-slate-200 dark:border-slate-850"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}

                    {/* Body details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap gap-1.5 items-center mb-1">
                        <span className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-wide">
                          {report.issueType.replace('_', ' ')}
                        </span>
                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full border uppercase tracking-widest font-mono ${getSeverityBadgeClass(report.severity)}`}>
                          {report.severity}
                        </span>
                        <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-400 flex items-center gap-0.5 bg-slate-50 dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-100 dark:border-slate-800">
                          <Clock className="w-2.5 h-2.5 text-blue-500" /> Rank: {report.priorityScore}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-350 line-clamp-2 leading-relaxed font-medium">
                        {report.description}
                      </p>
                      <div className="text-[9px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1.5 font-mono">
                        <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" /> {report.locationName.toUpperCase()}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-850">
                      <Link
                        to={`/map?id=${report.id}`}
                        className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 dark:border-slate-850 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-400 transition-all"
                        title="Locate on Twin Map"
                      >
                        <MapPin className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleResolve(report.id)}
                        disabled={resolvingId === report.id}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-97 disabled:bg-slate-200 dark:disabled:bg-slate-800 transition-all flex items-center gap-1 shrink-0"
                      >
                        {resolvingId === report.id ? (
                          <div className="w-3 h-3 border-2 border-white/35 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                        <span>{resolvingId === report.id ? 'Fixing' : 'Resolve'}</span>
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Quick Department Health Status Grid */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col">
          <div className="border-b border-slate-100 dark:border-slate-850 pb-4 mb-4">
            <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-800 dark:text-slate-200 flex items-center gap-2">
              Muni Performance
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Assigned Ghanaian authorities and active division workflows.</p>
          </div>

          <div className="flex-1 space-y-2.5">
            {[
              {
                dept: "Dept of Urban Roads",
                count: reports.filter(r => r.affectedInfrastructure === 'road' && r.status !== 'resolved').length,
                status: healthMetrics.roadHealth >= 80 ? 'Optimal' : 'High Load',
                color: healthMetrics.roadHealth >= 80 ? 'text-green-600 bg-green-50 dark:bg-green-950/20 dark:text-green-400 border-green-100 dark:border-green-900/30' : 'text-amber-600 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400 border-amber-100 dark:border-amber-900/30',
              },
              {
                dept: "NADMO / Drainage",
                count: reports.filter(r => r.affectedInfrastructure === 'drainage' && r.status !== 'resolved').length,
                status: healthMetrics.drainageHealth >= 80 ? 'Optimal' : 'Action Required',
                color: healthMetrics.drainageHealth >= 80 ? 'text-green-600 bg-green-50 dark:bg-green-950/20 dark:text-green-400 border-green-100 dark:border-green-900/30' : 'text-rose-600 bg-rose-50 dark:bg-rose-950/20 dark:text-rose-400 border-rose-100 dark:border-rose-900/30',
              },
              {
                dept: "Zoomlion / Waste Unit",
                count: reports.filter(r => r.affectedInfrastructure === 'waste' && r.status !== 'resolved').length,
                status: healthMetrics.wasteHealth >= 80 ? 'Optimal' : 'Pending',
                color: healthMetrics.wasteHealth >= 80 ? 'text-green-600 bg-green-50 dark:bg-green-950/20 dark:text-green-400 border-green-100 dark:border-green-900/30' : 'text-amber-600 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400 border-amber-100 dark:border-amber-900/30',
              },
              {
                dept: "Electricity Co. of Ghana",
                count: reports.filter(r => r.affectedInfrastructure === 'lighting' && r.status !== 'resolved').length,
                status: healthMetrics.lightingHealth >= 80 ? 'Optimal' : 'Outage Logs',
                color: healthMetrics.lightingHealth >= 80 ? 'text-green-600 bg-green-50 dark:bg-green-950/20 dark:text-green-400 border-green-100 dark:border-green-900/30' : 'text-rose-600 bg-rose-50 dark:bg-rose-950/20 dark:text-rose-400 border-rose-100 dark:border-rose-900/30',
              },
              {
                dept: "Ghana Water Company",
                count: reports.filter(r => r.affectedInfrastructure === 'water' && r.status !== 'resolved').length,
                status: healthMetrics.waterHealth >= 80 ? 'Optimal' : 'Active Leaks',
                color: healthMetrics.waterHealth >= 80 ? 'text-green-600 bg-green-50 dark:bg-green-950/20 dark:text-green-400 border-green-100 dark:border-green-900/30' : 'text-amber-600 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400 border-amber-100 dark:border-amber-900/30',
              }
            ].map((d, index) => (
              <div key={index} className="flex justify-between items-center p-3 rounded-xl border border-slate-150 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/40">
                <div>
                  <span className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 tracking-tight">{d.dept}</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-450 mt-0.5 block font-medium">
                    Queue Volume: <strong className="text-slate-700 dark:text-slate-300 font-bold">{d.count} issues</strong>
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <span className={`text-[9px] uppercase font-black tracking-widest px-2 py-0.5 rounded border ${d.color}`}>{d.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
