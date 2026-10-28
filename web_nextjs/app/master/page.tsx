'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Building2,
  Users,
  GraduationCap,
  QrCode,
  CheckCircle,
  Plus,
  Search,
  ExternalLink,
  Loader2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Sparkles,
  School,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { apiRequest, getSavedUser, UserSession } from '@/lib/api';

interface InstituteData {
  id: number;
  name: string;
  code: string;
  address: string;
  created_at: string;
  admin_count: number;
  teacher_count: number;
  student_count: number;
  session_count: number;
  admin_email: string;
  admin_name: string;
  admin_phone: string;
}

interface UserItem {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  class?: string;
  institute_id: number;
  institute_name: string;
  institute_code: string;
}

export default function MasterDashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState({
    total_institutes: 0,
    total_admins: 0,
    total_teachers: 0,
    total_students: 0,
    total_sessions: 0,
    total_attendance: 0,
  });
  const [institutes, setInstitutes] = useState<InstituteData[]>([]);
  const [activeTab, setActiveTab] = useState<'institutes' | 'users'>('institutes');

  // Users Directory state
  const [staff, setStaff] = useState<UserItem[]>([]);
  const [students, setStudents] = useState<UserItem[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADMIN' | 'TEACHER' | 'STUDENT'>('ALL');
  const [instituteFilter, setInstituteFilter] = useState<number | 'ALL'>('ALL');

  // Create Institute Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newInstName, setNewInstName] = useState('');
  const [newInstCode, setNewInstCode] = useState('');
  const [newInstAddress, setNewInstAddress] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('123456');
  const [newAdminPhone, setNewAdminPhone] = useState('+91 9876543210');
  const [createMsg, setCreateMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const saved = getSavedUser();
    if (!saved) {
      router.push('/login');
      return;
    }
    if (saved.role !== 'SUPERADMIN') {
      router.push('/dashboard');
      return;
    }
    setCurrentUser(saved);
    fetchOverview();
    fetchUsersDirectory();
  }, [router]);

  const fetchOverview = async () => {
    setLoading(true);
    const res = await apiRequest('/master/overview');
    if (res.ok && res.data) {
      setKpis((res.data as any).kpis || {});
      setInstitutes((res.data as any).institutes || []);
    }
    setLoading(false);
  };

  const fetchUsersDirectory = async () => {
    const res = await apiRequest('/master/all_users');
    if (res.ok && res.data) {
      setStaff((res.data as any).staff || []);
      setStudents((res.data as any).students || []);
    }
  };

  const handleRegisterInstitute = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setCreateMsg(null);

    const res = await apiRequest('/register_institute', {
      method: 'POST',
      body: JSON.stringify({
        name: newInstName,
        code: newInstCode,
        address: newInstAddress,
        admin_name: newAdminName,
        admin_email: newAdminEmail,
        admin_password: newAdminPassword,
        admin_phone: newAdminPhone,
      }),
    });

    setIsSubmitting(false);

    if (res.ok) {
      setCreateMsg({ type: 'success', text: `Institute "${newInstName}" provisioned successfully!` });
      setTimeout(() => {
        setShowCreateModal(false);
        setCreateMsg(null);
        setNewInstName('');
        setNewInstCode('');
        setNewInstAddress('');
        setNewAdminName('');
        setNewAdminEmail('');
        fetchOverview();
        fetchUsersDirectory();
      }, 1200);
    } else {
      setCreateMsg({ type: 'error', text: res.error || 'Failed to register institute' });
    }
  };

  // Filtered users
  const allUsersCombined: UserItem[] = [...staff, ...students];
  const filteredUsers = allUsersCombined.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.institute_name.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role.toUpperCase() === roleFilter;
    const matchesInst = instituteFilter === 'ALL' || u.institute_id === instituteFilter;
    return matchesSearch && matchesRole && matchesInst;
  });

  if (!currentUser) return null;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F5F7F8] dark:bg-[#0B1619] p-4 sm:p-6 lg:p-8 transition-colors duration-200">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Header Hero */}
        <div className="relative overflow-hidden bg-gradient-to-r from-[#17383E] via-[#1F4A52] to-[#2D8885] dark:from-[#081518] dark:via-[#0F262B] dark:to-[#173C43] rounded-3xl p-8 sm:p-10 text-white shadow-xl border border-teal-500/20">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 text-teal-200 text-xs font-semibold uppercase tracking-wider mb-3 backdrop-blur-md border border-white/10">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Platform Owner & Master Control Center</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Master Dashboard</h1>
              <p className="text-teal-100/80 text-sm mt-1 max-w-xl">
                Global oversight across all registered campuses. Monitor institutes, users, attendance, and provision new institutions in complete data isolation.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-5 py-3 rounded-2xl bg-white dark:bg-teal-500 text-[#17383E] dark:text-slate-950 font-bold text-xs tracking-wider uppercase shadow-lg hover:bg-teal-50 dark:hover:bg-teal-400 transition flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Onboard New Institute</span>
              </button>
            </div>
          </div>
        </div>

        {/* Global KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-[#132429] p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-[#1E373E]">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 flex items-center justify-center text-[#2D8885] dark:text-teal-400">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 px-2 py-0.5 rounded-full">
                Active
              </span>
            </div>
            <div className="text-2xl font-black text-slate-800 dark:text-slate-100">{kpis.total_institutes}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Campuses / Institutes</div>
          </div>

          <div className="bg-white dark:bg-[#132429] p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-[#1E373E]">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <GraduationCap className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-full">
                Global
              </span>
            </div>
            <div className="text-2xl font-black text-slate-800 dark:text-slate-100">{kpis.total_students}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Enrolled Students</div>
          </div>

          <div className="bg-white dark:bg-[#132429] p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-[#1E373E]">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/40 px-2 py-0.5 rounded-full">
                Staff
              </span>
            </div>
            <div className="text-2xl font-black text-slate-800 dark:text-slate-100">
              {kpis.total_teachers + kpis.total_admins}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Admins & Teachers</div>
          </div>

          <div className="bg-white dark:bg-[#132429] p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-[#1E373E]">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <QrCode className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full">
                Live
              </span>
            </div>
            <div className="text-2xl font-black text-slate-800 dark:text-slate-100">{kpis.total_sessions}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Geofence Sessions</div>
          </div>

          <div className="bg-white dark:bg-[#132429] p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-[#1E373E] col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <CheckCircle className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                Total
              </span>
            </div>
            <div className="text-2xl font-black text-slate-800 dark:text-slate-100">{kpis.total_attendance}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Verified Attendances</div>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-[#1E373E] pb-3">
          <button
            onClick={() => setActiveTab('institutes')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs tracking-wider transition ${
              activeTab === 'institutes'
                ? 'bg-[#2D8885] dark:bg-teal-600 text-white shadow'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Registered Institutes ({institutes.length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs tracking-wider transition ${
              activeTab === 'users'
                ? 'bg-[#2D8885] dark:bg-teal-600 text-white shadow'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Global Users Directory ({allUsersCombined.length})
          </button>
        </div>

        {/* TAB 1: Institutes Directory */}
        {activeTab === 'institutes' && (
          <div className="bg-white dark:bg-[#132429] rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 dark:border-[#1E373E]">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Registered Campuses</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Each institution operates in its own isolated multi-tenant partition</p>
              </div>
            </div>

            {loading ? (
              <div className="py-16 flex items-center justify-center text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin text-[#2D8885] mr-2" />
                <span className="text-xs">Loading institutes...</span>
              </div>
            ) : institutes.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">No institutes found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-[#1E373E] text-slate-400 text-xs uppercase tracking-wider font-semibold">
                      <th className="py-3 px-4">Institute</th>
                      <th className="py-3 px-4">Code</th>
                      <th className="py-3 px-4">Primary Admin</th>
                      <th className="py-3 px-4 text-center">Students</th>
                      <th className="py-3 px-4 text-center">Teachers</th>
                      <th className="py-3 px-4 text-center">Sessions</th>
                      <th className="py-3 px-4">Location</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#1E373E]">
                    {institutes.map((inst) => (
                      <tr key={inst.id} className="hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-[#2D8885] dark:text-teal-400 flex items-center justify-center font-bold text-sm">
                              #{inst.id}
                            </div>
                            <div>
                              <div className="font-bold text-slate-800 dark:text-slate-100">{inst.name}</div>
                              <div className="text-[11px] text-slate-400">Joined {inst.created_at ? inst.created_at.split(' ')[0] : 'Recently'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-xs font-semibold">
                            {inst.code}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-medium text-slate-800 dark:text-slate-200">{inst.admin_name}</div>
                          <div className="text-xs text-slate-400 font-mono">{inst.admin_email}</div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                            {inst.student_count}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="px-2.5 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 font-bold text-xs">
                            {inst.teacher_count}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 font-bold text-xs">
                            {inst.session_count}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-xs text-slate-500 dark:text-slate-400 max-w-xs truncate">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{inst.address || 'Campus Campus'}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Cross-Institute Users Directory */}
        {activeTab === 'users' && (
          <div className="bg-white dark:bg-[#132429] rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 dark:border-[#1E373E]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Cross-Institute User Directory</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">All registered admins, teachers, and students with their respective campus tags</p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search name, email, campus..."
                    className="pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-[#1A3138] border border-slate-200 dark:border-[#22424B] text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#2D8885]"
                  />
                </div>

                <select
                  value={roleFilter}
                  onChange={(e: any) => setRoleFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#1A3138] border border-slate-200 dark:border-[#22424B] text-xs text-slate-800 dark:text-slate-200 font-semibold"
                >
                  <option value="ALL">All Roles</option>
                  <option value="ADMIN">Admins</option>
                  <option value="TEACHER">Teachers</option>
                  <option value="STUDENT">Students</option>
                </select>

                <select
                  value={instituteFilter}
                  onChange={(e) => setInstituteFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                  className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#1A3138] border border-slate-200 dark:border-[#22424B] text-xs text-slate-800 dark:text-slate-200 font-semibold"
                >
                  <option value="ALL">All Campuses</option>
                  {institutes.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-[#1E373E] text-slate-400 text-xs uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Assigned Institute</th>
                    <th className="py-3 px-4">Phone</th>
                    <th className="py-3 px-4">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#1E373E]">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                        No users match the search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u, idx) => (
                      <tr key={`${u.role}-${u.id}-${idx}`} className="hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-teal-300 flex items-center justify-center font-bold text-xs">
                              {u.name ? u.name[0].toUpperCase() : 'U'}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-800 dark:text-slate-100">{u.name}</div>
                              <div className="text-xs text-slate-400 font-mono">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                              u.role === 'ADMIN'
                                ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                                : u.role === 'TEACHER'
                                ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400'
                                : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-slate-800 dark:text-slate-200">{u.institute_name}</div>
                          <span className="text-[10px] text-slate-400 font-mono font-semibold">{u.institute_code}</span>
                        </td>
                        <td className="py-3.5 px-4 text-xs font-mono text-slate-600 dark:text-slate-400">{u.phone}</td>
                        <td className="py-3.5 px-4 text-xs text-slate-500">{u.class ? `Class: ${u.class}` : `ID: #${u.id}`}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal: Onboard New Institute */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-[#132429] rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 dark:border-[#1E373E]">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-[#2D8885] dark:text-teal-400 flex items-center justify-center">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Onboard New Institute</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Provisions an isolated multi-tenant campus partition</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 flex items-center justify-center text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              {createMsg && (
                <div
                  className={`mb-4 p-3 rounded-xl text-xs font-semibold ${
                    createMsg.type === 'success'
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                      : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300'
                  }`}
                >
                  {createMsg.text}
                </div>
              )}

              <form onSubmit={handleRegisterInstitute} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Institute / School Name
                    </label>
                    <input
                      type="text"
                      value={newInstName}
                      onChange={(e) => setNewInstName(e.target.value)}
                      placeholder="e.g. St. Xavier's International"
                      required
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#1A3138] border border-slate-200 dark:border-[#22424B] rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#2D8885]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Unique Institute Code
                    </label>
                    <input
                      type="text"
                      value={newInstCode}
                      onChange={(e) => setNewInstCode(e.target.value.toUpperCase())}
                      placeholder="e.g. STX-001"
                      required
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#1A3138] border border-slate-200 dark:border-[#22424B] rounded-xl text-xs font-mono uppercase text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#2D8885]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Campus Address / City
                    </label>
                    <input
                      type="text"
                      value={newInstAddress}
                      onChange={(e) => setNewInstAddress(e.target.value)}
                      placeholder="e.g. Mumbai, Maharashtra"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#1A3138] border border-slate-200 dark:border-[#22424B] rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#2D8885]"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-[#1E373E]">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Primary Campus Admin Account</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">Admin Full Name</label>
                      <input
                        type="text"
                        value={newAdminName}
                        onChange={(e) => setNewAdminName(e.target.value)}
                        placeholder="e.g. Principal Sarah Connor"
                        required
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#1A3138] border border-slate-200 dark:border-[#22424B] rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#2D8885]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">Admin Email</label>
                      <input
                        type="email"
                        value={newAdminEmail}
                        onChange={(e) => setNewAdminEmail(e.target.value)}
                        placeholder="admin@school.com"
                        required
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#1A3138] border border-slate-200 dark:border-[#22424B] rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#2D8885]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">Initial Password</label>
                      <input
                        type="text"
                        value={newAdminPassword}
                        onChange={(e) => setNewAdminPassword(e.target.value)}
                        required
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#1A3138] border border-slate-200 dark:border-[#22424B] rounded-xl text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#2D8885]"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-[#22424B] text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-[#2D8885] dark:bg-teal-600 hover:bg-[#236E6C] dark:hover:bg-teal-500 text-white text-xs font-bold rounded-xl shadow transition flex items-center gap-2"
                  >
                    {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Provision Institute</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
