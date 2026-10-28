'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, ArrowRight, Loader2, Sparkles, Lock } from 'lucide-react';
import { apiRequest, saveUser } from '@/lib/api';

export default function MasterSecretLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('owner@attendancepro.com');
  const [password, setPassword] = useState('123456');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleMasterLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    const res = await apiRequest('/login_user', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim(), password: password.trim() }),
    });

    setIsLoading(false);

    if (res.ok) {
      const data: any = res.data;
      if (data.role !== 'SUPERADMIN') {
        setErrorMsg('Access Denied: This terminal is strictly reserved for Platform Master Owner.');
        return;
      }

      saveUser({
        id: data.user_id,
        name: data.name || 'Platform Master Owner',
        email: email,
        role: 'SUPERADMIN',
        token: data.token,
      });

      router.push('/master');
    } else {
      setErrorMsg(res.error || 'Invalid credentials or master terminal locked');
    }
  };

  return (
    <div className="min-h-screen bg-[#081518] text-white flex items-center justify-center p-4">
      {/* Background radial glow */}
      <div className="absolute w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md bg-[#0F262B] border border-teal-500/30 rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
            <Lock className="w-7 h-7" />
          </div>
        </div>

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] font-mono uppercase tracking-wider mb-2">
            <Sparkles className="w-3 h-3" />
            <span>Restricted Platform Terminal</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-100">Master Authentication</h1>
          <p className="text-xs text-slate-400 mt-1">Platform-level oversight and multi-tenant control</p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-3.5 bg-rose-950/60 border border-rose-900 text-rose-300 text-xs rounded-2xl font-medium flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleMasterLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 ml-1">Master Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="owner@attendancepro.com"
              required
              className="w-full px-4 py-3.5 bg-[#17383E] border border-teal-600/30 rounded-2xl text-xs font-mono text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 ml-1">Master Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-3.5 bg-[#17383E] border border-teal-600/30 rounded-2xl text-xs font-mono text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-full shadow-lg shadow-amber-900/20 text-xs tracking-wider uppercase transition flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Verifying Terminal...</span>
                </>
              ) : (
                <>
                  <span>Access Master Control</span>
                  <ArrowRight className="w-4 h-4 text-slate-950" />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-8 text-center border-t border-teal-900/40 pt-4">
          <button
            onClick={() => router.push('/login')}
            className="text-[11px] text-slate-500 hover:text-slate-300 transition"
          >
            ← Back to Public Portal
          </button>
        </div>
      </div>
    </div>
  );
}
