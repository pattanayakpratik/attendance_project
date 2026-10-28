'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, GraduationCap, School, ShieldCheck, ArrowRight, Loader2, Sun, Moon } from 'lucide-react';
import { apiRequest, saveUser } from '@/lib/api';
import { useTheme } from '@/context/ThemeContext';

type Role = 'ADMIN' | 'TEACHER' | 'STUDENT';

export default function LoginPage() {
  const router = useRouter();
  const { theme, isDark, toggleTheme } = useTheme();
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
        token: data.token,
        institute_id: data.institute_id,
        institute_name: data.institute_name,
        institute_code: data.institute_code,
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
    <div className="relative min-h-screen bg-[#F5F7F8] dark:bg-[#0B1619] flex items-center justify-center p-4 overflow-hidden transition-colors duration-200">
      {/* Decorative Pastel Background Bubbles from Design */}
      <div className="absolute -top-16 -right-16 w-80 h-80 bg-[#E7F3F2] dark:bg-teal-900/20 rounded-full blur-2xl opacity-70 pointer-events-none" />
      <div className="absolute top-1/4 -left-20 w-72 h-72 bg-teal-100/40 dark:bg-emerald-950/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 right-10 w-96 h-96 bg-emerald-100/30 dark:bg-cyan-950/20 rounded-full blur-2xl pointer-events-none" />

      {/* Floating Theme Switcher Button */}
      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={toggleTheme}
          type="button"
          className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/80 dark:bg-[#132429]/80 backdrop-blur-md border border-slate-200/80 dark:border-[#1E373E] text-slate-700 dark:text-teal-300 text-xs font-semibold shadow-sm hover:shadow transition"
          title="Toggle Theme"
        >
          {isDark ? (
            <>
              <Sun className="w-4 h-4 text-amber-300 animate-spin-slow" />
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-[#2D8885]" />
              <span>Dark Mode</span>
            </>
          )}
        </button>
      </div>

      <div className="relative w-full max-w-md bg-white/80 dark:bg-[#132429]/90 backdrop-blur-md rounded-3xl p-8 sm:p-10 shadow-xl border border-white/60 dark:border-[#1E373E] transition-colors duration-200">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-[#1E293B] dark:text-[#F1F5F9] tracking-tight">Login</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Select your portal role to sign in</p>
        </div>

        {/* 3 Role Selector Tabs Matching Mockup */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <button
            type="button"
            onClick={() => handleRoleChange('ADMIN')}
            className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border transition-all duration-200 ${
              selectedRole === 'ADMIN'
                ? 'bg-white dark:bg-[#1A343B] border-[#2D8885] dark:border-teal-400 shadow-lg shadow-teal-700/10 text-[#2D8885] dark:text-teal-300'
                : 'bg-slate-50/80 dark:bg-[#0E1E22] border-slate-200 dark:border-[#1A3138] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
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
                ? 'bg-white dark:bg-[#1A343B] border-[#2D8885] dark:border-teal-400 shadow-lg shadow-teal-700/10 text-[#2D8885] dark:text-teal-300'
                : 'bg-slate-50/80 dark:bg-[#0E1E22] border-slate-200 dark:border-[#1A3138] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
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
                ? 'bg-white dark:bg-[#1A343B] border-[#2D8885] dark:border-teal-400 shadow-lg shadow-teal-700/10 text-[#2D8885] dark:text-teal-300'
                : 'bg-slate-50/80 dark:bg-[#0E1E22] border-slate-200 dark:border-[#1A3138] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            <GraduationCap className="w-6 h-6 mb-1.5" />
            <span className="text-xs font-semibold">Student</span>
          </button>
        </div>

        {errorMsg && (
          <div className="mb-6 p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-[#E06D53] dark:text-rose-300 text-xs rounded-2xl font-medium flex items-center gap-2">
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 ml-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. user@school.com"
              required
              className="w-full px-5 py-3.5 bg-slate-50 dark:bg-[#1A3138] border border-slate-200 dark:border-[#22424B] rounded-2xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#2D8885]/40 dark:focus:ring-teal-400/40 focus:border-[#2D8885] dark:focus:border-teal-400 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 ml-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-5 py-3.5 bg-slate-50 dark:bg-[#1A3138] border border-slate-200 dark:border-[#22424B] rounded-2xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#2D8885]/40 dark:focus:ring-teal-400/40 focus:border-[#2D8885] dark:focus:border-teal-400 transition"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-[#2D8885] dark:bg-teal-600 hover:bg-[#236E6C] dark:hover:bg-teal-500 text-white font-bold rounded-full shadow-lg shadow-teal-700/20 text-sm tracking-wider uppercase transition flex items-center justify-center gap-2"
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
            className="text-xs text-slate-500 dark:text-slate-400 hover:text-[#2D8885] dark:hover:text-teal-300 font-semibold transition underline underline-offset-4"
          >
            Continue as a guest
          </button>
        </div>
      </div>
    </div>
  );
}
