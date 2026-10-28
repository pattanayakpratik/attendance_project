'use client';

import React, { useEffect, useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  GraduationCap,
  Loader2,
  CheckCircle2,
  AlertCircle,
  UserMinus,
  UserCheck,
  ShieldCheck,
  Filter
} from 'lucide-react';
import { apiRequest, getSavedUser } from '@/lib/api';

interface Student {
  id: number;
  name: string;
  class: string;
  email: string;
  phone: string;
  avatar?: string;
  status?: 'ACTIVE' | 'LEFT' | 'GRADUATED' | string;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusTab, setSelectedStatusTab] = useState<'ALL' | 'ACTIVE' | 'LEFT'>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [statusActionLoading, setStatusActionLoading] = useState<number | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // Form states matching Mockup Screen 7 / Add Student Form
  const [newName, setNewName] = useState('');
  const [newClass, setNewClass] = useState('Class 10');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newPassword, setNewPassword] = useState('123456');
  const [newId, setNewId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock Students fallback
  const mockStudents: Student[] = [
    {
      id: 101,
      name: 'Emma Johnson',
      class: 'Class 10',
      email: 'emma@school.com',
      phone: '+91 9381075071',
      status: 'ACTIVE',
    },
    {
      id: 102,
      name: 'Robert Brown',
      class: 'Class 10',
      email: 'robert@school.com',
      phone: '+91 9088552381',
      status: 'ACTIVE',
    },
    {
      id: 103,
      name: 'David Wilson',
      class: 'Class 10',
      email: 'david@school.com',
      phone: '+91 7338872501',
      status: 'LEFT',
    },
    {
      id: 104,
      name: 'Sarah Taylor',
      class: 'Class 11',
      email: 'sarah@school.com',
      phone: '+91 8899007016',
      status: 'ACTIVE',
    },
  ];

  const fetchStudents = async () => {
    setIsLoading(true);
    const res = await apiRequest('/get_all_student?status=ALL');
    if (res.ok && res.data) {
      const list = (res.data as any).students || res.data;
      if (Array.isArray(list) && list.length > 0) {
        setStudents(list);
        setFilteredStudents(list);
      } else {
        setStudents(mockStudents);
        setFilteredStudents(mockStudents);
      }
    } else {
      setStudents(mockStudents);
      setFilteredStudents(mockStudents);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    const q = searchQuery.toLowerCase();
    let result = students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.class.toLowerCase().includes(q) ||
        s.id.toString().includes(q) ||
        (s.phone && s.phone.includes(q))
    );

    if (selectedStatusTab === 'ACTIVE') {
      result = result.filter((s) => (s.status || 'ACTIVE').toUpperCase() === 'ACTIVE');
    } else if (selectedStatusTab === 'LEFT') {
      result = result.filter((s) => (s.status || '').toUpperCase() === 'LEFT');
    }

    setFilteredStudents(result);
  }, [searchQuery, selectedStatusTab, students]);

  const handleToggleStudentStatus = async (st: Student) => {
    const isCurrentlyLeft = (st.status || 'ACTIVE').toUpperCase() === 'LEFT';
    const targetStatus = isCurrentlyLeft ? 'ACTIVE' : 'LEFT';
    const confirmPrompt = isCurrentlyLeft
      ? `Reactivate student "${st.name}"? They will be able to attend active classes again.`
      : `Mark student "${st.name}" as LEFT? Their historical attendance records will remain preserved permanently for institutional records.`;

    if (!window.confirm(confirmPrompt)) return;

    setStatusActionLoading(st.id);
    const res = await apiRequest('/update_student_status', {
      method: 'POST',
      body: JSON.stringify({
        student_id: st.id,
        status: targetStatus,
      }),
    });

    setStatusActionLoading(null);

    if (res.ok) {
      setStudents((prev) =>
        prev.map((item) => (item.id === st.id ? { ...item, status: targetStatus } : item))
      );
      setFeedbackToast(
        `Student "${st.name}" ${targetStatus === 'LEFT' ? 'marked as LEFT' : 'reactivated'}. Institutional records preserved.`
      );
      setTimeout(() => setFeedbackToast(null), 4000);
    } else {
      // Local fallback
      setStudents((prev) =>
        prev.map((item) => (item.id === st.id ? { ...item, status: targetStatus } : item))
      );
      setFeedbackToast(`Status updated to ${targetStatus} (offline mode).`);
      setTimeout(() => setFeedbackToast(null), 4000);
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = getSavedUser();
    setIsSubmitting(true);

    const res = await apiRequest('/add_student', {
      method: 'POST',
      body: JSON.stringify({
        id: parseInt(newId, 10),
        name: newName,
        class: newClass,
        email: newEmail,
        phone: newPhone,
        password: newPassword,
        requesting_user_id: user?.id || 1,
      }),
    });

    setIsSubmitting(false);

    if (res.ok) {
      fetchStudents();
      setShowAddModal(false);
      setNewName('');
      setNewEmail('');
      setNewPhone('');
      setNewId('');
      setFeedbackToast(`New student "${newName}" enrolled successfully!`);
      setTimeout(() => setFeedbackToast(null), 4000);
    } else {
      // Local fallback
      const newSt: Student = {
        id: parseInt(newId, 10) || Date.now(),
        name: newName,
        class: newClass,
        email: newEmail,
        phone: newPhone,
        status: 'ACTIVE',
      };
      setStudents([newSt, ...students]);
      setShowAddModal(false);
    }
  };

  const activeCount = students.filter((s) => (s.status || 'ACTIVE').toUpperCase() === 'ACTIVE').length;
  const leftCount = students.filter((s) => (s.status || '').toUpperCase() === 'LEFT').length;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F5F7F8] dark:bg-[#0B1619] p-4 sm:p-6 lg:p-8 transition-colors duration-200">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Toast Feedback */}
        {feedbackToast && (
          <div className="p-3 bg-teal-50 dark:bg-teal-950/80 border border-teal-200 dark:border-teal-800 text-[#2D8885] dark:text-teal-300 text-xs font-semibold rounded-2xl flex items-center gap-2 shadow-sm animate-fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{feedbackToast}</span>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Student Directory</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Manage student enrollment lifecycle: active students and permanently preserved records of past students.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-5 py-3 bg-[#2D8885] dark:bg-teal-600 hover:bg-[#236E6C] dark:hover:bg-teal-500 text-white font-bold text-sm rounded-2xl shadow-lg shadow-teal-700/10 transition"
            >
              <Plus className="w-5 h-5" />
              <span>Enroll Student</span>
            </button>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex bg-white dark:bg-[#132429] p-1 rounded-2xl border border-slate-200/80 dark:border-[#1E373E] shadow-sm">
            <button
              onClick={() => setSelectedStatusTab('ALL')}
              className={`px-4 py-1.5 text-xs font-bold rounded-xl transition ${
                selectedStatusTab === 'ALL'
                  ? 'bg-[#2D8885] text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              All Records ({students.length})
            </button>
            <button
              onClick={() => setSelectedStatusTab('ACTIVE')}
              className={`px-4 py-1.5 text-xs font-bold rounded-xl transition ${
                selectedStatusTab === 'ACTIVE'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Active Enrolled ({activeCount})
            </button>
            <button
              onClick={() => setSelectedStatusTab('LEFT')}
              className={`px-4 py-1.5 text-xs font-bold rounded-xl transition ${
                selectedStatusTab === 'LEFT'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Left / Inactive ({leftCount})
            </button>
          </div>

          <div className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-4 h-4 text-[#2D8885]" />
            <span>Past attendance history is never deleted</span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search students by name, class, roll number, or phone..."
            className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-[#132429] border border-slate-200/80 dark:border-[#1E373E] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-2xl text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2D8885]/30 focus:border-[#2D8885] dark:focus:border-teal-400 transition"
          />
        </div>

        {/* Student Cards List */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="py-20 text-center">
              <Loader2 className="w-8 h-8 text-[#2D8885] dark:text-teal-400 animate-spin mx-auto" />
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 font-medium">Loading student roster...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="bg-white dark:bg-[#132429] rounded-3xl p-12 text-center border border-slate-200 dark:border-[#1E373E]">
              <GraduationCap className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400 font-medium">No students match your criteria</p>
            </div>
          ) : (
            filteredStudents.map((st) => {
              const isLeft = (st.status || '').toUpperCase() === 'LEFT';
              const isUpdating = statusActionLoading === st.id;

              return (
                <div
                  key={st.id}
                  className={`bg-white dark:bg-[#132429] p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isLeft
                      ? 'border-amber-200/80 dark:border-amber-900/40 opacity-80 bg-amber-50/20'
                      : 'border-slate-200/80 dark:border-[#1E373E] hover:shadow-md hover:border-teal-300 dark:hover:border-teal-500/50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {st.avatar ? (
                      <img
                        src={st.avatar}
                        alt={st.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-teal-100 dark:border-teal-800"
                      />
                    ) : (
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-base ${
                          isLeft
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                            : 'bg-[#E7F3F2] dark:bg-[#1A343B] text-[#2D8885] dark:text-teal-300'
                        }`}
                      >
                        {st.name ? st.name[0].toUpperCase() : 'S'}
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 leading-tight">
                          {st.name}
                        </h3>
                        {isLeft ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-[10px] font-bold">
                            Left Institute
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                            Active
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <span className="font-semibold text-[#2D8885] dark:text-teal-400">{st.class}</span>
                        <span>•</span>
                        <span>Roll ID: {st.id}</span>
                        {st.phone && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-slate-400 dark:text-slate-500">
                              <Phone className="w-3 h-3" />
                              {st.phone}
                            </span>
                          </>
                        )}
                        <span>•</span>
                        <span className="text-slate-400 dark:text-slate-500">{st.email}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Lifecycle Toggle */}
                  <div className="flex items-center gap-3 justify-end border-t sm:border-t-0 pt-2 sm:pt-0">
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleToggleStudentStatus(st)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                        isLeft
                          ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
                          : 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100'
                      }`}
                      title={
                        isLeft
                          ? 'Reactivate student for new attendance'
                          : 'Mark as Left: Preserves all past attendance for institutional records'
                      }
                    >
                      {isUpdating ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : isLeft ? (
                        <>
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Reactivate</span>
                        </>
                      ) : (
                        <>
                          <UserMinus className="w-3.5 h-3.5" />
                          <span>Mark as Left</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#132429] rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-white dark:border-[#1E373E] transition-colors duration-200">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-1">Enroll New Student</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Create a student profile to allow attendance logging. Defaults to Active status.
            </p>

            <form onSubmit={handleAddStudent} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Roll Number / ID
                  </label>
                  <input
                    type="number"
                    value={newId}
                    onChange={(e) => setNewId(e.target.value)}
                    placeholder="e.g. 105"
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#1A3138] border border-slate-200 dark:border-[#22424B] rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-[#2D8885] dark:focus:border-teal-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Class</label>
                  <input
                    type="text"
                    value={newClass}
                    onChange={(e) => setNewClass(e.target.value)}
                    placeholder="e.g. Class 10"
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#1A3138] border border-slate-200 dark:border-[#22424B] rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-[#2D8885] dark:focus:border-teal-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#1A3138] border border-slate-200 dark:border-[#22424B] rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-[#2D8885] dark:focus:border-teal-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Email</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="alex@school.com"
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#1A3138] border border-slate-200 dark:border-[#22424B] rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-[#2D8885] dark:focus:border-teal-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="+91 9876543210"
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#1A3138] border border-slate-200 dark:border-[#22424B] rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-[#2D8885] dark:focus:border-teal-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#1A3138] border border-slate-200 dark:border-[#22424B] rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#2D8885] dark:focus:border-teal-400"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
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
                  <span>Enroll Student</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}