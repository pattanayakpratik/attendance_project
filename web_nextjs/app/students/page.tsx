'use client';

import React, { useEffect, useState } from 'react';
import {
  GraduationCap,
  Search,
  Plus,
  Upload,
  Phone,
  Mail,
  Loader2,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { apiRequest, getSavedUser } from '@/lib/api';

interface Student {
  id: number;
  name: string;
  class: string;
  email: string;
  phone: string;
  avatar?: string;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // Form states for new student
  const [newId, setNewId] = useState('');
  const [newName, setNewName] = useState('');
  const [newClass, setNewClass] = useState('Class 10');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newPassword, setNewPassword] = useState('student123');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Demo fallback students matching mockup Screen 3
  const mockStudents: Student[] = [
    {
      id: 101,
      name: 'Emma Johnson',
      class: 'Class 10',
      email: 'emma@school.com',
      phone: '+91 9381075071',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    },
    {
      id: 102,
      name: 'Robert Brown',
      class: 'Class 10',
      email: 'robert@school.com',
      phone: '+91 9088552381',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    },
    {
      id: 103,
      name: 'David Wilson',
      class: 'Class 10',
      email: 'david@school.com',
      phone: '+91 7334872502',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    },
    {
      id: 104,
      name: 'Sarah Taylor',
      class: 'Class 10',
      email: 'sarah@school.com',
      phone: '+91 9811097016',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
    },
  ];

  const fetchStudents = async () => {
    setIsLoading(true);
    const res = await apiRequest('/get_all_student');
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
    setFilteredStudents(
      students.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.class.toLowerCase().includes(q) ||
          s.phone.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q)
      )
    );
  }, [searchQuery, students]);

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
        request_id: user?.id || 1,
      }),
    });

    setIsSubmitting(false);

    if (res.ok) {
      setShowAddModal(false);
      fetchStudents();
    } else {
      // Add locally for demo
      const newSt: Student = {
        id: parseInt(newId, 10) || Date.now(),
        name: newName,
        class: newClass,
        email: newEmail,
        phone: newPhone,
      };
      setStudents([newSt, ...students]);
      setShowAddModal(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F5F7F8] p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Student List</h1>
            <p className="text-sm text-slate-500 mt-1">
              Registered students with class details, roll numbers, and contact info
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-5 py-3 bg-[#2D8885] hover:bg-[#236E6C] text-white font-bold text-sm rounded-2xl shadow-lg shadow-teal-700/10 transition"
            >
              <Plus className="w-5 h-5" />
              <span>Add Student</span>
            </button>
          </div>
        </div>

        {/* Search Bar matching Mockup Screen 3 */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search students by name, class, roll number, or phone..."
            className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200/80 rounded-2xl text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2D8885]/30 focus:border-[#2D8885] transition"
          />
        </div>

        {/* Student Cards List matching Mockup */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="py-20 text-center">
              <Loader2 className="w-8 h-8 text-[#2D8885] animate-spin mx-auto" />
              <p className="text-xs text-slate-400 mt-2 font-medium">Loading student roster...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
              <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No students match your search</p>
            </div>
          ) : (
            filteredStudents.map((st) => (
              <div
                key={st.id}
                className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  {st.avatar ? (
                    <img
                      src={st.avatar}
                      alt={st.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-teal-100"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[#E7F3F2] text-[#2D8885] flex items-center justify-center font-bold text-base">
                      {st.name ? st.name[0].toUpperCase() : 'S'}
                    </div>
                  )}

                  <div>
                    <h3 className="text-base font-bold text-slate-800 leading-tight">{st.name}</h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                      <span className="font-semibold text-[#2D8885]">{st.class}</span>
                      <span>•</span>
                      <span>Roll ID: {st.id}</span>
                      {st.phone && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-slate-400">
                            <Phone className="w-3 h-3" />
                            {st.phone}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right hidden sm:block">
                  <div className="text-xs font-semibold text-slate-600">{st.email}</div>
                  <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold">
                    Active Student
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-white">
            <h2 className="text-xl font-bold text-slate-800 mb-1">Add Student</h2>
            <p className="text-xs text-slate-500 mb-6">Create a student profile to allow attendance logging.</p>

            <form onSubmit={handleAddStudent} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Roll Number / ID</label>
                  <input
                    type="number"
                    value={newId}
                    onChange={(e) => setNewId(e.target.value)}
                    placeholder="e.g. 105"
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#2D8885]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Class</label>
                  <input
                    type="text"
                    value={newClass}
                    onChange={(e) => setNewClass(e.target.value)}
                    placeholder="e.g. Class 10"
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#2D8885]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#2D8885]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="alex@school.com"
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#2D8885]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="+91 9876543210"
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#2D8885]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#2D8885]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-[#2D8885] hover:bg-[#236E6C] text-white text-xs font-bold rounded-xl shadow transition flex items-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Student</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
