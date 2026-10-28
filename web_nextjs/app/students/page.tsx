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
  History,
  ArrowRight,
  Sparkles,
  BookOpen,
  Calendar,
  Layers,
  ChevronRight,
  Clock,
  X,
  School,
  Building2,
  Briefcase
} from 'lucide-react';
import { apiRequest, getSavedUser } from '@/lib/api';

type SectorType = 'COLLEGE' | 'SCHOOL' | 'COACHING';

interface Student {
  id: number;
  name: string;
  class: string;
  email: string;
  phone: string;
  avatar?: string;
  status?: 'ACTIVE' | 'LEFT' | 'GRADUATED' | string;
  course?: string;
  batch?: string;
  semester?: string;
}

interface SemesterHistoryItem {
  history_id: number;
  course: string;
  batch: string;
  semester: string;
  class_name: string;
  academic_year: string;
  status: 'ACTIVE' | 'COMPLETED' | string;
  promoted_at: string;
  attended_sessions: number;
  total_sessions: number;
  attendance_percentage: number;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusTab, setSelectedStatusTab] = useState<'ALL' | 'ACTIVE' | 'LEFT'>('ALL');
  const [selectedBatchFilter, setSelectedBatchFilter] = useState<string>('ALL');
  const [batchesList, setBatchesList] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Sector Mode: College vs School vs Coaching
  const [sectorType, setSectorType] = useState<SectorType>('COLLEGE');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedStudentForHistory, setSelectedStudentForHistory] = useState<Student | null>(null);
  const [studentHistoryData, setStudentHistoryData] = useState<SemesterHistoryItem[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  // Action status states
  const [statusActionLoading, setStatusActionLoading] = useState<number | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  // Add Student Form States
  const [newName, setNewName] = useState('');
  const [newId, setNewId] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newPassword, setNewPassword] = useState('123456');

  // Sector Dynamic Fields for Add
  const [newCourse, setNewCourse] = useState('CSE');
  const [newBatch, setNewBatch] = useState('2026-2030 CSE Batch');
  const [newTerm, setNewTerm] = useState('Sem 1');
  const [newSection, setNewSection] = useState('Section A');
  const [newAcademicYear, setNewAcademicYear] = useState('2026-2027');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Promote Batch Form States
  const [promoteSector, setPromoteSector] = useState<SectorType>('COLLEGE');
  const [promoteBatchName, setPromoteBatchName] = useState('');
  const [promoteCourse, setPromoteCourse] = useState('');
  const [promoteTargetTerm, setPromoteTargetTerm] = useState('Sem 2');
  const [promoteTargetSection, setPromoteTargetSection] = useState('Section A');
  const [promoteAcademicYear, setPromoteAcademicYear] = useState('2026-2027');
  const [selectedStudentIdsForPromotion, setSelectedStudentIdsForPromotion] = useState<number[]>([]);
  const [isPromoting, setIsPromoting] = useState(false);

  // Mock Students fallback
  const mockStudents: Student[] = [
    {
      id: 301,
      name: 'Aarav Sharma',
      class: '2026-2030 CSE Batch - Sem 2',
      course: 'CSE',
      batch: '2026-2030 CSE Batch',
      semester: 'Sem 2',
      email: 'aarav@school.com',
      phone: '+91 9988776655',
      status: 'ACTIVE',
    },
    {
      id: 101,
      name: 'Emma Johnson',
      class: 'Class 10-A (2025-2026)',
      course: 'Standard K-12',
      batch: 'Class 10-A',
      semester: 'Class 10',
      email: 'emma@school.com',
      phone: '+91 9381075071',
      status: 'ACTIVE',
    },
    {
      id: 102,
      name: 'Rahul Verma',
      class: 'IIT-JEE Prep - Evening Batch (Phase 2)',
      course: 'IIT-JEE Prep',
      batch: 'Evening 6-8 PM Batch',
      semester: 'Phase 2',
      email: 'rahul@coaching.com',
      phone: '+91 9088552381',
      status: 'ACTIVE',
    },
    {
      id: 103,
      name: 'David Wilson',
      class: 'Full Stack Python - March Cohort (Phase 1)',
      course: 'Tech Bootcamp',
      batch: 'March 2026 Cohort',
      semester: 'Phase 1',
      email: 'david@bootcamp.com',
      phone: '+91 7338872501',
      status: 'LEFT',
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
        extractBatches(list);
      } else {
        setStudents(mockStudents);
        setFilteredStudents(mockStudents);
        extractBatches(mockStudents);
      }
    } else {
      setStudents(mockStudents);
      setFilteredStudents(mockStudents);
      extractBatches(mockStudents);
    }
    setIsLoading(false);
  };

  const extractBatches = (list: Student[]) => {
    const bSet = new Set<string>();
    list.forEach((s) => {
      if (s.batch) bSet.add(s.batch);
    });
    setBatchesList(Array.from(bSet));
    if (bSet.size > 0 && !promoteBatchName) {
      setPromoteBatchName(Array.from(bSet)[0]);
    }
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
        (s.batch && s.batch.toLowerCase().includes(q)) ||
        (s.course && s.course.toLowerCase().includes(q)) ||
        (s.semester && s.semester.toLowerCase().includes(q)) ||
        s.id.toString().includes(q) ||
        (s.phone && s.phone.includes(q))
    );

    if (selectedStatusTab === 'ACTIVE') {
      result = result.filter((s) => (s.status || 'ACTIVE').toUpperCase() === 'ACTIVE');
    } else if (selectedStatusTab === 'LEFT') {
      result = result.filter((s) => (s.status || '').toUpperCase() === 'LEFT');
    }

    if (selectedBatchFilter !== 'ALL') {
      result = result.filter((s) => s.batch === selectedBatchFilter);
    }

    setFilteredStudents(result);
  }, [searchQuery, selectedStatusTab, selectedBatchFilter, students]);

  // Open Academic History Modal
  const handleOpenHistory = async (st: Student) => {
    setSelectedStudentForHistory(st);
    setShowHistoryModal(true);
    setIsHistoryLoading(true);
    setStudentHistoryData([]);

    const res = await apiRequest(`/student_history?student_id=${st.id}`);
    setIsHistoryLoading(false);

    if (res.ok && res.data && (res.data as any).history) {
      setStudentHistoryData((res.data as any).history);
    } else {
      // Fallback timeline preview
      setStudentHistoryData([
        {
          history_id: 1,
          course: st.course || 'Core Program',
          batch: st.batch || st.class,
          semester: 'Term 1 / Sem 1',
          class_name: `${st.batch || st.class} (Term 1)`,
          academic_year: '2025-2026',
          status: 'COMPLETED',
          promoted_at: '2026-04-10',
          attended_sessions: 42,
          total_sessions: 45,
          attendance_percentage: 93.3,
        },
        {
          history_id: 2,
          course: st.course || 'Core Program',
          batch: st.batch || st.class,
          semester: st.semester || 'Term 2 / Active',
          class_name: st.class,
          academic_year: '2026-2027',
          status: 'ACTIVE',
          promoted_at: '2026-10-28',
          attended_sessions: 19,
          total_sessions: 20,
          attendance_percentage: 95.0,
        },
      ]);
    }
  };

  // Open Batch / Grade / Phase Promotion Modal
  const handleOpenPromoteModal = () => {
    const defaultBatch = batchesList[0] || (students[0]?.batch) || 'Class 9-A';
    setPromoteBatchName(defaultBatch);
    const studentsInBatch = students.filter(
      (s) => s.batch === defaultBatch && (s.status || 'ACTIVE').toUpperCase() === 'ACTIVE'
    );
    setSelectedStudentIdsForPromotion(studentsInBatch.map((s) => s.id));
    setShowPromoteModal(true);
  };

  const handleBatchSelectionChange = (batchName: string) => {
    setPromoteBatchName(batchName);
    const inBatch = students.filter(
      (s) => s.batch === batchName && (s.status || 'ACTIVE').toUpperCase() === 'ACTIVE'
    );
    setSelectedStudentIdsForPromotion(inBatch.map((s) => s.id));
  };

  const handleToggleSelectStudent = (id: number) => {
    if (selectedStudentIdsForPromotion.includes(id)) {
      setSelectedStudentIdsForPromotion(selectedStudentIdsForPromotion.filter((item) => item !== id));
    } else {
      setSelectedStudentIdsForPromotion([...selectedStudentIdsForPromotion, id]);
    }
  };

  const handleSelectAllInBatch = () => {
    const inBatch = students.filter(
      (s) => s.batch === promoteBatchName && (s.status || 'ACTIVE').toUpperCase() === 'ACTIVE'
    );
    if (selectedStudentIdsForPromotion.length === inBatch.length) {
      setSelectedStudentIdsForPromotion([]);
    } else {
      setSelectedStudentIdsForPromotion(inBatch.map((s) => s.id));
    }
  };

  // Execute Promotion (College Sem, School Grade, or Tuition Phase)
  const handleExecutePromotion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStudentIdsForPromotion.length === 0) {
      alert('Please select at least one student to promote.');
      return;
    }

    let targetClassName = '';
    let targetTerm = promoteTargetTerm;

    if (promoteSector === 'COLLEGE') {
      targetClassName = `${promoteBatchName} - ${promoteTargetTerm}`;
    } else if (promoteSector === 'SCHOOL') {
      targetClassName = `${promoteTargetTerm}-${promoteTargetSection} (${promoteAcademicYear})`;
      targetTerm = `${promoteTargetTerm}-${promoteTargetSection}`;
    } else {
      targetClassName = `${promoteBatchName} (${promoteTargetTerm})`;
    }

    setIsPromoting(true);
    const res = await apiRequest('/promote_batch', {
      method: 'POST',
      body: JSON.stringify({
        student_ids: selectedStudentIdsForPromotion,
        batch: promoteBatchName,
        course: promoteCourse,
        to_semester: targetTerm,
        target_class: targetClassName,
        academic_year: promoteAcademicYear,
      }),
    });
    setIsPromoting(false);

    if (res.ok) {
      setShowPromoteModal(false);
      setFeedbackToast(
        `Successfully promoted ${selectedStudentIdsForPromotion.length} students to ${targetClassName}! Past records permanently archived.`
      );
      setTimeout(() => setFeedbackToast(null), 5000);
      fetchStudents();
    } else {
      // Local fallback
      setStudents((prev) =>
        prev.map((s) =>
          selectedStudentIdsForPromotion.includes(s.id)
            ? { ...s, semester: targetTerm, class: targetClassName }
            : s
        )
      );
      setShowPromoteModal(false);
      setFeedbackToast(`Promoted to ${targetClassName} (offline mode).`);
      setTimeout(() => setFeedbackToast(null), 5000);
    }
  };

  // Toggle Active / Left Status
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
      setStudents((prev) =>
        prev.map((item) => (item.id === st.id ? { ...item, status: targetStatus } : item))
      );
      setFeedbackToast(`Status updated to ${targetStatus} (offline mode).`);
      setTimeout(() => setFeedbackToast(null), 4000);
    }
  };

  // Enroll Student
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = getSavedUser();
    setIsSubmitting(true);

    let generatedClass = '';
    let batchLabel = newBatch.trim();
    let termLabel = newTerm.trim();

    if (sectorType === 'COLLEGE') {
      generatedClass = `${newBatch.trim()} - ${newTerm.trim()}`;
    } else if (sectorType === 'SCHOOL') {
      batchLabel = `${newTerm.trim()}-${newSection.trim()}`;
      generatedClass = `${newTerm.trim()}-${newSection.trim()} (${newAcademicYear.trim()})`;
      termLabel = newTerm.trim();
    } else {
      // COACHING / TUITION
      generatedClass = `${newBatch.trim()} (${newTerm.trim()})`;
    }

    const res = await apiRequest('/add_student', {
      method: 'POST',
      body: JSON.stringify({
        id: parseInt(newId, 10),
        name: newName.trim(),
        course: newCourse.trim(),
        batch: batchLabel,
        semester: termLabel,
        class: generatedClass,
        academic_year: newAcademicYear.trim(),
        email: newEmail.trim().toLowerCase(),
        phone: newPhone.trim(),
        password: newPassword.trim(),
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
      setFeedbackToast(`Enrolled "${newName}" into ${generatedClass} successfully!`);
      setTimeout(() => setFeedbackToast(null), 4000);
    } else {
      const newSt: Student = {
        id: parseInt(newId, 10) || Date.now(),
        name: newName,
        course: newCourse,
        batch: batchLabel,
        semester: termLabel,
        class: generatedClass,
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
  const candidatesForPromotion = students.filter(
    (s) => s.batch === promoteBatchName && (s.status || 'ACTIVE').toUpperCase() === 'ACTIVE'
  );

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F5F7F8] dark:bg-[#0B1619] p-4 sm:p-6 lg:p-8 transition-colors duration-200">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Toast Notification */}
        {feedbackToast && (
          <div className="p-3 bg-teal-50 dark:bg-teal-950/80 border border-teal-200 dark:border-teal-800 text-[#2D8885] dark:text-teal-300 text-xs font-semibold rounded-2xl flex items-center gap-2 shadow-sm animate-fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{feedbackToast}</span>
          </div>
        )}

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
              Student Directory & Cohorts
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Supports Colleges (Semesters), Schools (Grades K-12), and Private Tuitions (Batches/Phases).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Batch Promote Button */}
            <button
              onClick={handleOpenPromoteModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-2xl shadow-lg shadow-indigo-600/20 transition transform hover:-translate-y-0.5"
            >
              <GraduationCap className="w-4 h-4" />
              <span>Promote Cohort / Grade / Sem</span>
            </button>

            {/* Enroll Student Button */}
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2D8885] dark:bg-teal-600 hover:bg-[#236E6C] dark:hover:bg-teal-500 text-white font-bold text-xs rounded-2xl shadow-lg shadow-teal-700/10 transition transform hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4" />
              <span>Enroll Student</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex bg-white dark:bg-[#132429] p-1 rounded-2xl border border-slate-200/80 dark:border-[#1E373E] shadow-sm">
            <button
              onClick={() => setSelectedStatusTab('ALL')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition ${
                selectedStatusTab === 'ALL'
                  ? 'bg-[#2D8885] text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              All Records ({students.length})
            </button>
            <button
              onClick={() => setSelectedStatusTab('ACTIVE')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition ${
                selectedStatusTab === 'ACTIVE'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Active Enrolled ({activeCount})
            </button>
            <button
              onClick={() => setSelectedStatusTab('LEFT')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition ${
                selectedStatusTab === 'LEFT'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Left / Alumni ({leftCount})
            </button>
          </div>

          {/* Batch Dropdown Filter */}
          {batchesList.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-[#2D8885]" /> Cohort / Batch:
              </span>
              <select
                value={selectedBatchFilter}
                onChange={(e) => setSelectedBatchFilter(e.target.value)}
                className="px-3 py-1.5 bg-white dark:bg-[#132429] border border-slate-200/80 dark:border-[#1E373E] rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#2D8885]"
              >
                <option value="ALL">All Cohorts / Batches</option>
                {batchesList.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Search Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student name, roll number, course, batch (e.g. 2026-2030 or Class 10), or timing slot..."
            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-[#132429] border border-slate-200/80 dark:border-[#1E373E] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-2xl text-xs sm:text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2D8885]/30 focus:border-[#2D8885] transition"
          />
        </div>

        {/* Students List */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="py-20 text-center">
              <Loader2 className="w-8 h-8 text-[#2D8885] dark:text-teal-400 animate-spin mx-auto" />
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 font-medium">Loading student roster...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="bg-white dark:bg-[#132429] rounded-3xl p-12 text-center border border-slate-200 dark:border-[#1E373E]">
              <GraduationCap className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400 font-medium">No students match your filter criteria</p>
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
                      ? 'border-amber-200/80 dark:border-amber-900/40 opacity-80 bg-amber-50/10'
                      : 'border-slate-200/80 dark:border-[#1E373E] hover:shadow-md hover:border-teal-300 dark:hover:border-teal-500/50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-base shadow-inner ${
                        isLeft
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                          : 'bg-[#E7F3F2] dark:bg-[#1A343B] text-[#2D8885] dark:text-teal-300'
                      }`}
                    >
                      {st.name ? st.name[0].toUpperCase() : 'S'}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 leading-tight">
                          {st.name}
                        </h3>

                        {/* Status Badge */}
                        {isLeft ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-[10px] font-bold">
                            Left / Alumni
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                            Active
                          </span>
                        )}

                        {/* Cohort Tag */}
                        {st.batch && (
                          <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold flex items-center gap-1">
                            <Layers className="w-3 h-3" />
                            {st.batch}
                          </span>
                        )}

                        {/* Level / Semester Tag */}
                        {st.semester && (
                          <span className="px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800/60 text-[#2D8885] dark:text-teal-300 text-[10px] font-bold">
                            {st.semester}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">Roll ID: {st.id}</span>
                        <span>•</span>
                        <span>{st.class}</span>
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

                  {/* Actions */}
                  <div className="flex items-center gap-2.5 justify-end border-t sm:border-t-0 pt-2 sm:pt-0">
                    {/* View History Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenHistory(st)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition"
                      title="View complete progression timeline & past attendance"
                    >
                      <History className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Timeline</span>
                    </button>

                    {/* Active/Left Toggle */}
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleToggleStudentStatus(st)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                        isLeft
                          ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
                          : 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100'
                      }`}
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

      {/* ----------------- MODAL 1: BATCH / GRADE / PHASE PROMOTION ----------------- */}
      {showPromoteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#132429] rounded-3xl p-6 sm:p-7 max-w-xl w-full shadow-2xl border border-white dark:border-[#1E373E] transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                    Cohort & Level Progression
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Move an entire cohort to the next semester, grade, or training phase.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPromoteModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sector Mode Selector in Promotion Modal */}
            <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 dark:bg-[#0E1E22] rounded-2xl mb-4 border border-slate-200/70 dark:border-[#1A3138]">
              <button
                type="button"
                onClick={() => {
                  setPromoteSector('COLLEGE');
                  setPromoteTargetTerm('Sem 2');
                }}
                className={`py-1.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition ${
                  promoteSector === 'COLLEGE'
                    ? 'bg-white dark:bg-[#1A343B] text-indigo-600 dark:text-indigo-300 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>College Sem</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPromoteSector('SCHOOL');
                  setPromoteTargetTerm('Class 10');
                }}
                className={`py-1.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition ${
                  promoteSector === 'SCHOOL'
                    ? 'bg-white dark:bg-[#1A343B] text-indigo-600 dark:text-indigo-300 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <School className="w-3.5 h-3.5" />
                <span>School Grade</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPromoteSector('COACHING');
                  setPromoteTargetTerm('Phase 2');
                }}
                className={`py-1.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition ${
                  promoteSector === 'COACHING'
                    ? 'bg-white dark:bg-[#1A343B] text-indigo-600 dark:text-indigo-300 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Tuition / Phase</span>
              </button>
            </div>

            <form onSubmit={handleExecutePromotion} className="space-y-4">
              {/* Batch & Target Level Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Current Cohort / Batch *
                  </label>
                  <select
                    value={promoteBatchName}
                    onChange={(e) => handleBatchSelectionChange(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#1A3138] border border-slate-200 dark:border-[#22424B] rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    {batchesList.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    {promoteSector === 'COLLEGE'
                      ? 'Target Semester *'
                      : promoteSector === 'SCHOOL'
                      ? 'Target Grade *'
                      : 'Target Module / Phase *'}
                  </label>
                  <input
                    type="text"
                    value={promoteTargetTerm}
                    onChange={(e) => setPromoteTargetTerm(e.target.value)}
                    placeholder={
                      promoteSector === 'COLLEGE'
                        ? 'e.g. Sem 2'
                        : promoteSector === 'SCHOOL'
                        ? 'e.g. Class 10'
                        : 'e.g. Phase 2 or Advanced'
                    }
                    required
                    className="w-full px-3 py-2 font-bold bg-slate-50 dark:bg-[#1A3138] border border-slate-200 dark:border-[#22424B] rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {promoteSector === 'SCHOOL' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                      Target Section
                    </label>
                    <input
                      type="text"
                      value={promoteTargetSection}
                      onChange={(e) => setPromoteTargetSection(e.target.value)}
                      placeholder="e.g. Section A"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#1A3138] border border-slate-200 dark:border-[#22424B] rounded-xl text-xs text-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                      New Academic Session
                    </label>
                    <input
                      type="text"
                      value={promoteAcademicYear}
                      onChange={(e) => setPromoteAcademicYear(e.target.value)}
                      placeholder="e.g. 2026-2027"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#1A3138] border border-slate-200 dark:border-[#22424B] rounded-xl text-xs text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>
              )}

              {/* Roster of Students to Promote */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Students in Batch ({candidatesForPromotion.length} enrolled)
                  </span>
                  <button
                    type="button"
                    onClick={handleSelectAllInBatch}
                    className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    {selectedStudentIdsForPromotion.length === candidatesForPromotion.length
                      ? 'Deselect All'
                      : 'Select All Passing'}
                  </button>
                </div>

                <div className="max-h-44 overflow-y-auto border border-slate-200 dark:border-[#22424B] rounded-2xl p-2 space-y-1.5 bg-slate-50/50 dark:bg-[#0E1E22]">
                  {candidatesForPromotion.length === 0 ? (
                    <p className="text-xs text-slate-400 p-3 text-center">No active students found in this batch.</p>
                  ) : (
                    candidatesForPromotion.map((st) => (
                      <label
                        key={st.id}
                        className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-[#132429] border border-slate-200/70 dark:border-[#1E373E] text-xs cursor-pointer hover:bg-slate-50"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedStudentIdsForPromotion.includes(st.id)}
                            onChange={() => handleToggleSelectStudent(st.id)}
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="font-bold text-slate-800 dark:text-slate-200">{st.name}</span>
                          <span className="text-slate-400 text-[10px]">(Roll ID: {st.id})</span>
                        </div>
                        <span className="text-[10px] font-semibold text-slate-500">{st.semester || 'Current'}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              {/* Immutable Preservation Notice */}
              <div className="p-2.5 rounded-2xl bg-teal-50/80 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800/60 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-[#2D8885] dark:text-teal-300 shrink-0 mt-0.5" />
                <p className="text-[10px] text-teal-900 dark:text-teal-200 leading-tight">
                  <span className="font-bold">Permanent Historical Audit:</span> All previous attendance records,
                  timestamps, and QR sessions remain completely frozen and preserved.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowPromoteModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#22424B] text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPromoting || selectedStudentIdsForPromotion.length === 0}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 disabled:opacity-50"
                >
                  {isPromoting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Promoting...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Promote ({selectedStudentIdsForPromotion.length}) Students</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- MODAL 2: ACADEMIC JOURNEY TIMELINE ----------------- */}
      {showHistoryModal && selectedStudentForHistory && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#132429] rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-white dark:border-[#1E373E] transition-all">
            <div className="flex items-center justify-between mb-4 border-b pb-3 border-slate-100 dark:border-[#1E373E]">
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <History className="w-5 h-5 text-indigo-500" />
                  <span>Academic Journey Timeline</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {selectedStudentForHistory.name} • Roll ID: {selectedStudentForHistory.id}
                </p>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isHistoryLoading ? (
              <div className="py-12 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-[#2D8885] mx-auto mb-2" />
                <p className="text-xs text-slate-400">Loading historical timeline...</p>
              </div>
            ) : studentHistoryData.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">No previous history on record.</p>
            ) : (
              <div className="space-y-3">
                {studentHistoryData.map((item, idx) => {
                  const isCompleted = item.status === 'COMPLETED';

                  return (
                    <div
                      key={item.history_id || idx}
                      className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                        isCompleted
                          ? 'bg-slate-50 dark:bg-[#0E1E22] border-slate-200 dark:border-[#1E373E]'
                          : 'bg-teal-50/50 dark:bg-[#1A343B]/60 border-teal-200 dark:border-teal-700/60 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                            isCompleted
                              ? 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                              : 'bg-[#2D8885] text-white shadow'
                          }`}
                        >
                          {idx + 1}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-800 dark:text-slate-100">
                              {item.semester || `Term ${idx + 1}`}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                isCompleted
                                  ? 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              }`}
                            >
                              {item.status}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {item.class_name}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-black text-slate-800 dark:text-slate-100">
                          {item.attendance_percentage}%
                        </div>
                        <p className="text-[10px] text-slate-400">
                          {item.attended_sessions}/{item.total_sessions} attended
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-5 text-right">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200"
              >
                Close Timeline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- MODAL 3: ENROLL STUDENT (MULTI-SECTOR) ----------------- */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#132429] rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-white dark:border-[#1E373E] transition-colors">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-1">Enroll New Student</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Select your institution type to format the class roster.
            </p>

            {/* Sector Type Switcher in Add Modal */}
            <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 dark:bg-[#0E1E22] rounded-2xl mb-4 border border-slate-200/70 dark:border-[#1A3138]">
              <button
                type="button"
                onClick={() => {
                  setSectorType('COLLEGE');
                  setNewCourse('CSE');
                  setNewBatch('2026-2030 CSE Batch');
                  setNewTerm('Sem 1');
                }}
                className={`py-1.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition ${
                  sectorType === 'COLLEGE'
                    ? 'bg-white dark:bg-[#1A343B] text-[#2D8885] dark:text-teal-300 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>College</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSectorType('SCHOOL');
                  setNewCourse('Standard K-12');
                  setNewBatch('Class 10-A');
                  setNewTerm('Class 10');
                  setNewSection('Section A');
                  setNewAcademicYear('2026-2027');
                }}
                className={`py-1.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition ${
                  sectorType === 'SCHOOL'
                    ? 'bg-white dark:bg-[#1A343B] text-[#2D8885] dark:text-teal-300 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <School className="w-3.5 h-3.5" />
                <span>School</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSectorType('COACHING');
                  setNewCourse('IIT-JEE Prep');
                  setNewBatch('Evening 6-8 PM Batch');
                  setNewTerm('Phase 1');
                }}
                className={`py-1.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition ${
                  sectorType === 'COACHING'
                    ? 'bg-white dark:bg-[#1A343B] text-[#2D8885] dark:text-teal-300 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Tuition</span>
              </button>
            </div>

            <form onSubmit={handleAddStudent} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Student Roll / ID *
                  </label>
                  <input
                    type="number"
                    value={newId}
                    onChange={(e) => setNewId(e.target.value)}
                    placeholder="e.g. 105"
                    required
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#1A3138] border border-slate-200 dark:border-[#22424B] rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#2D8885]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Emma Johnson"
                    required
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#1A3138] border border-slate-200 dark:border-[#22424B] rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#2D8885]"
                  />
                </div>
              </div>

              {/* Dynamic Sector Form Fields */}
              {sectorType === 'COLLEGE' && (
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      Course *
                    </label>
                    <input
                      type="text"
                      value={newCourse}
                      onChange={(e) => setNewCourse(e.target.value.toUpperCase())}
                      placeholder="e.g. CSE"
                      required
                      className="w-full px-3 py-2 uppercase font-bold bg-slate-50 dark:bg-[#1A3138] border border-slate-200 dark:border-[#22424B] rounded-xl text-xs text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      Batch Name *
                    </label>
                    <input
                      type="text"
                      value={newBatch}
                      onChange={(e) => setNewBatch(e.target.value)}
                      placeholder="e.g. 2026-2030 CSE Batch"
                      required
                      className="w-full px-3 py-2 font-semibold bg-slate-50 dark:bg-[#1A3138] border border-slate-200 dark:border-[#22424B] rounded-xl text-xs text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      Semester *
                    </label>
                    <input
                      type="text"
                      value={newTerm}
                      onChange={(e) => setNewTerm(e.target.value)}
                      placeholder="e.g. Sem 1"
                      required
                      className="w-full px-3 py-2 font-bold bg-slate-50 dark:bg-[#1A3138] border border-slate-200 dark:border-[#22424B] rounded-xl text-xs text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
              )}

              {sectorType === 'SCHOOL' && (
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      Grade / Class *
                    </label>
                    <input
                      type="text"
                      value={newTerm}
                      onChange={(e) => setNewTerm(e.target.value)}
                      placeholder="e.g. Class 10"
                      required
                      className="w-full px-3 py-2 font-bold bg-slate-50 dark:bg-[#1A3138] border border-slate-200 dark:border-[#22424B] rounded-xl text-xs text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      Section *
                    </label>
                    <input
                      type="text"
                      value={newSection}
                      onChange={(e) => setNewSection(e.target.value)}
                      placeholder="e.g. Section A"
                      required
                      className="w-full px-3 py-2 font-semibold bg-slate-50 dark:bg-[#1A3138] border border-slate-200 dark:border-[#22424B] rounded-xl text-xs text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      Session Year
                    </label>
                    <input
                      type="text"
                      value={newAcademicYear}
                      onChange={(e) => setNewAcademicYear(e.target.value)}
                      placeholder="e.g. 2026-2027"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#1A3138] border border-slate-200 dark:border-[#22424B] rounded-xl text-xs text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
              )}

              {sectorType === 'COACHING' && (
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      Program / Subject *
                    </label>
                    <input
                      type="text"
                      value={newCourse}
                      onChange={(e) => setNewCourse(e.target.value)}
                      placeholder="e.g. IIT-JEE Prep"
                      required
                      className="w-full px-3 py-2 font-bold bg-slate-50 dark:bg-[#1A3138] border border-slate-200 dark:border-[#22424B] rounded-xl text-xs text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      Batch / Time Slot *
                    </label>
                    <input
                      type="text"
                      value={newBatch}
                      onChange={(e) => setNewBatch(e.target.value)}
                      placeholder="e.g. Evening 6-8 PM"
                      required
                      className="w-full px-3 py-2 font-semibold bg-slate-50 dark:bg-[#1A3138] border border-slate-200 dark:border-[#22424B] rounded-xl text-xs text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      Module / Phase *
                    </label>
                    <input
                      type="text"
                      value={newTerm}
                      onChange={(e) => setNewTerm(e.target.value)}
                      placeholder="e.g. Phase 1"
                      required
                      className="w-full px-3 py-2 font-bold bg-slate-50 dark:bg-[#1A3138] border border-slate-200 dark:border-[#22424B] rounded-xl text-xs text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Email *</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="student@domain.com"
                    required
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#1A3138] border border-slate-200 dark:border-[#22424B] rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#2D8885]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#1A3138] border border-slate-200 dark:border-[#22424B] rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#2D8885]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#1A3138] border border-slate-200 dark:border-[#22424B] rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#2D8885]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#22424B] text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#2D8885] dark:bg-teal-600 hover:bg-[#236E6C] dark:hover:bg-teal-500 text-white text-xs font-bold rounded-xl shadow transition flex items-center gap-2"
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