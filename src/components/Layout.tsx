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
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-300 font-sans">
      {/* Top Header Navbar */}
      <header className="sticky top-0 z-50 bg-white dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 backdrop-blur-md shadow-xs transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo and Brand */}
            <Link to="/" className="flex items-center space-x-2.5 group">
              <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 text-white font-bold text-sm shadow-sm group-hover:scale-105 transition-transform duration-200">
                K
              </div>
              <div>
                <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white uppercase flex items-center gap-1.5">
                  Kumasi Twin <span className="text-blue-600 dark:text-blue-400 font-extrabold text-[10px] bg-blue-50 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-blue-100 dark:border-slate-700">AI</span>
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden xl:flex space-x-1 h-full items-center">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                      active
                        ? 'bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50'
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
              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                id="theme-toggle"
                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200"
                aria-label="Toggle theme"
              >
                {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile/Tablet Bottom Navigation (for high accessibility and mobile viewports) */}
      <nav className="xl:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 border-t border-slate-200 dark:border-slate-800 px-4 py-2 flex justify-around items-center backdrop-blur-md shadow-lg transition-colors duration-300">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center p-1.5 rounded-lg transition-all duration-200 ${
                active
                  ? 'text-blue-600 dark:text-blue-400 scale-105'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[9px] mt-1 font-bold uppercase tracking-wider">{item.label === 'Municipal Report' ? 'Report' : item.label === 'City Timeline' ? 'Timeline' : item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Page Content area with padding for the mobile bottom nav bar */}
      <main className="flex-1 flex flex-col pb-20 xl:pb-0">
        {children}
      </main>

      {/* Simple, minimalist Footer */}
      <footer className="py-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center px-6 justify-between text-xs text-slate-500 dark:text-slate-400 shrink-0 z-40">
        <div className="font-medium">
          © {new Date().getFullYear()} Kumasi Twin AI. All rights reserved.
        </div>
        <div className="flex gap-4 font-medium">
          <span>Ashanti Region, Ghana</span>
        </div>
      </footer>
    </div>
  );
};
