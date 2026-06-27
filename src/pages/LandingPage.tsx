/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Activity, 
  MapPin, 
  Bot, 
  Calendar, 
  TrendingUp, 
  ArrowRight, 
  ShieldCheck, 
  Cpu, 
  Globe, 
  Upload, 
  Award,
  Zap,
  FileText
} from 'lucide-react';
import { motion } from 'motion/react';

export const LandingPage: React.FC = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { y: 25, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 100, damping: 15 }
    }
  };

  return (
    <div className="flex-1 bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 selection:bg-blue-500 selection:text-white">
      {/* Hero Section */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden">
        {/* Ambient background glows */}
        <div className="absolute top-0 left-1/4 w-[400px] h-[400px] rounded-full bg-blue-500/10 dark:bg-blue-500/5 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-10 right-1/4 w-[500px] h-[500px] rounded-full bg-emerald-500/10 dark:bg-emerald-500/5 blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            className="text-center max-w-3xl mx-auto"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100/80 dark:bg-blue-950/40 border border-blue-200/50 dark:border-blue-800/40 text-blue-700 dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-6">
              <Zap className="w-3.5 h-3.5" /> Google Developer Groups AI Hackathon MVP
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight mb-6">
              An AI-Powered <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 dark:from-blue-400 dark:to-indigo-300 bg-clip-text text-transparent">Digital Twin</span> for Smarter Cities
            </h1>
            
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-350 font-normal leading-relaxed mb-8 max-w-2xl mx-auto">
              Transform standard citizen-generated reports into a living, intelligent representation of your city. Track metrics, simulate changes, and plan optimized municipal maintenance in real-time.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/dashboard"
                id="cta-enter-twin"
                className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-all duration-200 shadow-lg shadow-blue-500/20 hover:scale-[1.02] flex items-center justify-center gap-2"
              >
                Enter Digital Twin Console <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/report"
                id="cta-report-issue"
                className="w-full sm:w-auto px-8 py-4 rounded-xl font-semibold bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 active:bg-slate-100 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Upload className="w-4.5 h-4.5" /> Submit Citizens Report
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Problem & Solution Grid */}
      <section className="py-16 md:py-24 border-t border-slate-200 dark:border-slate-900 bg-slate-100/50 dark:bg-slate-900/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">The Problem</span>
              <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2 mb-4 leading-snug">
                Traditional Issue Reporting is Broken
              </h2>
              <p className="text-slate-600 dark:text-slate-350 leading-relaxed mb-4">
                Citizens file reports about potholes, trash dumping, or broken streetlights, but standard municipal systems only store them as static rows in a spreadsheet.
              </p>
              <p className="text-slate-600 dark:text-slate-350 leading-relaxed">
                Municipalities struggle with backlog overload, failure to categorize based on true public safety risks, and zero visibility into how individual incidents cascade to damage overall city health.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="relative p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl"
            >
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">The Solution</span>
              <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2 mb-4 leading-snug">
                Introducing Urban Twin AI
              </h2>
              <p className="text-slate-600 dark:text-slate-350 leading-relaxed mb-4">
                Urban Twin AI is an <strong>intelligent Smart City operating system</strong>. Using Gemini AI, it parses reports, evaluates multi-faceted severity scores, and continually recalculates a live <strong>City Health Model</strong>.
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-1 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 mt-1">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Continuous <strong>City Health Engine</strong> adjustment</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-1 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 mt-1">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Gemini-powered multimodal infrastructure analysis</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-1 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 mt-1">
                    <Globe className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Unified <strong>Digital Twin Timeline Replay</strong> of the city</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How it Works / Steps */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Operational Flow</span>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">How Urban Twin AI Works</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                step: "01",
                title: "Citizen Reports",
                desc: "Citizens upload pictures and describe the issue using their phone or computer. The browser automatically grabs precise coordinates."
              },
              {
                step: "02",
                title: "Gemini Image Analysis",
                desc: "Our server-side Gemini Vision inspector analyzes the photo instantly, determining severity, priority score, and the target department."
              },
              {
                step: "03",
                title: "Health Calculations",
                desc: "The City Health Engine updates, shifting metrics across roads, drainage, lighting, waste, and water scores based on report severity."
              },
              {
                step: "04",
                title: "Digital Twin Replay",
                desc: "City officials play back the historical timeline, analyzing how health trends fluctuated and resolving items with a single click."
              }
            ].map((s, index) => (
              <div key={index} className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:shadow-lg transition-shadow duration-300">
                <span className="block text-4xl font-extrabold text-blue-100 dark:text-blue-950/40 mb-4">{s.step}</span>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">{s.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Features Bento Grid */}
      <section className="py-16 md:py-24 border-t border-slate-200 dark:border-slate-900 bg-slate-100/30 dark:bg-slate-900/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Feature Deck</span>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">Advanced AI-Powered Capability</h2>
          </div>

          <motion.div 
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
          >
            {/* 1. City Health Index */}
            <motion.div variants={itemVariants} className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:-translate-y-1 transition-transform duration-300">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">Live City Health Index</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Aggregates real-time municipal metrics across road, drainage, sewage, lighting, and water grids, generating dynamic scoring metrics.
              </p>
            </motion.div>

            {/* 2. Interactive Twin Map */}
            <motion.div variants={itemVariants} className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:-translate-y-1 transition-transform duration-300">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">High-Tech Interactive Map</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Filter and inspect reports directly on a custom glowing telemetry grid or toggle on real satellite imaging to inspect street details.
              </p>
            </motion.div>

            {/* 3. Gemini Analyst Chat */}
            <motion.div variants={itemVariants} className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:-translate-y-1 transition-transform duration-300">
              <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">AI City Analyst Chat</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Chat with an AI-powered urban planner who reads the database, synthesizes statistics, and advises on daily maintenance priorities.
              </p>
            </motion.div>

            {/* 4. Digital Twin Timeline */}
            <motion.div variants={itemVariants} className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:-translate-y-1 transition-transform duration-300">
              <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">Digital Twin Timeline Replay</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Replay historical city condition graphs over time. Observe how storm damage degrades drainage or how rapid repairs restore road scores.
              </p>
            </motion.div>

            {/* 5. Strategic AI Insights */}
            <motion.div variants={itemVariants} className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:-translate-y-1 transition-transform duration-300">
              <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">Strategic AI Insights</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Gain direct summaries of recurring city bottlenecks, discover critical risk zones, and access automated, policy recommendations.
              </p>
            </motion.div>

            {/* 6. Printable Municipal Report */}
            <motion.div variants={itemVariants} className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:-translate-y-1 transition-transform duration-300">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">Printable Municipal Report</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Generate highly formatted executive reports with charts, incident matrices, and AI-summarized briefs ready for municipal sign-off.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-20 text-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-blue-600/10 dark:bg-blue-600/5 blur-[100px] pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 relative z-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mb-4">
            Experience the Future of Smart City Management
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-lg mb-8 max-w-2xl mx-auto">
            Interact with simulated incidents or submit your own reports to see the City Health Engine update our intelligent, real-time platform instantly.
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2.5 px-8 py-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 hover:scale-105 transition-all duration-200"
          >
            Launch Twin OS Console <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
};
