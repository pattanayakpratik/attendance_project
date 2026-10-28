'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  Clock,
  MapPin,
  User as UserIcon,
  BookOpen,
  Plus,
  Trash2,
  Filter,
  CheckCircle2,
  AlertCircle,
  QrCode,
  GraduationCap,
  Search,
  Building2,
  Sparkles,
  Loader2,
  Calendar,
  X,
  RefreshCw,
  Info
} from 'lucide-react';
import { apiRequest, getSavedUser, UserSession } from '@/lib/api';

interface TimetableSlot {
  id: number;
  institute_id: number;
  class_name: string;
  subject: string;
  teacher_id: number;
  teacher_name?: string;
  teacher_email?: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  room_number?: string;
  created_at?: string;
}

interface TimetableMeta {
  classes: string[];
  teachers: { id: number; name: string; email: string }[];
  days: string[];
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function TimetablePage() {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [meta, setMeta] = useState<TimetableMeta>({
    classes: [],
    teachers: [],
    days: DAYS_OF_WEEK,
  });
  const [detectedRole, setDetectedRole] = useState<string>('ADMIN');
  const [studentClass, setStudentClass] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Filters
  const [selectedDay, setSelectedDay] = useState<string>('All Days');
  const [filterClass, setFilterClass] = useState<string>('ALL');
  const [filterTeacher, setFilterTeacher] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Add Slot Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newClass, setNewClass] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newTeacherId, setNewTeacherId] = useState<number | string>('');
  const [newDay, setNewDay] = useState('Monday');
  const [newStartTime, setNewStartTime] = useState('09:00 AM');
  const [newEndTime, setNewEndTime] = useState('10:00 AM');
  const [newRoom, setNewRoom] = useState('');

  // Delete Slot state
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchTimetable = async () => {
    setIsLoading(true);
    try {
      const user = getSavedUser();
      setCurrentUser(user);

      const params = new URLSearchParams();
      if (user) {
        params.append('role', user.role);
        params.append('id', String(user.id));
      }

      // If Admin and specific filters are chosen
      if (user?.role !== 'STUDENT' && user?.role !== 'TEACHER') {
        if (filterClass !== 'ALL') params.append('class_name', filterClass);
        if (filterTeacher !== 'ALL') params.append('teacher_id', filterTeacher);
      }

      if (selectedDay !== 'All Days') {
        params.append('day', selectedDay);
      }

      const res = await apiRequest(`/get_timetable?${params.toString()}`);
      if (res.ok && res.data) {
        const data = res.data as any;
        setSlots(data.timetable || []);
        if (data.role) setDetectedRole(data.role);
        if (data.student_class) setStudentClass(data.student_class);
        if (data.meta) {
          setMeta({
            classes: data.meta.classes || [],
            teachers: data.meta.teachers || [],
            days: data.meta.days || DAYS_OF_WEEK,
          });
        }
      } else {
        showToast(res.error || 'Failed to load timetable', 'error');
      }
    } catch (e: any) {
      showToast('Error connecting to timetable service', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTimetable();
  }, [selectedDay, filterClass, filterTeacher]);

  // Set default teacher in modal when user is TEACHER
  useEffect(() => {
    if (currentUser?.role === 'TEACHER') {
      setNewTeacherId(currentUser.id);
    } else if (meta.teachers.length > 0 && !newTeacherId) {
      setNewTeacherId(meta.teachers[0].id);
    }
    if (meta.classes.length > 0 && !newClass) {
      setNewClass(meta.classes[0]);
    }
  }, [currentUser, meta]);

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClass.trim() || !newSubject.trim() || !newStartTime.trim() || !newEndTime.trim()) {
      showToast('Please fill all required timetable fields', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        class_name: newClass.trim(),
        subject: newSubject.trim(),
        teacher_id: Number(newTeacherId) || currentUser?.id,
        day_of_week: newDay,
        start_time: newStartTime.trim(),
        end_time: newEndTime.trim(),
        room_number: newRoom.trim(),
      };

      const res = await apiRequest('/add_timetable_slot', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showToast((res.data as any).message || 'Schedule slot added successfully!');
        setShowAddModal(false);
        setNewSubject('');
        setNewRoom('');
        fetchTimetable();
      } else {
        showToast(res.error || 'Failed to create timetable slot', 'error');
      }
    } catch (err: any) {
      showToast('Error saving slot: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSlot = async (slotId: number) => {
    if (!confirm('Are you sure you want to remove this timetable slot?')) return;
    setDeletingId(slotId);
    try {
      const res = await apiRequest(`/delete_timetable_slot?id=${slotId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        showToast((res.data as any).message || 'Slot removed successfully');
        setSlots((prev) => prev.filter((s) => s.id !== slotId));
      } else {
        showToast(res.error || 'Failed to delete slot', 'error');
      }
    } catch (err: any) {
      showToast('Error deleting slot: ' + err.message, 'error');
    } finally {
      setDeletingId(null);
    }
  };

  // Client-side text filter
  const filteredSlots = useMemo(() => {
    if (!searchQuery.trim()) return slots;
    const q = searchQuery.toLowerCase();
    return slots.filter(
      (s) =>
        s.subject.toLowerCase().includes(q) ||
        s.class_name.toLowerCase().includes(q) ||
        (s.teacher_name && s.teacher_name.toLowerCase().includes(q)) ||
        (s.room_number && s.room_number.toLowerCase().includes(q))
    );
  }, [slots, searchQuery]);

  // Group slots by Day of the Week
  const slotsByDay = useMemo(() => {
    const map: Record<string, TimetableSlot[]> = {};
    DAYS_OF_WEEK.forEach((d) => (map[d] = []));
    filteredSlots.forEach((slot) => {
      const d =
        DAYS_OF_WEEK.find((w) => w.toLowerCase() === slot.day_of_week.toLowerCase()) ||
        slot.day_of_week;
      if (!map[d]) map[d] = [];
      map[d].push(slot);
    });
    return map;
  }, [filteredSlots]);

  const isStudent = detectedRole === 'STUDENT' || currentUser?.role === 'STUDENT';
  const isTeacher = detectedRole === 'TEACHER' || currentUser?.role === 'TEACHER';
  const isAdmin = !isStudent && !isTeacher;

  return (
    <div className="min-h-screen bg-[#F4F9F8] dark:bg-[#060D0E] text-slate-800 dark:text-slate-100 p-4 sm:p-6 lg:p-8 transition-colors">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Toast Alert */}
        {toastMessage && (
          <div
            className={`fixed top-20 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-white text-sm font-semibold transition-all transform animate-bounce-short ${
              toastMessage.type === 'success' ? 'bg-teal-600' : 'bg-rose-600'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        )}

        {/* Page Header */}
        <div className="bg-white dark:bg-[#0D2024] rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200/80 dark:border-teal-900/40 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/5 dark:bg-teal-400/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/10 dark:bg-teal-400/10 flex items-center justify-center text-[#2D8885] dark:text-teal-300">
                  <CalendarDays className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                    Timetable & Class Schedule
                  </h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    {isStudent ? (
                      <span className="flex items-center gap-1.5 font-medium text-teal-700 dark:text-teal-300">
                        <GraduationCap className="w-4 h-4" />
                        My Class Schedule •{' '}
                        <span className="font-bold underline">{studentClass || currentUser?.class || 'Enrolled Class'}</span>
                      </span>
                    ) : isTeacher ? (
                      <span className="flex items-center gap-1.5 font-medium text-emerald-700 dark:text-emerald-300">
                        <UserIcon className="w-4 h-4" />
                        My Teaching Schedule • Instructor:{' '}
                        <span className="font-bold">{currentUser?.name || 'Assigned Faculty'}</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300">
                        <Building2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                        Master Institute Schedule • All Courses, Batches & Faculty Members
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
              <button
                onClick={fetchTimetable}
                disabled={isLoading}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-teal-800/60 bg-white dark:bg-[#12282D] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#163339] text-sm font-semibold transition"
                title="Refresh schedule"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>

              {!isStudent && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2D8885] hover:bg-[#257370] text-white text-sm font-bold shadow-md shadow-teal-700/20 active:scale-95 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Schedule Slot</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Stats / Info Pill */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-teal-900/40 flex items-center justify-between flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>
                {isStudent
                  ? 'Showing lectures scheduled exclusively for your cohort. Attendance check-ins sync with these timings.'
                  : isTeacher
                  ? 'Showing your assigned teaching periods. Click "Start Attendance" on any card to launch a QR session.'
                  : 'Full institute view: Use the class and instructor filters to drill down into specific cohorts.'}
              </span>
            </div>
            <div className="font-semibold px-2.5 py-1 rounded-full bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300">
              {filteredSlots.length} lecture{filteredSlots.length !== 1 ? 's' : ''} listed
            </div>
          </div>
        </div>

        {/* Filter Bar & Weekday Selector */}
        <div className="bg-white dark:bg-[#0D2024] rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200/80 dark:border-teal-900/40 space-y-4">
          {/* Weekday Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {['All Days', ...DAYS_OF_WEEK].map((day) => {
              const isActive = selectedDay === day;
              const count =
                day === 'All Days'
                  ? filteredSlots.length
                  : slotsByDay[day]?.length || 0;

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-[#2D8885] text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-[#12282D] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#173339]'
                  }`}
                >
                  <span>{day}</span>
                  <span
                    className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-200 dark:bg-teal-950/60 text-slate-700 dark:text-teal-300'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Admin Filters + Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by subject, room, cohort..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl text-sm bg-slate-50 dark:bg-[#12282D] border border-slate-200 dark:border-teal-900/60 focus:outline-none focus:ring-2 focus:ring-[#2D8885] dark:text-slate-100"
              />
            </div>

            {/* Admin Selectors */}
            {isAdmin && (
              <div className="flex items-center gap-2 flex-wrap">
                {/* Class Filter */}
                <select
                  value={filterClass}
                  onChange={(e) => setFilterClass(e.target.value)}
                  className="px-3 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-[#12282D] border border-slate-200 dark:border-teal-900/60 focus:outline-none focus:ring-2 focus:ring-[#2D8885] dark:text-slate-200"
                >
                  <option value="ALL">All Cohorts / Classes</option>
                  {meta.classes.map((cls) => (
                    <option key={cls} value={cls}>
                      {cls}
                    </option>
                  ))}
                </select>

                {/* Teacher Filter */}
                <select
                  value={filterTeacher}
                  onChange={(e) => setFilterTeacher(e.target.value)}
                  className="px-3 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-[#12282D] border border-slate-200 dark:border-teal-900/60 focus:outline-none focus:ring-2 focus:ring-[#2D8885] dark:text-slate-200"
                >
                  <option value="ALL">All Instructors</option>
                  {meta.teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Timetable Schedule Display */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-[#0D2024] rounded-2xl border border-slate-200/80 dark:border-teal-900/40">
            <Loader2 className="w-10 h-10 text-[#2D8885] animate-spin mb-3" />
            <p className="text-slate-500 text-sm font-medium">Loading schedule slots...</p>
          </div>
        ) : filteredSlots.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-[#0D2024] rounded-2xl border border-slate-200/80 dark:border-teal-900/40 text-center px-4">
            <div className="w-16 h-16 rounded-2xl bg-teal-50 dark:bg-teal-950/40 flex items-center justify-center text-teal-600 dark:text-teal-400 mb-4">
              <Calendar className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              No Scheduled Lectures Found
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mt-1 mb-5">
              {isStudent
                ? `There are no scheduled lectures found for your class (${studentClass || 'enrolled class'}) on ${selectedDay}.`
                : isTeacher
                ? `You have no lectures assigned on ${selectedDay}. Enjoy your teaching-free period!`
                : `No slots found matching the active filters for ${selectedDay}. Click "Add Schedule Slot" to create a new lecture.`}
            </p>
            {!isStudent && (
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2.5 rounded-xl bg-[#2D8885] text-white font-bold text-sm shadow hover:bg-[#257370] transition"
              >
                + Add First Schedule Slot
              </button>
            )}
          </div>
        ) : selectedDay === 'All Days' ? (
          /* Grouped by Day of the Week */
          <div className="space-y-6">
            {DAYS_OF_WEEK.map((day) => {
              const daySlots = slotsByDay[day] || [];
              if (daySlots.length === 0) return null;

              return (
                <div key={day} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-base sm:text-lg text-[#2D8885] dark:text-teal-300">
                      {day}
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/50 text-teal-800 dark:text-teal-200">
                      {daySlots.length} slot{daySlots.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {daySlots.map((slot) => (
                      <SlotCard
                        key={slot.id}
                        slot={slot}
                        isStudent={isStudent}
                        isTeacher={isTeacher}
                        isAdmin={isAdmin}
                        onDelete={handleDeleteSlot}
                        isDeleting={deletingId === slot.id}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Single Day Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSlots.map((slot) => (
              <SlotCard
                key={slot.id}
                slot={slot}
                isStudent={isStudent}
                isTeacher={isTeacher}
                isAdmin={isAdmin}
                onDelete={handleDeleteSlot}
                isDeleting={deletingId === slot.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add Slot Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#0D2024] rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-teal-900/50 relative overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-teal-900/40">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/60 flex items-center justify-center text-[#2D8885] dark:text-teal-300 font-bold">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">
                    Add Timetable Slot
                  </h3>
                  <p className="text-xs text-slate-400">
                    Schedule a regular lecture or lab period
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSlot} className="space-y-4 mt-4">
              {/* Class / Cohort */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Class / Cohort / Batch *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    list="classes-list"
                    value={newClass}
                    onChange={(e) => setNewClass(e.target.value)}
                    placeholder="e.g. 2026-2030 CSE Batch - Sem 2, Class 10-A"
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-[#12282D] border border-slate-200 dark:border-teal-900/60 focus:outline-none focus:ring-2 focus:ring-[#2D8885] dark:text-slate-100"
                  />
                  <datalist id="classes-list">
                    {meta.classes.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Subject / Course Module *
                </label>
                <input
                  type="text"
                  required
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="e.g. Data Structures & Algorithms, Physics"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-[#12282D] border border-slate-200 dark:border-teal-900/60 focus:outline-none focus:ring-2 focus:ring-[#2D8885] dark:text-slate-100"
                />
              </div>

              {/* Teacher Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Assigned Teacher / Instructor *
                </label>
                {isTeacher ? (
                  <div className="px-3.5 py-2.5 rounded-xl text-sm bg-slate-100 dark:bg-[#12282D] border border-slate-200 dark:border-teal-900/60 text-slate-700 dark:text-slate-300 font-semibold">
                    {currentUser?.name || 'Current Teacher'} (You)
                  </div>
                ) : (
                  <select
                    required
                    value={newTeacherId}
                    onChange={(e) => setNewTeacherId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-[#12282D] border border-slate-200 dark:border-teal-900/60 focus:outline-none focus:ring-2 focus:ring-[#2D8885] dark:text-slate-100"
                  >
                    <option value="">Select Instructor...</option>
                    {meta.teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.email})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Day of Week */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    Day of Week *
                  </label>
                  <select
                    value={newDay}
                    onChange={(e) => setNewDay(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-[#12282D] border border-slate-200 dark:border-teal-900/60 focus:outline-none focus:ring-2 focus:ring-[#2D8885] dark:text-slate-100"
                  >
                    {DAYS_OF_WEEK.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Room / Location */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    Room / Lab Hall
                  </label>
                  <input
                    type="text"
                    value={newRoom}
                    onChange={(e) => setNewRoom(e.target.value)}
                    placeholder="e.g. Room 204, Lab 3"
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-[#12282D] border border-slate-200 dark:border-teal-900/60 focus:outline-none focus:ring-2 focus:ring-[#2D8885] dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Timings */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    Start Time *
                  </label>
                  <input
                    type="text"
                    required
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    placeholder="09:00 AM"
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-[#12282D] border border-slate-200 dark:border-teal-900/60 focus:outline-none focus:ring-2 focus:ring-[#2D8885] dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    End Time *
                  </label>
                  <input
                    type="text"
                    required
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                    placeholder="10:00 AM"
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-[#12282D] border border-slate-200 dark:border-teal-900/60 focus:outline-none focus:ring-2 focus:ring-[#2D8885] dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-teal-900/40">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2D8885] hover:bg-[#257370] text-white text-sm font-bold shadow-md shadow-teal-700/20 active:scale-95 transition disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  <span>Save Timetable Slot</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-component for individual Timetable Slot Card
function SlotCard({
  slot,
  isStudent,
  isTeacher,
  isAdmin,
  onDelete,
  isDeleting,
}: {
  slot: TimetableSlot;
  isStudent: boolean;
  isTeacher: boolean;
  isAdmin: boolean;
  onDelete: (id: number) => void;
  isDeleting: boolean;
}) {
  return (
    <div className="bg-white dark:bg-[#0D2024] rounded-2xl p-5 shadow-sm border border-slate-200/80 dark:border-teal-900/40 hover:shadow-md transition-all flex flex-col justify-between group">
      <div>
        {/* Top Badges: Day & Time */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-teal-50 dark:bg-teal-950/60 text-[#2D8885] dark:text-teal-300 border border-teal-200/50 dark:border-teal-800/40">
            {slot.day_of_week}
          </span>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <Clock className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>
              {slot.start_time} - {slot.end_time}
            </span>
          </div>
        </div>

        {/* Subject Name */}
        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-snug group-hover:text-[#2D8885] dark:group-hover:text-teal-300 transition-colors">
          {slot.subject}
        </h3>

        {/* Cohort / Class Tag */}
        <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-medium">
          <GraduationCap className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
          <span className="truncate">{slot.class_name}</span>
        </div>

        {/* Instructor */}
        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <UserIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{slot.teacher_name || `Teacher #${slot.teacher_id}`}</span>
        </div>

        {/* Room / Hall */}
        {slot.room_number && (
          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <MapPin className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400 shrink-0" />
            <span className="truncate font-medium">{slot.room_number}</span>
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-teal-900/30 flex items-center justify-between gap-2">
        {/* If Teacher: 1-click Quick Launch QR Session */}
        {isTeacher ? (
          <Link
            href={`/sessions?openModal=1&class=${encodeURIComponent(slot.class_name)}&subject=${encodeURIComponent(slot.subject)}`}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-teal-50 dark:bg-teal-900/30 hover:bg-[#2D8885] text-[#2D8885] dark:text-teal-300 hover:text-white text-xs font-bold transition shadow-sm"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Launch Attendance</span>
          </Link>
        ) : (
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <BookOpen className="w-3 h-3 text-teal-600/70" />
            <span>Regular Period</span>
          </div>
        )}

        {/* Delete Slot (Admin or assigned Teacher) */}
        {!isStudent && (
          <button
            onClick={() => onDelete(slot.id)}
            disabled={isDeleting}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
            title="Delete schedule slot"
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
