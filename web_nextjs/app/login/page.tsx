'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, GraduationCap, School, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import { apiRequest, saveUser } from '@/lib/api';

type Role = 'ADMIN' | 'TEACHER' | 'STUDENT';

export default function LoginPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<Role>('ADMIN');
  const [email, setEmail] = useState('admin@school.com');
  const [password, setPassword] = useState('123456');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleRoleChange = (role: Role) => {
    setSelectedRole(role);
    if (role === 'ADMIN') setEmail('admin@school.com');
    else if (role === 'TEACHER') setEmail('teacher@school.com');
    else setEmail('student@school.com');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email and password');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    const endpoint = selectedRole === 'STUDENT' ? '/student_login' : '/login_user';
    const res = await apiRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({ email: email.trim(), password: password.trim() }),
    });

    setIsLoading(false);

    if (res.ok) {
      const data: any = res.data;
      saveUser({
        id: data.user_id || data.student_id || 1,
        name: data.name || email.split('@')[0],
        email: email,
        role: selectedRole,
        class: data.class || 'Class 10',
      });
      router.push('/dashboard');
    } else {
      setErrorMsg(res.error || 'Invalid credentials or server not connected');
    }
  };

  const handleGuestLogin = () => {
    saveUser({
      id: 1,
      name: `Guest ${selectedRole.charAt(0) + selectedRole.slice(1).toLowerCase()}`,
      email: `${selectedRole.toLowerCase()}@school.com`,
      role: selectedRole,
      class: 'Class 10',
    });
    router.push('/dashboard');
  };

  return (
    <div className="relative min-h-screen bg-[#F5F7F8] flex items-center justify-center p-4 overflow-hidden">
      {/* Decorative Pastel Background Bubbles from Design */}
      <div className="absolute -top-16 -right-16 w-80 h-80 bg-[#E7F3F2] rounded-full blur-2xl opacity-70 pointer-events-none" />
      <div className="absolute top-1/4 -left-20 w-72 h-72 bg-teal-100/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 right-10 w-96 h-96 bg-emerald-100/30 rounded-full blur-2xl pointer-events-none" />

      <div className="relative w-full max-w-md bg-white/80 backdrop-blur-md rounded-3xl p-8 sm:p-10 shadow-xl border border-white/60">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-[#1E293B] tracking-tight">Login</h1>
          <p className="text-sm text-slate-500 mt-1">Select your portal role to sign in</p>
        </div>

        {/* 3 Role Selector Tabs Matching Mockup */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <button
            type="button"
            onClick={() => handleRoleChange('ADMIN')}
            className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border transition-all duration-200 ${
              selectedRole === 'ADMIN'
                ? 'bg-white border-[#2D8885] shadow-lg shadow-teal-700/10 text-[#2D8885]'
                : 'bg-slate-50/80 border-slate-200 text-slate-400 hover:text-slate-600'
            }`}
          >
            <ShieldCheck className="w-6 h-6 mb-1.5" />
            <span className="text-xs font-semibold">Admin</span>
          </button>

          <button
            type="button"
            onClick={() => handleRoleChange('TEACHER')}
            className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border transition-all duration-200 ${
              selectedRole === 'TEACHER'
                ? 'bg-white border-[#2D8885] shadow-lg shadow-teal-700/10 text-[#2D8885]'
                : 'bg-slate-50/80 border-slate-200 text-slate-400 hover:text-slate-600'
            }`}
          >
            <School className="w-6 h-6 mb-1.5" />
            <span className="text-xs font-semibold">Teacher</span>
          </button>

          <button
            type="button"
            onClick={() => handleRoleChange('STUDENT')}
            className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border transition-all duration-200 ${
              selectedRole === 'STUDENT'
                ? 'bg-white border-[#2D8885] shadow-lg shadow-teal-700/10 text-[#2D8885]'
                : 'bg-slate-50/80 border-slate-200 text-slate-400 hover:text-slate-600'
            }`}
          >
            <GraduationCap className="w-6 h-6 mb-1.5" />
            <span className="text-xs font-semibold">Student</span>
          </button>
        </div>

        {errorMsg && (
          <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 text-[#E06D53] text-xs rounded-2xl font-medium flex items-center gap-2">
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 ml-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. user@school.com"
              required
              className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2D8885]/40 focus:border-[#2D8885] transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 ml-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2D8885]/40 focus:border-[#2D8885] transition"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-[#2D8885] hover:bg-[#236E6C] text-white font-bold rounded-full shadow-lg shadow-teal-700/20 text-sm tracking-wider uppercase transition flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>LOGIN</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={handleGuestLogin}
            className="text-xs text-slate-500 hover:text-[#2D8885] font-semibold transition underline underline-offset-4"
          >
            Continue as a guest
          </button>
        </div>
      </div>
    </div>
  );
}
