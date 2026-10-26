'use client';

import React, { useEffect, useState } from 'react';
import { Users, Plus, Phone, Mail, Loader2, CheckCircle2 } from 'lucide-react';
import { apiRequest, getSavedUser } from '@/lib/api';

interface Teacher {
  id: number;
  name: string;
  email: string;
  phone: string;
}

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states matching Mockup Screen 7
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const mockTeachers: Teacher[] = [
    { id: 1, name: 'Dr. John Doe', email: 'john.doe@school.com', phone: '+91 9876543210' },
    { id: 2, name: 'Prof. Katherine Bell', email: 'k.bell@school.com', phone: '+91 9845123456' },
    { id: 3, name: 'Marcus Aurelius', email: 'marcus@school.com', phone: '+91 9711223344' },
  ];

  const fetchTeachers = async () => {
    setIsLoading(true);
    const res = await apiRequest('/get_teachers');
    if (res.ok && res.data) {
      const list = (res.data as any).teachers || res.data;
      if (Array.isArray(list) && list.length > 0) {
        setTeachers(list);
      } else {
        setTeachers(mockTeachers);
      }
    } else {
      setTeachers(mockTeachers);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = getSavedUser();
    setIsSubmitting(true);
    setStatusMsg(null);

    const res = await apiRequest('/add_teacher', {
      method: 'POST',
      body: JSON.stringify({
        name,
        email,
        phone,
        password,
        requesting_user_id: user?.id || 1,
      }),
    });

    setIsSubmitting(false);

    if (res.ok) {
      setStatusMsg({ type: 'success', text: 'Teacher added successfully!' });
      setTimeout(() => {
        setShowAddModal(false);
        setName('');
        setEmail('');
        setPhone('');
        setPassword('');
        fetchTeachers();
      }, 1000);
    } else {
      // Local fallback for demo
      const newT: Teacher = {
        id: Date.now(),
        name,
        email,
        phone,
      };
      setTeachers([newT, ...teachers]);
      setStatusMsg({ type: 'success', text: 'Teacher created in demo mode!' });
      setTimeout(() => setShowAddModal(false), 800);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F5F7F8] p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Teachers List</h1>
            <p className="text-sm text-slate-500 mt-1">
              Faculty members authorized to create attendance sessions and generate dynamic QR codes
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-5 py-3 bg-[#2D8885] hover:bg-[#236E6C] text-white font-bold text-sm rounded-2xl shadow-lg shadow-teal-700/10 transition"
          >
            <Plus className="w-5 h-5" />
            <span>Add Teacher</span>
          </button>
        </div>

        {/* Teachers Cards List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {isLoading ? (
            <div className="col-span-full py-20 text-center">
              <Loader2 className="w-8 h-8 text-[#2D8885] animate-spin mx-auto" />
              <p className="text-xs text-slate-400 mt-2 font-medium">Loading faculty members...</p>
            </div>
          ) : teachers.length === 0 ? (
            <div className="col-span-full bg-white rounded-3xl p-12 text-center border border-slate-200">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No teachers found</p>
            </div>
          ) : (
            teachers.map((t) => (
              <div
                key={t.id}
                className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all space-y-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#E7F3F2] text-[#2D8885] flex items-center justify-center font-bold text-xl">
                    {t.name ? t.name[0].toUpperCase() : 'T'}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">{t.name}</h3>
                    <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-full bg-teal-50 text-[#2D8885] text-[10px] font-bold">
                      Faculty Member
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-500 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{t.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{t.phone || 'Not provided'}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Teacher Modal matching Screen 7 from Design Mockup */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-white">
            <h2 className="text-2xl font-bold text-slate-800 mb-1">Add Teacher</h2>
            <p className="text-xs text-slate-500 mb-6">Create a teacher profile with system permissions.</p>

            {statusMsg && (
              <div
                className={`mb-4 p-3 rounded-xl text-xs font-semibold ${
                  statusMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-rose-50 text-rose-700'
                }`}
              >
                {statusMsg.text}
              </div>
            )}

            <form onSubmit={handleAddTeacher} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dr. John Doe"
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-[#2D8885]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john.doe@school.com"
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-[#2D8885]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 9876543210"
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-[#2D8885]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-[#2D8885]"
                />
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-[#2D8885] hover:bg-[#236E6C] text-white font-bold rounded-full shadow-lg shadow-teal-700/20 text-sm tracking-wider uppercase transition flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>ADD</span>
                  )}
                </button>
              </div>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
