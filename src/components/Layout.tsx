/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { isFirebaseConfigured } from '../firebase/config';
import { 
  Activity, 
  MapPin, 
  FileText, 
  Bot, 
  Calendar, 
  TrendingUp, 
  PlusCircle, 
  Sun, 
  Moon,
  Cloud,
  CloudOff,
  Home
} from 'lucide-react';
import { motion } from 'motion/react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/dashboard', label: 'Dashboard', icon: Activity },
    { path: '/map', label: 'Twin Map', icon: MapPin },
    { path: '/timeline', label: 'City Timeline', icon: Calendar },
    { path: '/report', label: 'Report Issue', icon: PlusCircle },
    { path: '/analyst', label: 'AI Analyst', icon: Bot },
    { path: '/insights', label: 'AI Insights', icon: TrendingUp },
    { path: '/municipal-report', label: 'Municipal Report', icon: FileText },
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-300 font-sans">
      {/* Top Header Navbar */}
      <header className="sticky top-0 z-50 bg-slate-900 text-white border-b border-slate-800 shadow-sm transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14 items-center">
            {/* Logo and Brand */}
            <Link to="/" className="flex items-center space-x-2.5 group">
              <div className="relative flex items-center justify-center w-7 h-7 rounded bg-blue-500 text-white font-bold text-sm shadow-sm group-hover:scale-105 transition-transform duration-200">
                U
              </div>
              <div>
                <span className="font-bold text-sm tracking-tight text-white uppercase flex items-center gap-1">
                  Urban Twin <span className="text-blue-400 font-extrabold text-[10px] bg-slate-800 px-1 py-0.5 rounded border border-slate-700">AI</span>
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden xl:flex space-x-1 h-full">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`relative flex items-center gap-1.5 px-3 py-1 text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                      active
                        ? 'text-blue-400 border-b-2 border-blue-400 h-full'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label === 'Municipal Report' ? 'Report' : item.label === 'City Timeline' ? 'Timeline' : item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Utility and Actions */}
            <div className="flex items-center space-x-3 text-xs">
              {/* City Engine Status badge */}
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 rounded-full border border-slate-700 text-slate-300 font-medium">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-[10px] uppercase tracking-wider font-semibold">City Engine Live</span>
              </div>

              {/* Cloud DB Connectivity indicator */}
              <div 
                className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-400"
                title={isFirebaseConfigured ? 'Connected to Firebase Firestore Cloud' : 'Running in Local Sandbox mode'}
              >
                {isFirebaseConfigured ? (
                  <>
                    <Cloud className="w-3 h-3 text-green-400" />
                    <span className="hidden md:inline text-green-400 text-[9px] font-bold uppercase tracking-wider">Sync</span>
                  </>
                ) : (
                  <>
                    <CloudOff className="w-3 h-3 text-amber-400" />
                    <span className="hidden md:inline text-amber-400 text-[9px] font-bold uppercase tracking-wider">Local</span>
                  </>
                )}
              </div>

              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                id="theme-toggle"
                className="p-1.5 rounded bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white transition-all duration-200"
                aria-label="Toggle theme"
              >
                {theme === 'light' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile/Tablet Bottom Navigation (for high accessibility and mobile viewports) */}
      <nav className="xl:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900 border-t border-slate-800 px-4 py-2 flex justify-around items-center backdrop-blur-md shadow-2xl transition-colors duration-300">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center p-1.5 rounded transition-all duration-200 ${
                active
                  ? 'text-blue-400 scale-105'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[9px] mt-0.5 font-bold uppercase tracking-wider">{item.label === 'Municipal Report' ? 'Report' : item.label === 'City Timeline' ? 'Timeline' : item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Page Content area with padding for the mobile bottom nav bar */}
      <main className="flex-1 flex flex-col pb-20 xl:pb-0">
        {children}
      </main>

      {/* High-density Footer with live systems telemetry */}
      <footer className="h-6 bg-slate-200 dark:bg-slate-900 border-t border-slate-300 dark:border-slate-800 flex items-center px-6 justify-between text-[10px] text-slate-500 dark:text-slate-450 shrink-0 z-40">
        <div className="font-medium">
          © {new Date().getFullYear()} Urban Twin AI — City Operational Status: <span className="text-green-600 dark:text-green-400 font-bold uppercase">Nominal</span>
        </div>
        <div className="hidden sm:flex gap-4 font-mono">
          <span>System Latency: 42ms</span>
          <span>Active Reports: Live Sync</span>
          <span>Next AI Pulse: Hourly</span>
        </div>
      </footer>
    </div>
  );
};
