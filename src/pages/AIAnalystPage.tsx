/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { dbService } from '../services/db.service';
import { Report, ChatMessage } from '../types';
import { 
  Bot, 
  Send, 
  HelpCircle, 
  Loader2, 
  Trash2, 
  Sparkles, 
  FileText, 
  AlertTriangle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const AIAnalystPage: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [thinking, setThinking] = useState(false);
  const [loading, setLoading] = useState(true);

  const endOfMessagesRef = useRef<HTMLDivElement | null>(null);

  // Suggested prompt list
  const suggestedQueries = [
    "What should the city fix first?",
    "Summarize today's active incidents.",
    "Which neighborhood has the highest infrastructure risk?",
    "Which category is getting worse?",
    "Propose a municipal maintenance schedule for tomorrow."
  ];

  // Load database on mount
  useEffect(() => {
    async function loadData() {
      try {
        const data = await dbService.getReports();
        setReports(data);

        // Seed initial greeting message
        setMessages([
          {
            id: 'msg-greet',
            sender: 'ai',
            text: "Hello! I am **Urban Twin AI**, your Smart City operations assistant and urban planning analyst.\n\nI have fully synchronized with your **City Health Model** and analyzed your citizen reports. Ask me anything about current incident backlogs, public safety overrides, department workload, or priority schedules.",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } catch (err) {
        console.error('Error loading reports for AI chat:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  // Handle Send Message
  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || thinking) return;

    const userMsg: ChatMessage = {
      id: 'msg-' + Math.random().toString(36).substr(2, 9),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setThinking(true);

    try {
      const chatHistory = [...messages, userMsg];
      
      const res = await fetch('/api/chat-analyst', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: chatHistory,
          reports: reports
        })
      });

      if (!res.ok) throw new Error("AI failed to answer.");

      const aiResponse = await res.json();

      const aiMsg: ChatMessage = {
        id: 'msg-' + Math.random().toString(36).substr(2, 9),
        sender: 'ai',
        text: aiResponse.text || "I was unable to retrieve a valid analysis for your query.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (e) {
      console.error("AI Analyst Chat crashed:", e);
      const errorMsg: ChatMessage = {
        id: 'msg-error',
        sender: 'ai',
        text: "I apologize, but I encountered a network bottleneck while querying the Digital Twin neural models. Please check if your **VITE_GEMINI_API_KEY** is configured correctly in your system environment.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setThinking(false);
    }
  };

  // Custom zero-dependency markdown interpreter
  const parseBoldText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-extrabold text-slate-900 dark:text-white">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const renderMarkdown = (text: string) => {
    return text.split('\n').map((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        const listText = trimmed.substring(2);
        return (
          <li key={idx} className="list-disc ml-5 text-sm text-slate-700 dark:text-slate-355 leading-relaxed my-1">
            {parseBoldText(listText)}
          </li>
        );
      }
      if (trimmed.startsWith('### ')) {
        return <h4 key={idx} className="font-bold text-sm text-slate-900 dark:text-white mt-4 mb-2">{trimmed.replace('### ', '')}</h4>;
      }
      if (trimmed.startsWith('## ')) {
        return <h3 key={idx} className="font-extrabold text-base text-slate-900 dark:text-white mt-5 mb-2.5">{trimmed.replace('## ', '')}</h3>;
      }
      if (trimmed.startsWith('# ')) {
        return <h2 key={idx} className="font-black text-lg text-slate-900 dark:text-white mt-6 mb-3">{trimmed.replace('# ', '')}</h2>;
      }
      if (trimmed === '') {
        return <div key={idx} className="h-2" />;
      }
      return (
        <p key={idx} className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-2">
          {parseBoldText(line)}
        </p>
      );
    });
  };

  const clearChat = () => {
    if (confirm("Reset operations analyst chat history?")) {
      setMessages([
        {
          id: 'msg-greet',
          sender: 'ai',
          text: "Hello! Chat logs cleared. I am synchronized with your **City Health Model**. Ask me anything about incident resolutions or operational backlogs.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh] bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-blue-600/30 border-t-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Opening AI Operations Channel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col xl:flex-row h-[calc(100vh-4rem)] overflow-hidden gap-4">
      
      {/* LEFT PANEL: SUGGESTED INQUIRIES SIDEBAR */}
      <div className="w-full xl:w-80 flex flex-col gap-4 flex-shrink-0">
        <div className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <h3 className="text-micro flex items-center gap-1.5 mb-2">
            <HelpCircle className="w-4 h-4 text-blue-500" /> Analyst Toolbox
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
            Click any recommended smart city prompt to automatically interrogate the AI model about your custom infrastructure databases.
          </p>

          <div className="space-y-1.5">
            {suggestedQueries.map((query, index) => (
              <button
                key={index}
                onClick={() => handleSendMessage(query)}
                disabled={thinking}
                className="w-full text-left p-2.5 rounded border border-slate-150 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/20 hover:border-blue-500 dark:hover:border-blue-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all leading-normal hover:scale-[1.01]"
              >
                {query}
              </button>
            ))}
          </div>
        </div>

        {/* Diagnostic Metadata card */}
        <div className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hidden xl:block">
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Connected Dataset</span>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Total Incident Records:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{reports.length}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Active Backlogs:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{reports.filter(r => r.status !== 'resolved').length}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Primary Model:</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">Gemini 2.5 Flash</span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: INTERACTIVE CHAT ENVIRONMENT */}
      <div className="flex-1 flex flex-col p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs h-[calc(100vh-8rem)] xl:h-auto overflow-hidden">
        {/* Chat header */}
        <div className="flex justify-between items-center pb-3 border-b border-slate-150 dark:border-slate-800 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-blue-600 text-white flex items-center justify-center shadow">
              <Bot className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                AI Twin Coordinator <Sparkles className="w-3 h-3 text-yellow-500 fill-yellow-500" />
              </h3>
              <span className="block text-[9px] text-green-600 dark:text-green-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <span className="w-1 h-1 bg-green-500 rounded-full animate-ping" /> Synchronized with cityHealth
              </span>
            </div>
          </div>

          <button
            onClick={clearChat}
            className="p-2 text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-slate-50 dark:hover:bg-slate-950 rounded-lg transition-colors"
            title="Clear Chat Logs"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Message logs scrolling container */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4 min-h-0">
          {messages.map((m) => {
            const isAI = m.sender === 'ai';
            return (
              <div 
                key={m.id}
                className={`flex gap-3 max-w-[85%] ${isAI ? 'self-start' : 'self-end ml-auto flex-row-reverse'}`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white font-bold text-xs ${
                  isAI ? 'bg-blue-600 shadow-md shadow-blue-500/10' : 'bg-slate-600 dark:bg-slate-800'
                }`}>
                  {isAI ? <Bot className="w-4 h-4" /> : 'ME'}
                </div>

                {/* Bubble */}
                <div className="space-y-1">
                  <div className={`p-4 rounded-2xl text-xs leading-relaxed border ${
                    isAI 
                      ? 'bg-slate-50 dark:bg-slate-950/40 border-slate-100 dark:border-slate-850 text-slate-800 dark:text-slate-200 rounded-tl-none' 
                      : 'bg-blue-600 text-white border-blue-600 rounded-tr-none shadow-sm shadow-blue-500/10'
                  }`}>
                    {isAI ? (
                      <div className="space-y-1.5">
                        {renderMarkdown(m.text)}
                      </div>
                    ) : (
                      <p className="text-sm font-medium whitespace-pre-wrap">{m.text}</p>
                    )}
                  </div>
                  <span className="block text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-right">
                    {m.timestamp}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Typing simulation indicator */}
          <AnimatePresence>
            {thinking && (
              <motion.div 
                className="flex gap-3 max-w-[70%]"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0 text-white">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850 rounded-tl-none flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin" />
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold italic animate-pulse">Running full infrastructure analysis...</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={endOfMessagesRef} />
        </div>

        {/* Message inputs bottom bar */}
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSendMessage(inputText); }}
          className="flex gap-3 border-t border-slate-150 dark:border-slate-800 pt-4 mt-4"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Interrogate digital twin (e.g., 'summarize water damage warnings')..."
            className="flex-1 text-sm p-3 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 rounded-xl focus:outline-blue-500 focus:bg-white"
            disabled={thinking}
          />
          <button
            type="submit"
            disabled={thinking || !inputText.trim()}
            className="px-5 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-slate-300 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/10 transition-colors"
          >
            {thinking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};
