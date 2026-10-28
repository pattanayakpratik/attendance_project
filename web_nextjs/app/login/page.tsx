'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  GraduationCap,
  School,
  ShieldCheck,
  ArrowRight,
  Loader2,
  Sun,
  Moon,
  Building2,
  Lock,
  CheckCircle2,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { apiRequest, saveUser } from '@/lib/api';
import { useTheme } from '@/context/ThemeContext';

type Role = 'ADMIN' | 'TEACHER' | 'STUDENT' | 'SUPERADMIN';
type AuthMode = 'LOGIN' | 'REGISTER_INSTITUTE';

export default function LoginPage() {
  const router = useRouter();
  const { theme, isDark, toggleTheme } = useTheme();

  // Mode: Sign In vs Admin Institute Registration
  const [authMode, setAuthMode] = useState<AuthMode>('LOGIN');

  // Sign In States
  const [selectedRole, setSelectedRole] = useState<Role>('ADMIN');
  const [loginEmail, setLoginEmail] = useState('admin@school.com');
  const [loginPassword, setLoginPassword] = useState('123456');

  // Register Institute (Admin Signup) States
  const [instituteName, setInstituteName] = useState('');
  const [instituteCode, setInstituteCode] = useState('');
  const [instituteAddress, setInstituteAddress] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleRoleChange = (role: Role) => {
    setSelectedRole(role);
    setErrorMsg('');
    setSuccessMsg('');
    if (role === 'ADMIN') setLoginEmail('admin@school.com');
    else if (role === 'TEACHER') setLoginEmail('teacher@school.com');
    else if (role === 'STUDENT') setLoginEmail('student@school.com');
    else if (role === 'SUPERADMIN') setLoginEmail('owner@attendancepro.com');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setErrorMsg('Please enter both email and password');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const endpoint = selectedRole === 'STUDENT' ? '/student_login' : '/login_user';
    const res = await apiRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({ email: loginEmail.trim(), password: loginPassword.trim() }),
    });

    setIsLoading(false);

    if (res.ok) {
      const data: any = res.data;
      const userRole = (data.role || selectedRole) as Role;
      saveUser({
        id: data.user_id || data.student_id || 1,
        name: data.name || loginEmail.split('@')[0],
        email: loginEmail,
        role: userRole,
        class: data.class || 'Class 10',
        token: data.token,
        institute_id: data.institute_id,
        institute_name: data.institute_name,
        institute_code: data.institute_code,
      });

      if (userRole === 'SUPERADMIN') {
        router.push('/master');
      } else {
        router.push('/dashboard');
      }
    } else {
      setErrorMsg(res.error || 'Invalid credentials or server not reachable.');
    }
  };

  const handleRegisterInstitute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instituteName.trim() || !instituteCode.trim() || !adminEmail.trim() || !adminPassword.trim()) {
      setErrorMsg('Institute name, unique code, admin email, and password are required.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const res = await apiRequest('/register_institute', {
      method: 'POST',
      body: JSON.stringify({
        name: instituteName.trim(),
        code: instituteCode.trim().toUpperCase(),
        address: instituteAddress.trim() || `Campus of ${instituteName.trim()}`,
        admin_name: adminName.trim() || `${instituteName.trim()} Admin`,
        admin_phone: adminPhone.trim() || '+91 0000000000',
        admin_email: adminEmail.trim().toLowerCase(),
        admin_password: adminPassword.trim(),
      }),
    });

    setIsLoading(false);

    if (res.ok) {
      const data: any = res.data;
      setSuccessMsg(`Success! Institute "${instituteName}" created. Redirecting...`);

      saveUser({
        id: data.user_id || (data.admin && data.admin.id) || 1,
        name: data.name || (data.admin && data.admin.name) || adminName,
        email: adminEmail.toLowerCase(),
        role: 'ADMIN',
        token: data.token,
        institute_id: data.institute_id || (data.institute && data.institute.id),
        institute_name: data.institute_name || (data.institute && data.institute.name) || instituteName,
        institute_code: data.institute_code || (data.institute && data.institute.code) || instituteCode.toUpperCase(),
      });

      setTimeout(() => {
        router.push('/dashboard');
      }, 900);
    } else {
      setErrorMsg(res.error || 'Registration failed. Institute code or email may already be registered.');
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
    <div className="fixed inset-0 h-screen w-screen overflow-hidden bg-[#F5F7F8] dark:bg-[#0B1619] flex items-center justify-center p-3 sm:p-4 select-none transition-colors duration-200">
      {/* Decorative Pastel Background Bubbles */}
      <div className="absolute -top-16 -right-16 w-80 h-80 bg-[#E7F3F2] dark:bg-teal-900/20 rounded-full blur-3xl opacity-70 pointer-events-none" />
      <div className="absolute top-1/4 -left-20 w-72 h-72 bg-teal-100/40 dark:bg-emerald-950/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 right-10 w-96 h-96 bg-emerald-100/30 dark:bg-cyan-950/20 rounded-full blur-3xl pointer-events-none" />

      {/* Floating Theme Switcher Button */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={toggleTheme}
          type="button"
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 dark:bg-[#132429]/80 backdrop-blur-md border border-slate-200/80 dark:border-[#1E373E] text-slate-700 dark:text-teal-300 text-xs font-semibold shadow-sm hover:shadow transition"
          title="Toggle Theme"
        >
          {isDark ? (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-300 animate-spin-slow" />
              <span>Light</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-[#2D8885]" />
              <span>Dark</span>
            </>
          )}
        </button>
      </div>

      {/* Main Form Container - Strictly Compact & Non-Scrollable */}
      <div className="relative w-full max-w-[460px] bg-white/95 dark:bg-[#132429]/95 backdrop-blur-xl rounded-3xl p-5 sm:p-6 shadow-2xl border border-white/60 dark:border-[#1E373E] transition-all duration-200 max-h-[96vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        
        {/* Top Header */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-teal-50 dark:bg-[#1A343B] text-[#2D8885] dark:text-teal-300 mb-2 shadow-inner">
            <Building2 className="w-5 h-5" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#1E293B] dark:text-[#F1F5F9] tracking-tight">
            {authMode === 'LOGIN' ? 'Portal Login' : 'Register Institute'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {authMode === 'LOGIN'
              ? 'Select your role to access your campus dashboard'
              : 'Admin self-onboarding: Register your campus & account'}
          </p>
        </div>

        {/* Mode Segmented Switcher */}
        <div className="flex bg-slate-100 dark:bg-[#0E1E22] p-1 rounded-2xl mb-4 border border-slate-200/70 dark:border-[#1A3138]">
          <button
            type="button"
            onClick={() => {
              setAuthMode('LOGIN');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all duration-200 ${
              authMode === 'LOGIN'
                ? 'bg-white dark:bg-[#1A343B] text-[#2D8885] dark:text-teal-300 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('REGISTER_INSTITUTE');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all duration-200 ${
              authMode === 'REGISTER_INSTITUTE'
                ? 'bg-white dark:bg-[#1A343B] text-[#2D8885] dark:text-teal-300 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            Register Institute (Admin)
          </button>
        </div>

        {/* Feedback Alerts */}
        {errorMsg && (
          <div className="mb-3 p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-[#E06D53] dark:text-rose-300 text-xs rounded-xl font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="leading-tight">{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-3 p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs rounded-xl font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="leading-tight">{successMsg}</span>
          </div>
        )}

        {/* ----------------- TAB 1: LOGIN ----------------- */}
        {authMode === 'LOGIN' && (
          <>
            {/* 3 Role Selector Tabs */}
            <div className="grid grid-cols-3 gap-2 mb-3.5">
              <button
                type="button"
                onClick={() => handleRoleChange('ADMIN')}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all duration-200 ${
                  selectedRole === 'ADMIN'
                    ? 'bg-white dark:bg-[#1A343B] border-[#2D8885] dark:border-teal-400 shadow-md text-[#2D8885] dark:text-teal-300'
                    : 'bg-slate-50/80 dark:bg-[#0E1E22] border-slate-200 dark:border-[#1A3138] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                <ShieldCheck className="w-4 h-4 mb-0.5" />
                <span className="text-[11px] font-bold">Admin</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleChange('TEACHER')}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all duration-200 ${
                  selectedRole === 'TEACHER'
                    ? 'bg-white dark:bg-[#1A343B] border-[#2D8885] dark:border-teal-400 shadow-md text-[#2D8885] dark:text-teal-300'
                    : 'bg-slate-50/80 dark:bg-[#0E1E22] border-slate-200 dark:border-[#1A3138] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                <School className="w-4 h-4 mb-0.5" />
                <span className="text-[11px] font-bold">Teacher</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleChange('STUDENT')}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all duration-200 ${
                  selectedRole === 'STUDENT'
                    ? 'bg-white dark:bg-[#1A343B] border-[#2D8885] dark:border-teal-400 shadow-md text-[#2D8885] dark:text-teal-300'
                    : 'bg-slate-50/80 dark:bg-[#0E1E22] border-slate-200 dark:border-[#1A3138] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                <GraduationCap className="w-4 h-4 mb-0.5" />
                <span className="text-[11px] font-bold">Student</span>
              </button>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1 ml-0.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="e.g. user@school.com"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#1A3138] border border-slate-200 dark:border-[#22424B] rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#2D8885]/40 focus:border-[#2D8885] transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1 ml-0.5">
                  Password
                </label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#1A3138] border border-slate-200 dark:border-[#22424B] rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#2D8885]/40 focus:border-[#2D8885] transition"
                />
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 bg-[#2D8885] dark:bg-teal-600 hover:bg-[#236E6C] dark:hover:bg-teal-500 text-white font-bold rounded-xl shadow-md shadow-teal-700/20 text-xs tracking-wider uppercase transition flex items-center justify-center gap-1.5"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Signing In...</span>
                    </>
                  ) : (
                    <>
                      <span>LOGIN</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Bottom Links */}
            <div className="mt-3.5 text-center flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('REGISTER_INSTITUTE');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className="text-xs text-[#2D8885] dark:text-teal-400 hover:underline font-semibold"
              >
                New Campus Admin? Register your institute →
              </button>

              <button
                type="button"
                onClick={handleGuestLogin}
                className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition"
              >
                Continue as a guest
              </button>
            </div>
          </>
        )}

        {/* ----------------- TAB 2: REGISTER INSTITUTE (ADMIN SIGNUP) ----------------- */}
        {authMode === 'REGISTER_INSTITUTE' && (
          <form onSubmit={handleRegisterInstitute} className="space-y-2.5">
            {/* Multi-Tenant Isolation Callout */}
            <div className="p-2 rounded-xl bg-teal-50/80 dark:bg-teal-950/40 border border-teal-200/60 dark:border-teal-800/50 flex items-start gap-2">
              <Lock className="w-3.5 h-3.5 text-[#2D8885] dark:text-teal-300 shrink-0 mt-0.5" />
              <p className="text-[10px] leading-tight text-teal-900 dark:text-teal-200 font-medium">
                <span className="font-bold">Strict Isolation:</span> Each institute code is unique and reserved for your campus. No other admin can register or access your institute.
              </p>
            </div>

            {/* Compact 2-Column Grid */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5 ml-0.5">
                  Institute Name *
                </label>
                <input
                  type="text"
                  value={instituteName}
                  onChange={(e) => setInstituteName(e.target.value)}
                  placeholder="e.g. Apex High School"
                  required
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-[#1A3138] border border-slate-200 dark:border-[#22424B] rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#2D8885] transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5 ml-0.5">
                  Institute Code *
                </label>
                <input
                  type="text"
                  value={instituteCode}
                  onChange={(e) => setInstituteCode(e.target.value.toUpperCase())}
                  placeholder="e.g. APEX01"
                  required
                  className="w-full px-2.5 py-1.5 uppercase font-mono font-bold bg-slate-50 dark:bg-[#1A3138] border border-slate-200 dark:border-[#22424B] rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#2D8885] transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5 ml-0.5">
                  Admin Full Name *
                </label>
                <input
                  type="text"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="e.g. Dr. Jane Smith"
                  required
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-[#1A3138] border border-slate-200 dark:border-[#22424B] rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#2D8885] transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5 ml-0.5">
                  Admin Phone
                </label>
                <input
                  type="tel"
                  value={adminPhone}
                  onChange={(e) => setAdminPhone(e.target.value)}
                  placeholder="+91 9876543210"
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-[#1A3138] border border-slate-200 dark:border-[#22424B] rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#2D8885] transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5 ml-0.5">
                  Admin Email *
                </label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@school.com"
                  required
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-[#1A3138] border border-slate-200 dark:border-[#22424B] rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#2D8885] transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5 ml-0.5">
                  Admin Password *
                </label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-[#1A3138] border border-slate-200 dark:border-[#22424B] rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#2D8885] transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5 ml-0.5">
                Campus Address / City (Optional)
              </label>
              <input
                type="text"
                value={instituteAddress}
                onChange={(e) => setInstituteAddress(e.target.value)}
                placeholder="e.g. 100 Main St, New Delhi"
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-[#1A3138] border border-slate-200 dark:border-[#22424B] rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#2D8885] transition"
              />
            </div>

            <div className="pt-1.5">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-[#2D8885] dark:bg-teal-600 hover:bg-[#236E6C] dark:hover:bg-teal-500 text-white font-bold rounded-xl shadow-md shadow-teal-700/20 text-xs tracking-wider uppercase transition flex items-center justify-center gap-1.5"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Registering Institute...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>REGISTER INSTITUTE & ADMIN</span>
                  </>
                )}
              </button>
            </div>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('LOGIN');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className="text-xs text-slate-500 dark:text-slate-400 hover:text-[#2D8885] dark:hover:text-teal-300 font-semibold transition"
              >
                Already have an account? Sign In →
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}