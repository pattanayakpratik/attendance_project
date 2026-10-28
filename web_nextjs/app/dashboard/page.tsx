'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User,
  Lightbulb,
  FileSpreadsheet,
  BarChart3,
  Plus,
  QrCode,
  Users,
  CheckCircle2,
  Clock,
  MapPin,
  ArrowUpRight,
  CalendarDays,
} from 'lucide-react';
import { getSavedUser, apiRequest, UserSession } from '@/lib/api';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);
  const [activeSessionsCount, setActiveSessionsCount] = useState(2);
  const [totalStudents, setTotalStudents] = useState(48);

  useEffect(() => {
    const saved = getSavedUser();
    if (!saved) {
      router.push('/login');
      return;
    }
    setUser(saved);

    // Fetch live session stats
    apiRequest('/get_sessions').then((res) => {
      if (res.ok && res.data) {
        const list = (res.data as any).sessions || res.data;
        if (Array.isArray(list)) setActiveSessionsCount(list.length);
      }
    });

    // Fetch student count
    apiRequest('/get_all_student').then((res) => {
      if (res.ok && res.data) {
        const list = (res.data as any).students || res.data;
        if (Array.isArray(list)) setTotalStudents(list.length);
      }
    });
  }, [router]);

  if (!user) return null;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F5F7F8] dark:bg-[#0B1619] p-4 sm:p-6 lg:p-8 transition-colors duration-200">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Top Hero Banner in Deep Teal matching Mockup Theme */}
        <div className="relative overflow-hidden bg-gradient-to-r from-[#2D8885] to-[#1F6664] dark:from-[#112F33] dark:to-[#0D2024] rounded-3xl p-8 sm:p-10 text-white shadow-xl shadow-teal-900/10 border border-transparent dark:border-teal-700/40">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 dark:bg-teal-400/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 dark:bg-white/10 text-teal-100 dark:text-teal-300 text-xs font-semibold uppercase tracking-wider mb-3">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Attendance System Active
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Dashboard</h1>
              <p className="text-teal-100 dark:text-teal-200/80 text-sm mt-1 max-w-lg">
                Welcome back, <span className="font-bold text-white">{user.name}</span>
                {user.institute_name && (
                  <> • <span className="font-semibold text-emerald-300">{user.institute_name}</span></>
                )}! Track attendance in real-time using GPS Geofencing and Dynamic QR Codes.
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <Link
                href="/timetable"
                className="inline-flex items-center gap-2 px-5 py-3.5 bg-white/15 dark:bg-white/10 hover:bg-white/25 text-white font-bold text-sm rounded-2xl border border-white/20 transition transform hover:-translate-y-0.5"
              >
                <CalendarDays className="w-4 h-4 text-teal-200" />
                <span>Schedule & Timetable</span>
              </Link>
              <Link
                href="/sessions"
                className="inline-flex items-center gap-2.5 px-6 py-3.5 bg-white dark:bg-teal-500 text-[#2D8885] dark:text-[#0D2024] font-bold text-sm rounded-2xl shadow-lg hover:bg-teal-50 dark:hover:bg-teal-400 transition transform hover:-translate-y-0.5"
              >
                <QrCode className="w-4 h-4" />
                <span>Open QR Projector</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Action Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Quick Navigation</h2>
            <span className="text-xs text-slate-400 dark:text-slate-400 font-medium">Core Modules</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {/* 1. Timetable Card */}
            <Link
              href="/timetable"
              className="group bg-white dark:bg-[#132429] p-5 rounded-3xl border border-slate-200/80 dark:border-[#1E373E] shadow-sm hover:shadow-xl hover:border-teal-300 dark:hover:border-teal-500/60 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#E7F3F2] dark:bg-[#1A343B] flex items-center justify-center text-[#2D8885] dark:text-teal-300 group-hover:scale-110 transition duration-300">
                  <CalendarDays className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mt-4 group-hover:text-[#2D8885] dark:group-hover:text-teal-300 transition">
                  {user.role === 'STUDENT' ? 'My Timetable' : user.role === 'TEACHER' ? 'Teaching Schedule' : 'Timetable Master'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                  {user.role === 'STUDENT'
                    ? 'Check daily lectures and class schedule.'
                    : user.role === 'TEACHER'
                    ? 'View your teaching schedule and start QR sessions.'
                    : 'Manage timetables across all classes and teachers.'}
                </p>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs font-semibold text-[#2D8885] dark:text-teal-400">
                <span>View Schedule</span>
                <ArrowUpRight className="w-4 h-4 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
              </div>
            </Link>

            {/* 2. Admin / Sessions Card */}
            <Link
              href="/sessions"
              className="group bg-white dark:bg-[#132429] p-5 rounded-3xl border border-slate-200/80 dark:border-[#1E373E] shadow-sm hover:shadow-xl hover:border-teal-300 dark:hover:border-teal-500/60 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#E7F3F2] dark:bg-[#1A343B] flex items-center justify-center text-[#2D8885] dark:text-teal-300 group-hover:scale-110 transition duration-300">
                  <User className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mt-4 group-hover:text-[#2D8885] dark:group-hover:text-teal-300 transition">
                  Admin & Sessions
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                  Manage class sessions, set geofence radius, and project QR codes.
                </p>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs font-semibold text-[#2D8885] dark:text-teal-400">
                <span>View Sessions</span>
                <ArrowUpRight className="w-4 h-4 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
              </div>
            </Link>

            {/* 2. Teacher Card */}
            <Link
              href="/teachers"
              className="group bg-white dark:bg-[#132429] p-6 rounded-3xl border border-slate-200/80 dark:border-[#1E373E] shadow-sm hover:shadow-xl hover:border-teal-300 dark:hover:border-teal-500/60 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="w-14 h-14 rounded-2xl bg-[#E7F3F2] dark:bg-[#1A343B] flex items-center justify-center text-[#2D8885] dark:text-teal-300 group-hover:scale-110 transition duration-300">
                  <Lightbulb className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-5 group-hover:text-[#2D8885] dark:group-hover:text-teal-300 transition">
                  Teacher Portal
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Add teacher accounts, assign classes, and view assigned sessions.
                </p>
              </div>
              <div className="mt-5 flex items-center justify-between text-xs font-semibold text-[#2D8885] dark:text-teal-400">
                <span>Manage Teachers</span>
                <ArrowUpRight className="w-4 h-4 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
              </div>
            </Link>

            {/* 3. Attendance Report Card */}
            <Link
              href="/reports"
              className="group bg-white dark:bg-[#132429] p-6 rounded-3xl border border-slate-200/80 dark:border-[#1E373E] shadow-sm hover:shadow-xl hover:border-teal-300 dark:hover:border-teal-500/60 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="w-14 h-14 rounded-2xl bg-[#E7F3F2] dark:bg-[#1A343B] flex items-center justify-center text-[#2D8885] dark:text-teal-300 group-hover:scale-110 transition duration-300">
                  <FileSpreadsheet className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-5 group-hover:text-[#2D8885] dark:group-hover:text-teal-300 transition">
                  Attendance Report
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Class-wise absent percentages, student attendance logs, and CSV exports.
                </p>
              </div>
              <div className="mt-5 flex items-center justify-between text-xs font-semibold text-[#2D8885] dark:text-teal-400">
                <span>View Analytics</span>
                <ArrowUpRight className="w-4 h-4 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
              </div>
            </Link>

            {/* 4. Student Directory Card */}
            <Link
              href="/students"
              className="group bg-white dark:bg-[#132429] p-6 rounded-3xl border border-slate-200/80 dark:border-[#1E373E] shadow-sm hover:shadow-xl hover:border-teal-300 dark:hover:border-teal-500/60 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="w-14 h-14 rounded-2xl bg-[#E7F3F2] dark:bg-[#1A343B] flex items-center justify-center text-[#2D8885] dark:text-teal-300 group-hover:scale-110 transition duration-300">
                  <BarChart3 className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-5 group-hover:text-[#2D8885] dark:group-hover:text-teal-300 transition">
                  Student Directory
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Search students, view class rosters, and bulk upload students via Excel.
                </p>
              </div>
              <div className="mt-5 flex items-center justify-between text-xs font-semibold text-[#2D8885] dark:text-teal-400">
                <span>View Students</span>
                <ArrowUpRight className="w-4 h-4 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
              </div>
            </Link>
          </div>
        </div>

        {/* Live Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white dark:bg-[#132429] p-6 rounded-3xl border border-slate-200/80 dark:border-[#1E373E] shadow-sm flex items-center gap-4 transition-colors duration-200">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/60 flex items-center justify-center text-[#2D8885] dark:text-teal-300">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-800 dark:text-slate-100">{activeSessionsCount}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Active Classroom Sessions</div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#132429] p-6 rounded-3xl border border-slate-200/80 dark:border-[#1E373E] shadow-sm flex items-center gap-4 transition-colors duration-200">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-800 dark:text-slate-100">92.4%</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Average Present Rate</div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#132429] p-6 rounded-3xl border border-slate-200/80 dark:border-[#1E373E] shadow-sm flex items-center gap-4 transition-colors duration-200">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-800 dark:text-slate-100">{totalStudents}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Enrolled Students</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
