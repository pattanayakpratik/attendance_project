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
  Info,
  Printer,
  Table,
  LayoutGrid,
  Coffee,
  Utensils,
  ChevronRight,
  Flame
} from 'lucide-react';
import { apiRequest, getSavedUser, UserSession } from '@/lib/api';

interface TimetableSlot {
  id: number;
  institute_id: number;
  class_name: string;
  subject: string;
  teacher_id: number | null;
  teacher_name?: string;
  teacher_email?: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  room_number?: string;
  slot_type?: string;
  is_break?: boolean;
  created_at?: string;
}

interface TimetableMeta {
  classes: string[];
  teachers: { id: number; name: string; email: string }[];
  days: string[];
}

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const match = timeStr.match(/(\d+):?(\d*)\s*(AM|PM)?/i);
  if (!match) return 0;
  let hours = parseInt(match[1], 10);
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  const meridiem = (match[3] || '').toUpperCase();
  if (meridiem === 'PM' && hours < 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

export default function TimetablePage() {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [meta, setMeta] = useState<TimetableMeta>({
    classes: [],
    teachers: [],
    days: ALL_DAYS,
  });
  const [detectedRole, setDetectedRole] = useState<string>('ADMIN');
  const [studentClass, setStudentClass] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // View Mode: 'WEEKLY_GRID' (matching Indian School/College matrix) vs 'DAILY_CARDS'
  const [viewMode, setViewMode] = useState<'WEEKLY_GRID' | 'DAILY_CARDS'>('WEEKLY_GRID');

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
  const [newSlotType, setNewSlotType] = useState('LECTURE');
  const [applyAllDays, setApplyAllDays] = useState(false);

  // Delete Slot state
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const todayName = useMemo(() => {
    return new Date().toLocaleDateString('en-US', { weekday: 'long' });
  }, []);

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

      if (viewMode === 'DAILY_CARDS' && selectedDay !== 'All Days') {
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
            days: data.meta.days || ALL_DAYS,
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
  }, [viewMode, selectedDay, filterClass, filterTeacher]);

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
    const isBreak = ['BREAK', 'LUNCH', 'RECESS', 'ASSEMBLY'].includes(newSlotType.toUpperCase());

    if (!isBreak && (!newClass.trim() || !newSubject.trim())) {
      showToast('Please provide class and subject for lecture periods', 'error');
      return;
    }
    if (!newStartTime.trim() || !newEndTime.trim()) {
      showToast('Please specify start and end time', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const targetDays = applyAllDays ? WEEKDAYS : [newDay];
      let successCount = 0;

      for (const d of targetDays) {
        const payload = {
          class_name: isBreak ? (newClass.trim() || 'ALL') : newClass.trim(),
          subject: isBreak
            ? (newSubject.trim() || (newSlotType === 'LUNCH' ? 'Lunch Break' : 'Short Break / Recess'))
            : newSubject.trim(),
          teacher_id: isBreak ? null : (Number(newTeacherId) || currentUser?.id),
          day_of_week: d,
          start_time: newStartTime.trim(),
          end_time: newEndTime.trim(),
          room_number: newRoom.trim() || (newSlotType === 'LUNCH' ? 'Cafeteria' : ''),
          slot_type: newSlotType,
          is_break: isBreak,
        };

        const res = await apiRequest('/add_timetable_slot', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (res.ok) successCount++;
      }

      showToast(`Successfully created ${successCount} schedule slot(s)!`);
      setShowAddModal(false);
      setNewSubject('');
      setNewRoom('');
      fetchTimetable();
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

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
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

  // Group slots by Day
  const slotsByDay = useMemo(() => {
    const map: Record<string, TimetableSlot[]> = {};
    ALL_DAYS.forEach((d) => (map[d] = []));
    filteredSlots.forEach((slot) => {
      const d =
        ALL_DAYS.find((w) => w.toLowerCase() === slot.day_of_week.toLowerCase()) ||
        slot.day_of_week;
      if (!map[d]) map[d] = [];
      map[d].push(slot);
    });
    return map;
  }, [filteredSlots]);

  // Distinct Time Intervals for Weekly Matrix Grid
  const timeIntervals = useMemo(() => {
    const intervalsMap = new Map<string, { start: string; end: string; startMin: number; endMin: number; isBreakRow: boolean; breakType?: string; breakTitle?: string }>();

    filteredSlots.forEach((slot) => {
      const key = `${slot.start_time.trim()} - ${slot.end_time.trim()}`;
      if (!intervalsMap.has(key)) {
        const isB = !!slot.is_break || ['BREAK', 'LUNCH', 'RECESS', 'ASSEMBLY'].includes((slot.slot_type || '').toUpperCase());
        intervalsMap.set(key, {
          start: slot.start_time.trim(),
          end: slot.end_time.trim(),
          startMin: parseTimeToMinutes(slot.start_time),
          endMin: parseTimeToMinutes(slot.end_time),
          isBreakRow: isB,
          breakType: slot.slot_type,
          breakTitle: slot.subject,
        });
      } else if (slot.is_break) {
        const existing = intervalsMap.get(key)!;
        existing.isBreakRow = true;
        existing.breakType = slot.slot_type;
        existing.breakTitle = slot.subject;
      }
    });

    return Array.from(intervalsMap.values()).sort((a, b) => a.startMin - b.startMin);
  }, [filteredSlots]);

  // Check if a time slot is currently active right now
  const isPeriodNow = (day: string, startStr: string, endStr: string) => {
    const now = new Date();
    const curDay = now.toLocaleDateString('en-US', { weekday: 'long' });
    if (curDay.toLowerCase() !== day.toLowerCase()) return false;
    const nowM = now.getHours() * 60 + now.getMinutes();
    const sM = parseTimeToMinutes(startStr);
    const eM = parseTimeToMinutes(endStr);
    return nowM >= sM && nowM <= eM;
  };

  const isStudent = detectedRole === 'STUDENT' || currentUser?.role === 'STUDENT';
  const isTeacher = detectedRole === 'TEACHER' || currentUser?.role === 'TEACHER';
  const isAdmin = !isStudent && !isTeacher;

  return (
    <div className="min-h-screen bg-[#F4F9F8] dark:bg-[#060D0E] text-slate-800 dark:text-slate-100 p-4 sm:p-6 lg:p-8 transition-colors print:p-0 print:bg-white print:text-black">
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

        {/* Master Timetable Hero Banner matching Student Indian Format */}
        <div className="bg-white dark:bg-[#0D2024] rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200/80 dark:border-teal-900/40 relative overflow-hidden print:border-none print:shadow-none print:p-2">
          <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/5 dark:bg-teal-400/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/10 dark:bg-teal-400/10 flex items-center justify-center text-[#2D8885] dark:text-teal-300 print:hidden">
                  <CalendarDays className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase font-sans">
                      Timetable
                    </h1>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200 uppercase tracking-wider print:hidden">
                      Fixed Weekly Schedule
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {isStudent ? (
                      <span className="flex items-center gap-1.5 font-medium text-teal-700 dark:text-teal-300">
                        <GraduationCap className="w-4 h-4" />
                        Student Class Schedule •{' '}
                        <span className="font-bold underline text-slate-800 dark:text-white">
                          {studentClass || currentUser?.class || 'Enrolled Class'}
                        </span>
                        <span className="text-slate-400">• Academic Year 2026-2027</span>
                      </span>
                    ) : isTeacher ? (
                      <span className="flex items-center gap-1.5 font-medium text-emerald-700 dark:text-emerald-300">
                        <UserIcon className="w-4 h-4" />
                        Faculty Teaching Schedule • Instructor:{' '}
                        <span className="font-bold text-slate-800 dark:text-white">
                          {currentUser?.name || 'Faculty Member'}
                        </span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300">
                        <Building2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                        Master Institute Timetable • All Courses, Batches, Breaks & Faculty
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* View Mode Switch + Action Buttons */}
            <div className="flex items-center gap-2.5 flex-wrap print:hidden">
              {/* View Switcher: Weekly Matrix vs Daily Cards */}
              <div className="bg-slate-100 dark:bg-[#12282D] p-1 rounded-xl flex items-center border border-slate-200 dark:border-teal-900/60">
                <button
                  onClick={() => setViewMode('WEEKLY_GRID')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    viewMode === 'WEEKLY_GRID'
                      ? 'bg-[#2D8885] text-white shadow'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                  title="View as complete weekly timetable table (like school/college board)"
                >
                  <Table className="w-3.5 h-3.5" />
                  <span>Weekly Matrix</span>
                </button>
                <button
                  onClick={() => setViewMode('DAILY_CARDS')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    viewMode === 'DAILY_CARDS'
                      ? 'bg-[#2D8885] text-white shadow'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                  title="View day-by-day lecture cards"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Day View</span>
                </button>
              </div>

              {/* Print / Save PDF Button */}
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-teal-800/60 bg-white dark:bg-[#12282D] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#163339] text-xs sm:text-sm font-semibold transition"
                title="Print or Save Timetable as PDF"
              >
                <Printer className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span className="hidden sm:inline">Print Timetable</span>
              </button>

              {/* Refresh */}
              <button
                onClick={fetchTimetable}
                disabled={isLoading}
                className="p-2 rounded-xl border border-slate-200 dark:border-teal-800/60 bg-white dark:bg-[#12282D] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#163339] transition"
                title="Refresh schedule"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>

              {/* Add Slot Button (Admin & Teacher) */}
              {!isStudent && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2D8885] hover:bg-[#257370] text-white text-xs sm:text-sm font-bold shadow-md shadow-teal-700/20 active:scale-95 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Slot / Break</span>
                </button>
              )}
            </div>
          </div>

          {/* Sub-bar notice */}
          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-teal-900/40 flex items-center justify-between flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400 print:hidden">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
              </span>
              <span>
                Today is <strong className="text-slate-700 dark:text-slate-200">{todayName}</strong>. Standard weekly cycle runs Monday to Saturday with designated breaks.
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-amber-700 dark:text-amber-300 font-semibold">
                <Coffee className="w-3.5 h-3.5" /> Short Break
              </span>
              <span className="flex items-center gap-1 text-orange-700 dark:text-orange-300 font-semibold">
                <Utensils className="w-3.5 h-3.5" /> Lunch Break
              </span>
              <span className="px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 font-bold">
                {filteredSlots.length} slot{filteredSlots.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Admin Filters + Search Bar */}
        <div className="bg-white dark:bg-[#0D2024] rounded-2xl p-4 shadow-sm border border-slate-200/80 dark:border-teal-900/40 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 print:hidden">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by subject, instructor, lab room..."
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
                className="px-3 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-[#12282D] border border-slate-200 dark:border-teal-900/60 focus:outline-none focus:ring-2 focus:ring-[#2D8885] dark:text-slate-200 font-medium"
              >
                <option value="ALL">Select Cohort: All Batches</option>
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
                className="px-3 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-[#12282D] border border-slate-200 dark:border-teal-900/60 focus:outline-none focus:ring-2 focus:ring-[#2D8885] dark:text-slate-200 font-medium"
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

        {/* ============================================================== */}
        {/* VIEW MODE 1: WEEKLY MATRIX GRID (Matches User Uploaded Images) */}
        {/* ============================================================== */}
        {viewMode === 'WEEKLY_GRID' ? (
          <div className="bg-white dark:bg-[#0D2024] rounded-2xl shadow-sm border border-slate-200/80 dark:border-teal-900/40 overflow-hidden">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-24">
                <Loader2 className="w-10 h-10 text-[#2D8885] animate-spin mb-3" />
                <p className="text-slate-500 text-sm font-medium">Loading weekly timetable grid...</p>
              </div>
            ) : timeIntervals.length === 0 ? (
              <div className="text-center py-20 px-4">
                <div className="w-16 h-16 rounded-2xl bg-teal-50 dark:bg-teal-950/40 flex items-center justify-center text-teal-600 dark:text-teal-400 mx-auto mb-4">
                  <Calendar className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold">No Scheduled Lectures</h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-5">
                  No slots currently found. Teachers or Admins can configure the weekly schedule using &quot;Add Slot / Break&quot;.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm min-w-[850px]">
                  {/* Table Headers matching Image 1: TIME, MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY */}
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-teal-900/50 bg-[#2D8885] text-white">
                      <th className="py-4 px-4 w-36 font-black uppercase tracking-wider text-xs border-r border-teal-600/40 bg-teal-700/60 dark:bg-teal-950/60">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          <span>TIME</span>
                        </div>
                      </th>
                      {WEEKDAYS.map((day) => {
                        const isToday = todayName.toLowerCase() === day.toLowerCase();
                        return (
                          <th
                            key={day}
                            className={`py-4 px-3 font-extrabold uppercase tracking-wider text-xs border-r border-teal-600/40 last:border-r-0 ${
                              isToday
                                ? 'bg-teal-600/90 dark:bg-teal-900/90'
                                : ''
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span>{day}</span>
                              {isToday && (
                                <span className="text-[10px] bg-white text-teal-800 font-black px-1.5 py-0.5 rounded-md shadow-sm">
                                  TODAY
                                </span>
                              )}
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>

                  {/* Table Body: Each Period / Break Row */}
                  <tbody className="divide-y divide-slate-200/80 dark:divide-teal-900/30">
                    {timeIntervals.map((interval, rowIdx) => {
                      const timeLabel = `${interval.start} - ${interval.end}`;

                      // Check if this time slot is an Institute-wide Break (e.g. 11:00 AM Short Break or 01:15 PM Lunch)
                      const sampleBreak = filteredSlots.find(
                        (s) =>
                          s.is_break &&
                          s.start_time.trim() === interval.start &&
                          s.end_time.trim() === interval.end
                      );

                      if (sampleBreak || interval.isBreakRow) {
                        const isLunch = (sampleBreak?.slot_type || interval.breakType || '').toUpperCase() === 'LUNCH';
                        return (
                          <tr
                            key={timeLabel}
                            className={
                              isLunch
                                ? 'bg-orange-50/70 dark:bg-orange-950/20'
                                : 'bg-amber-50/70 dark:bg-amber-950/20'
                            }
                          >
                            {/* Time Column */}
                            <td className="py-3 px-4 font-bold text-xs text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-teal-900/40 whitespace-nowrap bg-slate-50/80 dark:bg-[#12282D]">
                              {timeLabel}
                            </td>

                            {/* Full-width spanning break banner matching Image 2 */}
                            <td
                              colSpan={WEEKDAYS.length}
                              className="py-3 px-4 text-center font-black tracking-widest text-xs uppercase"
                            >
                              <div
                                className={`inline-flex items-center justify-center gap-2 py-1.5 px-6 rounded-xl shadow-sm border ${
                                  isLunch
                                    ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-200 border-orange-300/60'
                                    : 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 border-amber-300/60'
                                }`}
                              >
                                {isLunch ? (
                                  <Utensils className="w-4 h-4 text-orange-600" />
                                ) : (
                                  <Coffee className="w-4 h-4 text-amber-600" />
                                )}
                                <span>
                                  {isLunch ? '🍱 LUNCH BREAK' : '☕ SHORT BREAK / RECESS'}
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      }

                      // Regular Lecture / Lab Row
                      return (
                        <tr
                          key={timeLabel}
                          className="hover:bg-slate-50/60 dark:hover:bg-[#12282D]/40 transition-colors"
                        >
                          {/* Time Column */}
                          <td className="py-3.5 px-4 font-bold text-xs text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-teal-900/40 whitespace-nowrap bg-slate-50/60 dark:bg-[#12282D]">
                            <div className="flex flex-col">
                              <span>{interval.start}</span>
                              <span className="text-[10px] text-slate-400 font-normal">to {interval.end}</span>
                            </div>
                          </td>

                          {/* Day Columns */}
                          {WEEKDAYS.map((day) => {
                            const slot = filteredSlots.find(
                              (s) =>
                                s.day_of_week.toLowerCase() === day.toLowerCase() &&
                                s.start_time.trim() === interval.start &&
                                !s.is_break
                            );

                            const isLive = slot
                              ? isPeriodNow(day, slot.start_time, slot.end_time)
                              : false;

                            const isToday = todayName.toLowerCase() === day.toLowerCase();

                            return (
                              <td
                                key={day}
                                className={`py-2.5 px-2.5 border-r border-slate-200 dark:border-teal-900/30 last:border-r-0 align-top ${
                                  isToday ? 'bg-teal-50/30 dark:bg-teal-950/15' : ''
                                }`}
                              >
                                {slot ? (
                                  <div
                                    className={`p-2.5 rounded-xl border text-xs flex flex-col justify-between h-full transition-all ${
                                      isLive
                                        ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-500 ring-2 ring-teal-400/50 shadow-sm'
                                        : 'bg-white dark:bg-[#132A30] border-slate-200/80 dark:border-teal-800/40 hover:border-teal-400'
                                    }`}
                                  >
                                    <div>
                                      {/* Subject Code / Name */}
                                      <div className="flex items-start justify-between gap-1">
                                        <h4 className="font-bold text-slate-900 dark:text-white leading-tight">
                                          {slot.subject}
                                        </h4>
                                        {isLive && (
                                          <span className="shrink-0 flex items-center gap-1 text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-rose-500 text-white animate-pulse">
                                            LIVE
                                          </span>
                                        )}
                                      </div>

                                      {/* Cohort (if Admin/Teacher viewing) */}
                                      {!isStudent && (
                                        <div className="mt-1 text-[10px] font-semibold text-teal-700 dark:text-teal-300 truncate">
                                          {slot.class_name}
                                        </div>
                                      )}

                                      {/* Room & Teacher (matching Image 2) */}
                                      <div className="mt-1.5 space-y-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                                        {slot.room_number && (
                                          <div className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                                            <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                                            <span className="truncate">{slot.room_number}</span>
                                          </div>
                                        )}
                                        {slot.teacher_name && (
                                          <div className="flex items-center gap-1 truncate">
                                            <UserIcon className="w-3 h-3 text-slate-400 shrink-0" />
                                            <span className="truncate">{slot.teacher_name}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Action row for Teacher or Delete */}
                                    <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-teal-900/40 flex items-center justify-between gap-1 print:hidden">
                                      {isTeacher ? (
                                        <Link
                                          href={`/sessions?openModal=1&class=${encodeURIComponent(slot.class_name)}&subject=${encodeURIComponent(slot.subject)}`}
                                          className="flex items-center gap-1 text-[10px] font-bold text-[#2D8885] dark:text-teal-300 hover:underline"
                                          title="Launch QR Attendance for this class"
                                        >
                                          <QrCode className="w-3 h-3" />
                                          <span>Start QR</span>
                                        </Link>
                                      ) : (
                                        <span className="text-[10px] text-slate-400 font-medium">
                                          {slot.slot_type || 'Period'}
                                        </span>
                                      )}

                                      {!isStudent && (
                                        <button
                                          onClick={() => handleDeleteSlot(slot.id)}
                                          disabled={deletingId === slot.id}
                                          className="p-1 rounded text-slate-400 hover:text-rose-600 transition"
                                          title="Remove slot"
                                        >
                                          {deletingId === slot.id ? (
                                            <Loader2 className="w-3 h-3 animate-spin text-rose-500" />
                                          ) : (
                                            <Trash2 className="w-3 h-3" />
                                          )}
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="h-full min-h-[64px] rounded-xl flex items-center justify-center text-slate-300 dark:text-slate-700 text-xs">
                                    —
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          /* ============================================================== */
          /* VIEW MODE 2: DAILY CARDS TIMELINE                              */
          /* ============================================================== */
          <div className="space-y-4">
            {/* Weekday Selector Pills */}
            <div className="bg-white dark:bg-[#0D2024] rounded-2xl p-4 shadow-sm border border-slate-200/80 dark:border-teal-900/40">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                {['All Days', ...WEEKDAYS].map((day) => {
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
            </div>

            {/* Daily Cards Grid */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-[#0D2024] rounded-2xl border border-slate-200/80 dark:border-teal-900/40">
                <Loader2 className="w-10 h-10 text-[#2D8885] animate-spin mb-3" />
                <p className="text-slate-500 text-sm font-medium">Loading schedule slots...</p>
              </div>
            ) : filteredSlots.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-[#0D2024] rounded-2xl border border-slate-200/80 dark:border-teal-900/40">
                <Calendar className="w-8 h-8 text-teal-600 mx-auto mb-2" />
                <h3 className="font-bold">No lectures scheduled for {selectedDay}</h3>
              </div>
            ) : (
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
        )}
      </div>

      {/* Add Slot / Break Modal */}
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
                    Add Schedule Slot / Break
                  </h3>
                  <p className="text-xs text-slate-400">
                    Define fixed weekly period, lab, or break for the academic year
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
              {/* Slot Type */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Type of Period *
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'LECTURE', label: 'Lecture' },
                    { id: 'LAB', label: 'Lab / Pract' },
                    { id: 'BREAK', label: '☕ Recess' },
                    { id: 'LUNCH', label: '🍱 Lunch' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setNewSlotType(t.id)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition text-center ${
                        newSlotType === t.id
                          ? 'bg-[#2D8885] text-white border-transparent shadow'
                          : 'bg-slate-50 dark:bg-[#12282D] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-teal-900/60'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Class / Cohort */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Target Class / Cohort {newSlotType !== 'LECTURE' && newSlotType !== 'LAB' ? '(or "ALL")' : '*'}
                </label>
                <input
                  type="text"
                  required={newSlotType === 'LECTURE' || newSlotType === 'LAB'}
                  list="classes-list"
                  value={newClass}
                  onChange={(e) => setNewClass(e.target.value)}
                  placeholder={
                    newSlotType === 'BREAK' || newSlotType === 'LUNCH'
                      ? 'ALL (Institute-wide) or specific cohort'
                      : 'e.g. 2026-2030 CSE Batch - Sem 2, Class 10-A'
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-[#12282D] border border-slate-200 dark:border-teal-900/60 focus:outline-none focus:ring-2 focus:ring-[#2D8885] dark:text-slate-100"
                />
                <datalist id="classes-list">
                  <option value="ALL" />
                  {meta.classes.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>

              {/* Subject / Title */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Subject / Activity Title *
                </label>
                <input
                  type="text"
                  required={newSlotType === 'LECTURE' || newSlotType === 'LAB'}
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder={
                    newSlotType === 'LUNCH'
                      ? 'Lunch Break'
                      : newSlotType === 'BREAK'
                      ? 'Short Break / Recess'
                      : 'e.g. Data Structures & Algorithms, Physics'
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-[#12282D] border border-slate-200 dark:border-teal-900/60 focus:outline-none focus:ring-2 focus:ring-[#2D8885] dark:text-slate-100"
                />
              </div>

              {/* Teacher Selection (only for lectures/labs) */}
              {newSlotType !== 'BREAK' && newSlotType !== 'LUNCH' && (
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
              )}

              {/* Day of Week + Repeat Option */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    Day of Week *
                  </label>
                  <select
                    disabled={applyAllDays}
                    value={newDay}
                    onChange={(e) => setNewDay(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-[#12282D] border border-slate-200 dark:border-teal-900/60 focus:outline-none focus:ring-2 focus:ring-[#2D8885] dark:text-slate-100 disabled:opacity-50"
                  >
                    {WEEKDAYS.map((d) => (
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
                    placeholder={newSlotType === 'LUNCH' ? 'Cafeteria' : 'e.g. Room 204, Lab 3'}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-[#12282D] border border-slate-200 dark:border-teal-900/60 focus:outline-none focus:ring-2 focus:ring-[#2D8885] dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Repeat across Monday-Saturday checkbox (common for breaks) */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="applyAllDays"
                  checked={applyAllDays}
                  onChange={(e) => setApplyAllDays(e.target.checked)}
                  className="w-4 h-4 rounded text-[#2D8885] focus:ring-[#2D8885] border-slate-300"
                />
                <label htmlFor="applyAllDays" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Repeat every day (Monday to Saturday) — recommended for Breaks & Lunch
                </label>
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
                  <span>Save Slot</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-component for individual Timetable Slot Card (in Daily Cards view)
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
  const isBreak = slot.is_break || ['BREAK', 'LUNCH', 'RECESS', 'ASSEMBLY'].includes((slot.slot_type || '').toUpperCase());
  const isLunch = (slot.slot_type || '').toUpperCase() === 'LUNCH';

  if (isBreak) {
    return (
      <div
        className={`rounded-2xl p-4 shadow-sm border flex items-center justify-between ${
          isLunch
            ? 'bg-orange-50/80 dark:bg-orange-950/30 border-orange-200/80 dark:border-orange-900/40 text-orange-900 dark:text-orange-200'
            : 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200/80 dark:border-amber-900/40 text-amber-900 dark:text-amber-200'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
              isLunch ? 'bg-orange-100 text-orange-600' : 'bg-amber-100 text-amber-600'
            }`}
          >
            {isLunch ? <Utensils className="w-5 h-5" /> : <Coffee className="w-5 h-5" />}
          </div>
          <div>
            <div className="font-bold text-sm">
              {isLunch ? '🍱 Lunch Break' : '☕ Short Break / Recess'}
            </div>
            <div className="text-xs opacity-75">
              {slot.day_of_week} • {slot.start_time} - {slot.end_time}
            </div>
          </div>
        </div>
        {!isStudent && (
          <button
            onClick={() => onDelete(slot.id)}
            disabled={isDeleting}
            className="p-1.5 rounded-lg opacity-60 hover:opacity-100 hover:text-rose-600 transition"
            title="Delete break"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

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
          <span className="truncate">{slot.teacher_name || (slot.teacher_id ? `Teacher #${slot.teacher_id}` : '')}</span>
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
