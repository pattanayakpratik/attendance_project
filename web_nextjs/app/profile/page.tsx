'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, Phone, Lock, Moon, LogOut, Shield } from 'lucide-react';
import { getSavedUser, clearUser, UserSession } from '@/lib/api';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const saved = getSavedUser();
    if (!saved) {
      router.push('/login');
      return;
    }
    setUser(saved);
  }, [router]);

  const handleLogout = () => {
    clearUser();
    router.push('/login');
  };

  if (!user) return null;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F5F7F8] p-4 sm:p-6 lg:p-8 flex justify-center">
      <div className="w-full max-w-lg space-y-6">
        {/* Profile Card Header matching Screen 8 from Design Mockup */}
        <div className="bg-[#2D8885] rounded-3xl p-8 text-center text-white shadow-xl shadow-teal-900/10">
          <div className="w-24 h-24 mx-auto bg-white rounded-full p-1 shadow-md mb-4">
            <div className="w-full h-full rounded-full bg-[#E7F3F2] flex items-center justify-center text-[#2D8885] font-black text-3xl">
              {user.name ? user.name[0].toUpperCase() : 'U'}
            </div>
          </div>

          <h1 className="text-2xl font-black tracking-tight">{user.name}</h1>
          <div className="inline-block mt-1 px-3 py-0.5 rounded-full bg-white/20 text-xs font-semibold uppercase tracking-wider text-teal-100">
            {user.role} {user.class ? `• ${user.class}` : ''}
          </div>
        </div>

        {/* User Info Container Card matching Mockup */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-5">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email</div>
            <div className="text-sm font-bold text-slate-800 mt-1 flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#2D8885]" />
              <span>{user.email}</span>
            </div>
          </div>

          <hr className="border-slate-100" />

          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Phone</div>
            <div className="text-sm font-bold text-slate-800 mt-1 flex items-center gap-2">
              <Phone className="w-4 h-4 text-[#2D8885]" />
              <span>{user.phone || '+91 9876543210'}</span>
            </div>
          </div>

          <hr className="border-slate-100" />

          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Password</div>
            <div className="text-sm font-bold text-slate-800 mt-1 flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#2D8885]" />
              <span>••••••••••</span>
            </div>
          </div>
        </div>

        {/* Dark Mode Toggle Row matching Mockup Screen 8 */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-800">Dark Mode</div>
              <div className="text-xs text-slate-400">Toggle interface appearance</div>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isDarkMode}
              onChange={(e) => setIsDarkMode(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2D8885]"></div>
          </label>
        </div>

        {/* Coral Red Logout / Delete Action Button matching Mockup */}
        <button
          onClick={handleLogout}
          className="w-full py-4 bg-[#E06D53] hover:bg-[#d05c42] text-white font-bold rounded-2xl shadow-lg shadow-rose-900/10 text-sm tracking-wider uppercase transition flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
