/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef } from 'react';
import { dbService } from '../services/db.service';
import { Report, CityHealthSnapshot } from '../types';
import { 
  Play, 
  Pause, 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Sparkles, 
  Activity, 
  MapPin, 
  CheckCircle, 
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ResponsiveContainer, 
  LineChart, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Line,
  ReferenceLine
} from 'recharts';

export const CityTimelinePage: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [snapshots, setSnapshots] = useState<CityHealthSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(2500); // ms per day

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load database on mount
  useEffect(() => {
    async function loadData() {
      try {
        const reps = await dbService.getReports();
        const snaps = await dbService.getSnapshots();
        setReports(reps);
        setSnapshots(snaps);
        setActiveIndex(snaps.length - 1); // default to today (Day 7)
      } catch (err) {
        console.error('Error loading timeline snapshots:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Handle Playback Interval Loop
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setActiveIndex((prev) => {
          if (prev >= snapshots.length - 1) {
            return 0; // loop back to day 1
          }
          return prev + 1;
        });
      }, playbackSpeed);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, snapshots, playbackSpeed]);

  const activeSnap = snapshots[activeIndex];

  // Helper: filter reports representing active states of each specific timeline day
  const activeReportsForDay = () => {
    if (!activeSnap) return [];
    const dayNum = activeIndex + 1; // 1 to 7

    // Dynamic timeline states for demo representation
    const repsCopy = [...reports];
    const map: Record<string, { status: 'pending' | 'in_progress' | 'resolved'; visible: boolean }> = {
      'rep-4': { visible: true, status: dayNum >= 5 ? 'resolved' : 'pending' }, // streetlight resolved on day 5
      'rep-3': { visible: dayNum >= 2, status: 'pending' }, // trash appears day 2
      'rep-1': { visible: dayNum >= 3, status: 'pending' }, // pothole day 3
      'rep-2': { visible: dayNum >= 4, status: dayNum >= 7 ? 'resolved' : dayNum >= 5 ? 'in_progress' : 'pending' }, // flood day 4, progress day 5, resolved day 7
      'rep-5': { visible: dayNum >= 6, status: dayNum >= 7 ? 'in_progress' : 'pending' } // water leak day 6
    };

    return repsCopy
      .filter(r => map[r.id]?.visible)
      .map(r => ({
        ...r,
        status: map[r.id]?.status || r.status
      }));
  };

  const dayReports = activeReportsForDay();

  // Scale coordinates to fit mini map
  const getSvgCoords = (lat: number, lng: number) => {
    const minLat = 6.6600;
    const maxLat = 6.7300;
    const minLng = -1.7200;
    const maxLng = -1.5000;

    const percentX = (lng - minLng) / (maxLng - minLng);
    const percentY = 1 - (lat - minLat) / (maxLat - minLat);

    return {
      x: percentX * 100,
      y: percentY * 100
    };
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'high': return '#f97316';
      case 'critical': return '#ef4444';
      default: return '#3b82f6';
    }
  };

  const getProgressColor = (score: number) => {
    if (score >= 85) return 'bg-emerald-500';
    if (score >= 70) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  // Recharts Line Chart Setup
  const lineChartData = snapshots.map((s, idx) => ({
    name: s.date,
    'Overall Health': s.overallHealth,
    'Road Health': s.roadHealth,
    'Drainage Health': s.drainageHealth,
    'Waste Health': s.wasteHealth,
    index: idx
  }));

  if (loading || snapshots.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh] bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-blue-600/30 border-t-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Loading Historical Snapshot Timeline...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold uppercase text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
          <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" /> City Timeline Replay
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-[11px] font-medium">
          Observe how the city's health dynamically fluctuates day-by-day. Play back critical storm damage events and see how localized repairs raise municipal scores.
        </p>
      </div>

      {/* CORE TIMELINE REPLAY CONTROL BOARD */}
      <div className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Left: Day Indicator */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded bg-blue-600 text-white flex items-center justify-center font-black text-sm shadow">
              {activeSnap.date.replace('Day ', '')}
            </div>
            <div>
              <span className="text-[9px] text-slate-400 uppercase font-black tracking-wider block">Playback Cycle</span>
              <h3 className="font-bold text-xs text-slate-800 dark:text-white">Simulation: {activeSnap.date}</h3>
            </div>
          </div>

          {/* Center: Play Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setActiveIndex(0); setIsPlaying(false); }}
              className="p-1.5 rounded border border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
              title="Reset to Day 1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setActiveIndex(prev => Math.max(0, prev - 1))}
              disabled={activeIndex === 0}
              className="p-1.5 rounded border border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 disabled:opacity-40"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              id="timeline-play-btn"
              className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 fill-white" /> : <Play className="w-3.5 h-3.5 fill-white" />}
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            <button
              onClick={() => setActiveIndex(prev => Math.min(snapshots.length - 1, prev + 1))}
              disabled={activeIndex === snapshots.length - 1}
              className="p-1.5 rounded border border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 disabled:opacity-40"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Right: Play Speed adjustment */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase flex-shrink-0">Replay Speed</span>
            <select
              value={playbackSpeed}
              onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
              className="text-xs p-1.5 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-semibold w-full md:w-auto"
            >
              <option value={4000}>4s (Slow)</option>
              <option value={2500}>2.5s (Normal)</option>
              <option value={1200}>1.2s (Fast)</option>
            </select>
          </div>
        </div>

        {/* Timeline Slider Progress bar */}
        <div className="space-y-1">
          <input
            type="range"
            min="0"
            max={snapshots.length - 1}
            value={activeIndex}
            onChange={(e) => { setActiveIndex(Number(e.target.value)); setIsPlaying(false); }}
            className="w-full h-2 bg-slate-100 dark:bg-slate-950 rounded-lg appearance-none cursor-pointer accent-blue-600 transition-colors"
          />
          <div className="flex justify-between text-[10px] font-bold text-slate-400">
            {snapshots.map((s, idx) => (
              <button 
                key={s.id} 
                onClick={() => { setActiveIndex(idx); setIsPlaying(false); }}
                className={`hover:text-blue-500 transition-colors ${idx === activeIndex ? 'text-blue-600 dark:text-blue-400 scale-110' : ''}`}
              >
                {s.date}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* GEMINI NARRATION BOARD */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={activeIndex}
          className="p-3.5 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100/60 dark:border-blue-900/40 shadow-xs flex items-start gap-3"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.25 }}
        >
          <div className="p-2 rounded bg-blue-600 text-white flex-shrink-0 shadow">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-micro text-blue-600 dark:text-blue-400 mb-0.5">
              Digital Twin AI Narration
            </h4>
            <p className="text-xs md:text-sm font-medium leading-normal text-slate-700 dark:text-slate-200">
              "{activeSnap.aiNarration}"
            </p>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* METRICS & MINI-MAP SIDE-BY-SIDE PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Left: Dynamic Health Gauges */}
        <div className="lg:col-span-2 p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <h3 className="text-micro flex items-center gap-1.5 mb-2">
            <Activity className="w-4.5 h-4.5 text-blue-600" /> Active System Status
          </h3>

          {[
            { label: 'Overall City Health', val: activeSnap.overallHealth },
            { label: 'Road Quality Division', val: activeSnap.roadHealth },
            { label: 'Drainage Systems', val: activeSnap.drainageHealth },
            { label: 'Waste Management', val: activeSnap.wasteHealth },
            { label: 'Streetlighting Grid', val: activeSnap.lightingHealth },
            { label: 'Water Infrastructure', val: activeSnap.waterHealth }
          ].map((m, index) => (
            <div key={index} className="space-y-1">
              <div className="flex justify-between items-baseline">
                <span className={`text-[11px] ${index === 0 ? 'font-bold text-slate-900 dark:text-white' : 'font-semibold text-slate-500 dark:text-slate-450'}`}>
                  {m.label}
                </span>
                <span className={`text-[11px] font-black ${index === 0 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-800 dark:text-slate-200'}`}>
                  {m.val}%
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-950 rounded h-1.5">
                <motion.div 
                  className={`h-1.5 rounded ${getProgressColor(m.val)}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${m.val}%` }}
                  transition={{ type: 'spring', stiffness: 80 }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Right: Mini-Map Telemetry of this Snapshot */}
        <div className="lg:col-span-3 p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-micro flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-red-500" /> Map State: {activeSnap.date}
            </h3>
            <span className="text-[10px] font-mono text-slate-400">
              Active markers: {dayReports.filter(r => r.status !== 'resolved').length}
            </span>
          </div>

          {/* Mini SVG Grid representing city map */}
          <div className="relative h-48 rounded border border-slate-150 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/20 overflow-hidden mb-3">
            <svg className="absolute inset-0 w-full h-full text-slate-200/40 dark:text-slate-900/40">
              <pattern id="mini-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" />
              </pattern>
              <rect width="100%" height="100%" fill="url(#mini-grid)" />
              
              {/* Central roads */}
              <line x1="0" y1="35%" x2="100%" y2="35%" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
              <line x1="30%" y1="0" x2="30%" y2="100%" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
              <line x1="60%" y1="0" x2="60%" y2="100%" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
            </svg>

            {/* Pulsing Day Markers */}
            {dayReports.map((r) => {
              const coords = getSvgCoords(r.latitude, r.longitude);
              const isResolved = r.status === 'resolved';

              return (
                <div
                  key={r.id}
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
                  style={{ top: `${coords.y}%`, left: `${coords.x}%` }}
                >
                  <div className="relative flex items-center justify-center">
                    {!isResolved && (
                      <span 
                        className="absolute h-5 w-5 rounded-full opacity-40 animate-ping"
                        style={{ backgroundColor: getSeverityColor(r.severity) }}
                      />
                    )}
                    <div 
                      className={`w-3 h-3 rounded-full border border-white flex items-center justify-center shadow-md ${
                        isResolved ? 'bg-slate-300 dark:bg-slate-700' : ''
                      }`}
                      style={isResolved ? {} : { backgroundColor: getSeverityColor(r.severity) }}
                    >
                      {isResolved ? (
                        <CheckCircle className="w-1.5 h-1.5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <MapPin className="w-1.5 h-1.5 text-white" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-[10px] font-mono text-slate-500 flex justify-between items-center">
            <span>COORDINATE REGION: SAN FRANCISCO TWIN</span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 block" /> Active
              <span className="w-1.5 h-1.5 rounded-full bg-slate-450 block ml-2" /> Resolved
            </span>
          </div>
        </div>
      </div>

      {/* LINE CHART GRAPH INDICATING BACKLOG CURVE OVER TIME */}
      <div className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <h3 className="text-micro mb-3 flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-blue-600" /> Cumulative Health Trend
        </h3>
        <div className="min-h-[200px]">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={lineChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-800" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={9} />
              <YAxis stroke="#64748b" fontSize={9} domain={[60, 100]} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(30, 41, 59, 0.9)', 
                  border: 'none', 
                  borderRadius: '4px',
                  color: '#fff',
                  fontSize: '10px'
                }} 
              />
              <Line type="monotone" dataKey="Overall Health" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="Road Health" stroke="#f59e0b" strokeWidth={1} strokeDasharray="5 5" />
              <Line type="monotone" dataKey="Drainage Health" stroke="#ef4444" strokeWidth={1} strokeDasharray="5 5" />
              
              {/* Highlight reference line at the active index scrubber */}
              <ReferenceLine x={activeSnap.date} stroke="#3b82f6" strokeWidth={1} strokeDasharray="3 3" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
