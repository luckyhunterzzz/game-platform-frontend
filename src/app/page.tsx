'use client';
import React, { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { useApi } from '@/lib/use-api';
import { useAuth } from '@/lib/auth-context';
import { LoadingScreen } from '@/components/LoadingScreen';
import PublicationsSection from '@/components/publications/PublicationsSection';

export default function HomePage() {
  const [log, setLog] = useState<unknown>(null);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const { apiFetch } = useApi();
  const { roles, authenticated, loading } = useAuth(); 

  const handleTest = async (path: string) => {
    try {
      const data = await apiFetch(path);
      setLog(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
  setLog({ error: errorMessage });
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar onMenuClick={() => setSidebarOpen(!isSidebarOpen)} />

      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 flex">
          <div className="w-64 bg-slate-900 border-r border-slate-800 p-6 shadow-2xl">
            <h2 className="text-xl font-bold mb-6 text-blue-400">Menu</h2>
            <ul className="space-y-4">
              <li className="text-slate-400 hover:text-white cursor-pointer">Page 1 (Template)</li>
              <li className="text-slate-400 hover:text-white cursor-pointer">Page 2 (Template)</li>
            </ul>
          </div>
          <div className="flex-1 bg-black/50" onClick={() => setSidebarOpen(false)}></div>
        </div>
      )}

      <main className="flex-1 container mx-auto px-4 py-12 flex flex-col items-center">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-7xl font-black mb-4 bg-gradient-to-r from-blue-400 via-purple-500 to-amber-400 bg-clip-text text-transparent">
            EMPIRES & PUZZLES
          </h1>
          <p className="text-xl text-slate-400 font-light tracking-widest uppercase">
            Fan Community Hub
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {['Heroes', 'Events', 'Guides', 'Alliances'].map((item) => (
            <button 
              key={item}
              className="group flex flex-col items-center p-4 w-28 bg-slate-900/40 border border-slate-800 rounded-2xl hover:border-blue-500/50 hover:bg-slate-800/60 transition-all shadow-lg"
            >
              <div className="w-12 h-12 mb-2 bg-slate-800 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <div className="w-6 h-6 bg-blue-500/20 border border-blue-500/40 rounded-full"></div>
              </div>
              <span className="text-xs font-semibold text-slate-400 group-hover:text-blue-400">{item}</span>
            </button>
          ))}
        </div>

        <PublicationsSection />

        <div className="w-full max-w-2xl bg-slate-900/50 border border-slate-800 rounded-2xl p-8 backdrop-blur-sm">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
            System Diagnostic Panel
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <button 
              onClick={() => handleTest('/api/v1/public/test')}
              className="p-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all"
            >
              🚀 Test Public API
            </button>
            <button 
              onClick={() => handleTest('/api/v1/admin/test')}
              disabled={!authenticated}
              className={`p-4 border rounded-xl transition-all ${
                authenticated 
                ? 'bg-amber-900/20 border-amber-700/50 hover:bg-amber-900/40 text-amber-200' 
                : 'bg-slate-800/50 border-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              🛡️ Test Admin API
            </button>
          </div>

          {log !== null && log !== undefined && (
            <div className="mt-6 bg-black rounded-lg p-4 border border-slate-800 overflow-auto max-h-64">
              <pre className="text-xs font-mono text-green-400">
                {JSON.stringify(log, null, 2)}
              </pre>
            </div>
          )}

          <div className="mt-8 flex flex-wrap gap-2">
            {roles.map(role => (
              <span key={role} className="px-2 py-1 bg-blue-900/30 text-blue-300 text-[10px] uppercase tracking-wider rounded border border-blue-800">
                {role}
              </span>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}