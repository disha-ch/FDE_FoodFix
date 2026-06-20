/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { LoginPage } from './components/LoginPage';
import { FoodFixMain } from './components/FoodFixMain';
import { supabase, isSupabaseConfigured, setSupabaseConfig, clearSupabaseConfig } from './lib/supabase';
import { Database, Key, Check, Server, RefreshCw, LogOut } from 'lucide-react';

export default function App() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  
  // Setup inputs state
  const [inputUrl, setInputUrl] = useState('');
  const [inputKey, setInputKey] = useState('');
  const [setupError, setSetupError] = useState('');
  const [setupSuccess, setSetupSuccess] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  // Load configuration from API or storage
  const checkConfigAndSession = async () => {
    setIsInitializing(true);
    setSetupError('');
    try {
      // 1. Check if configured in storage or environment
      if (isSupabaseConfigured()) {
        setConfigured(true);
        // Load session
        const { data: { session } } = await supabase.auth.getSession();
        setIsAuthenticated(!!session);
        setUserEmail(session?.user?.email || null);
        setIsLoaded(true);
        setIsInitializing(false);
        return;
      }

      // 2. Fallback: Fetch from Node Express server environment
      const response = await fetch('/api/config');
      if (response.ok) {
        const data = await response.json();
        if (data.supabaseUrl && data.supabaseAnonKey) {
          const client = setSupabaseConfig(data.supabaseUrl, data.supabaseAnonKey);
          if (client) {
            setConfigured(true);
            const { data: { session } } = await supabase.auth.getSession();
            setIsAuthenticated(!!session);
            setUserEmail(session?.user?.email || null);
            setIsLoaded(true);
            setIsInitializing(false);
            return;
          }
        }
      }
    } catch (e) {
      console.error('Error fetching config / checking session:', e);
    }
    
    // Default to unconfigured state
    setConfigured(false);
    setIsLoaded(true);
    setIsInitializing(false);
  };

  useEffect(() => {
    checkConfigAndSession();
  }, []);

  // Set up auth state change listener after we detect configuration is established
  useEffect(() => {
    if (!configured) return;

    // Listen to Auth State Changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      setUserEmail(session?.user?.email || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [configured]);

  // Handle manual configuration submission in the clean UI
  const handleSaveSetup = (e: React.FormEvent) => {
    e.preventDefault();
    setSetupError('');
    setSetupSuccess(false);

    if (!inputUrl.trim() || !inputKey.trim()) {
      setSetupError('Please fill out both the Space Project URL and Secret/Anon Key.');
      return;
    }

    if (!inputUrl.startsWith('https://')) {
      setSetupError('Supabase Project URL must start with "https://" as standard.');
      return;
    }

    try {
      const client = setSupabaseConfig(inputUrl.trim(), inputKey.trim());
      if (client) {
        setSetupSuccess(true);
        setConfigured(true);
        // Refresh session
        client.auth.getSession().then(({ data: { session } }) => {
          setIsAuthenticated(!!session);
          setUserEmail(session?.user?.email || null);
        });
      } else {
        setSetupError('Failed to initialize client with the provided details. Please check values.');
      }
    } catch (err: any) {
      setSetupError(err.message || 'Initialization error. Check your entries.');
    }
  };

  const handleResetConfig = () => {
    clearSupabaseConfig();
    setConfigured(false);
    setIsAuthenticated(false);
    setUserEmail(null);
    setInputUrl('');
    setInputKey('');
    setSetupSuccess(false);
  };

  if (!isLoaded || isInitializing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-slate-900">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 text-orange-500 animate-spin" />
          <p className="text-sm font-medium text-slate-500">Checking credentials & initializing connection...</p>
        </div>
      </div>
    );
  }

  // Render Setup Portal if missing credentials
  if (!configured) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 p-6">
        <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/40 p-8 md:p-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-orange-100/50 p-3 rounded-2xl">
              <Database className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Configure Supabase Database</h1>
              <p className="text-xs text-slate-500">Let's connect your database to power user registration & logins.</p>
            </div>
          </div>

          <form onSubmit={handleSaveSetup} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Supabase Project URL
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="https://your-project-id.supabase.co"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm transition"
                />
                <Server className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Anon/Public API Key
              </label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm transition font-mono"
                />
                <Key className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
              </div>
            </div>

            {setupError && (
              <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-semibold leading-relaxed">
                {setupError}
              </div>
            )}

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl py-3 font-bold transition shadow-lg shadow-orange-500/15"
            >
              <Check className="w-4 h-4" />
              <span>Connect Database</span>
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Where to find these specs?</h3>
            <ol className="list-decimal list-inside space-y-2 text-xs text-slate-500 leading-relaxed">
              <li>Open your <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Supabase Dashboard</a> and choose your project.</li>
              <li>Go to <b>Project Settings &gt; API</b> on the sidebar.</li>
              <li>Copy your <b>Project URL</b> and the <b>anon / public</b> key.</li>
              <li>Configure them via the <b>Secrets manager</b> in your AI Studio editor (variables names: <code className="bg-slate-100 px-1 py-0.5 rounded">SUPABASE_URL</code> and <code className="bg-slate-100 px-1 py-0.5 rounded">SUPABASE_ANON_KEY</code>) to keep them persistent, or insert them directly above for instant testing!</li>
            </ol>
            <div className="mt-4 flex gap-2">
              <button
                onClick={checkConfigAndSession}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                Retry Server Config Detection
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render Login Portal if not authenticated
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Render main app with user email and logout helper
  return (
    <div className="relative">
      <FoodFixMain userEmail={userEmail} onSignOut={handleResetConfig} />
      
      {/* Dev Reset Configuration Indicator (always helpful in staging) */}
      <div className="fixed bottom-4 left-4 z-50">
        <button
          onClick={handleResetConfig}
          title="Disconnect Supabase Project Config"
          className="p-2.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-full transition shadow-lg shadow-black/25 flex items-center gap-2 group text-xs font-semibold max-w-10 hover:max-w-xs overflow-hidden"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span className="opacity-0 group-hover:opacity-100 transition whitespace-nowrap">Reset Config</span>
        </button>
      </div>
    </div>
  );
}

