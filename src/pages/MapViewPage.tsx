/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { dbService } from '../services/db.service';
import { Report } from '../types';
import { 
  Activity, 
  MapPin, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  HardHat, 
  Sparkles, 
  Inbox, 
  Layers, 
  Grid,
  Map as MapIcon,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { APIProvider, Map as GoogleMap, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';

export const MapViewPage: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [searchParams] = useSearchParams();
  const [mapMode, setMapMode] = useState<'vector' | 'google'>('vector');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  const gmapsApiKey = ((import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY) || '';

  // Load reports on mount
  useEffect(() => {
    async function fetchReports() {
      try {
        const data = await dbService.getReports();
        setReports(data);

        // Check query param for highlighting a specific incident
        const targetId = searchParams.get('id');
        if (targetId) {
          const target = data.find(r => r.id === targetId);
          if (target) {
            setSelectedReport(target);
          }
        } else if (data.length > 0) {
          // Select first active report by default
          const active = data.find(r => r.status !== 'resolved');
          setSelectedReport(active || data[0]);
        }
      } catch (e) {
        console.error('Error fetching reports for map:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchReports();
  }, [searchParams]);

  // Handle live status resolution from inside map view
  const handleResolveInMap = async (id: string) => {
    try {
      await dbService.updateReportStatus(id, 'resolved');
      const updated = await dbService.getReports();
      setReports(updated);
      const target = updated.find(r => r.id === id);
      if (target) setSelectedReport(target);
    } catch (e) {
      console.error('Failed to resolve inside map:', e);
    }
  };

  // Convert GPS bounds to local SVG coordinates for our custom Vector Grid Map
  const getSvgCoords = (lat: number, lng: number) => {
    // Coordinate bounds encompassing Kumasi, Ghana seed data
    const minLat = 6.6600;
    const maxLat = 6.7300;
    const minLng = -1.7200;
    const maxLng = -1.5000;

    const percentX = (lng - minLng) / (maxLng - minLng);
    // Y-axis is inverted in SVGs (0 is at top)
    const percentY = 1 - (lat - minLat) / (maxLat - minLat);

    return {
      x: percentX * 100, // percent width
      y: percentY * 100  // percent height
    };
  };

  // Filtered reports list
  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      const matchCat = filterCategory === 'all' || r.issueType === filterCategory;
      const matchSev = filterSeverity === 'all' || r.severity === filterSeverity;
      return matchCat && matchSev;
    });
  }, [reports, filterCategory, filterSeverity]);

  // Marker colors by severity
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return '#10b981'; // Green
      case 'medium': return '#f59e0b'; // Yellow/Amber
      case 'high': return '#f97316'; // Orange
      case 'critical': return '#ef4444'; // Red
      default: return '#3b82f6';
    }
  };

  const getSeverityBadgeClass = (sev: string) => {
    switch (sev) {
      case 'low': return 'text-green-700 bg-green-50 border-green-200 dark:bg-green-950/40 dark:text-green-400 dark:border-green-900/40';
      case 'medium': return 'text-yellow-700 bg-yellow-50 border-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-400 dark:border-yellow-900/40';
      case 'high': return 'text-orange-700 bg-orange-50 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-900/40';
      default: return 'text-red-700 bg-red-50 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/40';
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh] bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-blue-600/30 border-t-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Loading City Map Vectors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col xl:flex-row h-[calc(100vh-4rem)] overflow-hidden">
      {/* LEFT: COMMAND CONSOLE FILTER BOARD */}
      <div className="w-full xl:w-96 border-b xl:border-b-0 xl:border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col flex-shrink-0">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800">
          <h2 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600" /> Map Controls
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Filter digital markers or toggle map engines.</p>

          {/* Map Engine Toggle */}
          <div className="grid grid-cols-2 gap-2 mt-4 p-1 rounded-xl bg-slate-100 dark:bg-slate-950/50 border border-slate-200/50 dark:border-slate-800/50">
            <button
              onClick={() => setMapMode('vector')}
              className={`py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                mapMode === 'vector' 
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <Grid className="w-3.5 h-3.5" /> Vector Grid
            </button>
            <button
              onClick={() => {
                if (!gmapsApiKey) {
                  alert("Google Maps API Key is not configured in environment variables (VITE_GOOGLE_MAPS_API_KEY). Running Vector Grid instead.");
                  return;
                }
                setMapMode('google');
              }}
              className={`py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                mapMode === 'google' 
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" /> Live Google Map
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Category Filter</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-850 dark:text-slate-105"
            >
              <option value="all">All Infrastructure</option>
              <option value="pothole">Potholes</option>
              <option value="flooding">Flooding</option>
              <option value="blocked_drain">Blocked Drains</option>
              <option value="broken_streetlight">Broken Streetlights</option>
              <option value="illegal_dumping">Illegal Dumping</option>
              <option value="water_leakage">Water Leakage</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">Severity Filter</label>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="w-full text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-850 dark:text-slate-105"
            >
              <option value="all">All Severities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>

        {/* List of matching reports */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
            Active Reports ({filteredReports.length})
          </span>
          {filteredReports.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelectedReport(r)}
              className={`w-full text-left p-3 rounded-xl border transition-all duration-200 flex items-center justify-between gap-3 ${
                selectedReport?.id === r.id
                  ? 'bg-blue-50/50 dark:bg-blue-950/30 border-blue-500'
                  : 'bg-slate-50/50 dark:bg-slate-950/10 border-slate-150 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/30'
              }`}
            >
              <div className="min-w-0 flex-1">
                <span className="block font-bold text-xs text-slate-850 dark:text-slate-100 capitalize truncate">
                  {r.issueType.replace('_', ' ')}
                </span>
                <span className="block text-[10px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-red-500" /> {r.locationName}
                </span>
              </div>
              <span 
                className="w-2.5 h-2.5 rounded-full flex-shrink-0 pulse" 
                style={{ backgroundColor: getSeverityColor(r.severity) }} 
              />
            </button>
          ))}
        </div>
      </div>

      {/* MIDDLE: INTERACTIVE MAP CANVAS */}
      <div className="flex-1 relative bg-slate-100 dark:bg-slate-950 overflow-hidden">
        {mapMode === 'vector' ? (
          /* HIGH-FI SVG VECTOR DIGITAL TWIN GRID MAP */
          <div className="absolute inset-0 select-none">
            {/* Grid SVG Pattern Background */}
            <svg className="w-full h-full text-slate-200 dark:text-slate-900 bg-slate-100 dark:bg-slate-950">
              <defs>
                <pattern id="city-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.4" />
                </pattern>
                <pattern id="dot-grid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="0.5" fill="currentColor" fillOpacity="0.2" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#city-grid)" />
              <rect width="100%" height="100%" fill="url(#dot-grid)" />

              {/* Geographic Features: Rivers & Water */}
              <path 
                d="M -10,30 Q 15,20 30,50 T 70,25 T 110,60" 
                fill="none" 
                stroke="#1d4ed8" 
                strokeWidth="14" 
                strokeLinecap="round"
                className="opacity-25 dark:opacity-15 animate-pulse" 
              />
              <text x="35%" y="45%" className="font-sans text-[10px] font-bold fill-blue-500/30 tracking-widest uppercase">Subin River</text>

              {/* Central Park Area */}
              <rect x="15%" y="60%" width="25%" height="20%" rx="12" fill="#10b981" fillOpacity="0.1" stroke="#10b981" strokeWidth="1" strokeDasharray="4 4" className="opacity-70" />
              <text x="21%" y="71%" className="font-sans text-[10px] font-bold fill-emerald-500/40 tracking-widest uppercase">Rattray Park / Gardens</text>

              {/* Streets Vector Lines */}
              {/* Mission Street */}
              <line x1="0" y1="35%" x2="100%" y2="35%" stroke="currentColor" strokeWidth="2" strokeOpacity="0.3" />
              <text x="5%" y="33%" className="font-sans text-[8px] font-bold fill-slate-400 tracking-wider">BANTAMA HIGH STREET</text>

              {/* Market Street */}
              <line x1="0" y1="0" x2="100%" y2="100%" stroke="currentColor" strokeWidth="2" strokeOpacity="0.3" />
              <text x="45%" y="47%" className="font-sans text-[8px] font-bold fill-slate-400 tracking-wider transform -rotate-12">KEJETIA STRETCH</text>

              {/* Castro Street */}
              <line x1="30%" y1="0" x2="30%" y2="100%" stroke="currentColor" strokeWidth="2" strokeOpacity="0.3" />
              <text x="31%" y="8%" className="font-sans text-[8px] font-bold fill-slate-400 tracking-wider">ADUM ST</text>

              {/* Valencia Street */}
              <line x1="60%" y1="0" x2="60%" y2="100%" stroke="currentColor" strokeWidth="2" strokeOpacity="0.3" />
              <text x="61%" y="8%" className="font-sans text-[8px] font-bold fill-slate-400 tracking-wider">KNUST ROAD</text>

              {/* Van Ness Avenue */}
              <line x1="85%" y1="0" x2="85%" y2="100%" stroke="currentColor" strokeWidth="2" strokeOpacity="0.3" />
              <text x="86%" y="8%" className="font-sans text-[8px] font-bold fill-slate-400 tracking-wider">OFORIKROM BYPASS</text>
            </svg>

            {/* Glowing active markers mapped overlay */}
            {filteredReports.map((report) => {
              const coords = getSvgCoords(report.latitude, report.longitude);
              const color = getSeverityColor(report.severity);
              const isSelected = selectedReport?.id === report.id;
              const isResolved = report.status === 'resolved';

              return (
                <div
                  key={report.id}
                  className="absolute cursor-pointer -translate-x-1/2 -translate-y-1/2 z-30"
                  style={{ top: `${coords.y}%`, left: `${coords.x}%` }}
                  onClick={() => setSelectedReport(report)}
                >
                  <div className="relative flex items-center justify-center">
                    {/* Pulsing severe rings */}
                    {!isResolved && (report.severity === 'high' || report.severity === 'critical') && (
                      <span 
                        className="absolute h-8 w-8 rounded-full opacity-60 animate-ping pointer-events-none"
                        style={{ backgroundColor: color }}
                      />
                    )}

                    {/* Outer glow aura for selection */}
                    {isSelected && (
                      <span 
                        className="absolute h-10 w-10 rounded-full bg-blue-500/20 dark:bg-blue-400/25 animate-pulse border border-blue-500 pointer-events-none"
                      />
                    )}

                    {/* Actual Pin element */}
                    <div 
                      className={`relative w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-lg transition-transform duration-200 hover:scale-125 border ${
                        isResolved ? 'bg-slate-300 dark:bg-slate-700 border-slate-400' : 'border-white'
                      }`}
                      style={isResolved ? {} : { backgroundColor: color }}
                    >
                      {isResolved ? (
                        <CheckCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <MapPin className="w-2.5 h-2.5 text-white" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* LIVE GOOGLE MAP INTERFACE */
          <div className="absolute inset-0">
            <APIProvider apiKey={gmapsApiKey}>
              <GoogleMap
                defaultCenter={{ lat: 6.6906, lng: -1.6187 }}
                defaultZoom={13}
                gestureHandling="cooperative"
                mapId="921eb0a8b981bc8" // modern style
                style={{ width: '100%', height: '100%' }}
              >
                {filteredReports.map((rep) => (
                  <AdvancedMarker
                    key={rep.id}
                    position={{ lat: rep.latitude, lng: rep.longitude }}
                    onClick={() => setSelectedReport(rep)}
                  >
                    <Pin 
                      background={rep.status === 'resolved' ? '#94a3b8' : getSeverityColor(rep.severity)} 
                      borderColor="#fff" 
                      glyphColor="#fff" 
                    />
                  </AdvancedMarker>
                ))}
              </GoogleMap>
            </APIProvider>
          </div>
        )}

        {/* Ambient watermark/radar vector overlay in corners */}
        <div className="absolute top-4 left-4 p-3 rounded-xl bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-sm z-40 text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 select-none pointer-events-none">
          <Activity className="w-3.5 h-3.5 text-blue-500 animate-pulse" /> GRID SCALE: MERCATOR KUMASI
        </div>
      </div>

      {/* RIGHT: DETAILED COMMAND DECK PANEL */}
      <div className="w-full xl:w-96 border-t xl:border-t-0 xl:border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col flex-shrink-0 overflow-y-auto">
        <AnimatePresence mode="wait">
          {selectedReport ? (
            <motion.div 
              key={selectedReport.id}
              className="p-6 flex flex-col h-full space-y-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {/* Card Title Header */}
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded border uppercase tracking-widest ${getSeverityBadgeClass(selectedReport.severity)}`}>
                    {selectedReport.severity} severity
                  </span>
                  <span className="text-xs font-semibold text-slate-400 font-mono">ID: {selectedReport.id}</span>
                </div>
                <h3 className="font-extrabold text-xl text-slate-900 dark:text-white capitalize">
                  {selectedReport.issueType.replace('_', ' ')}
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-red-500" /> {selectedReport.locationName}
                </span>
              </div>

              {/* Image Preview */}
              {selectedReport.imageUrl && (
                <div className="relative h-44 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xs">
                  <img 
                    src={selectedReport.imageUrl} 
                    alt={selectedReport.issueType}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute bottom-2.5 right-2.5 bg-black/60 backdrop-blur-md text-[10px] text-white px-2.5 py-1 rounded-lg font-bold flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Priority Score: {selectedReport.priorityScore}/100
                  </div>
                </div>
              )}

              {/* Status & Urgent details */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950/20 rounded-xl border border-slate-150 dark:border-slate-850 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-500 dark:text-slate-400">Response Status:</span>
                  <span className={`font-bold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded ${
                    selectedReport.status === 'resolved' 
                      ? 'text-green-700 bg-green-100 dark:bg-green-950/30 dark:text-green-400' 
                      : selectedReport.status === 'in_progress'
                      ? 'text-blue-700 bg-blue-100 dark:bg-blue-950/30 dark:text-blue-400'
                      : 'text-amber-700 bg-amber-100 dark:bg-amber-950/30 dark:text-amber-400'
                  }`}>
                    {selectedReport.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-500 dark:text-slate-400">Owner Division:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 capitalize flex items-center gap-1">
                    <HardHat className="w-3.5 h-3.5 text-blue-500" /> {selectedReport.suggestedDepartment}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-500 dark:text-slate-400">Est. Repair Window:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">{selectedReport.estimatedRepairUrgency}</span>
                </div>
              </div>

              {/* Description info */}
              <div>
                <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Citizen Logs</span>
                <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed bg-slate-50/50 dark:bg-slate-950/10 p-3 rounded-lg border border-slate-100 dark:border-slate-850">
                  {selectedReport.description}
                </p>
              </div>

              {/* AI Recommendations Overrides */}
              <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-500" /> Gemini Twin Diagnosis
                </h4>

                <div className="space-y-3">
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400">Public Safety Overrides:</span>
                    <span className="block text-xs text-slate-600 dark:text-slate-300 mt-0.5">{selectedReport.publicSafetyRisk}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400">Environmental Impact:</span>
                    <span className="block text-xs text-slate-600 dark:text-slate-300 mt-0.5">{selectedReport.environmentalImpact}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400">Operational Guideline:</span>
                    <span className="block text-xs text-slate-600 dark:text-slate-300 mt-0.5 font-medium text-blue-700 dark:text-blue-400">{selectedReport.recommendedAction}</span>
                  </div>
                </div>
              </div>

              {/* Action Resolution Button */}
              {selectedReport.status !== 'resolved' && (
                <div className="pt-4 mt-auto">
                  <button
                    onClick={() => handleResolveInMap(selectedReport.id)}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4.5 h-4.5" /> Dispatch Patch & Mark Resolved
                  </button>
                </div>
              )}
            </motion.div>
          ) : (
            <div className="p-12 text-center h-full flex flex-col justify-center items-center">
              <Inbox className="w-12 h-12 text-slate-400 mb-4" />
              <h3 className="font-bold text-slate-700 dark:text-slate-300">No Incident Highlighted</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Select an active marker on the telemetry grid to view full AI recommended diagnostics.</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
