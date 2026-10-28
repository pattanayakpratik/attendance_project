'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  QrCode,
  LayoutDashboard,
  Users,
  GraduationCap,
  BarChart3,
  User,
  LogOut,
  Sun,
  Moon,
} from 'lucide-react';
import { getSavedUser, clearUser, UserSession } from '@/lib/api';
import { useTheme } from '@/context/ThemeContext';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);
  const { theme, isDark, toggleTheme } = useTheme();

  useEffect(() => {
    setUser(getSavedUser());
  }, [pathname]);

  if (pathname === '/login') {
    return null;
  }

  const handleLogout = () => {
    clearUser();
    router.push('/login');
  };

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/sessions', label: 'Sessions & QR', icon: QrCode },
    { href: '/students', label: 'Students', icon: GraduationCap },
    { href: '/teachers', label: 'Teachers', icon: Users },
    { href: '/reports', label: 'Reports', icon: BarChart3 },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#2D8885] dark:bg-[#0D2024] text-white shadow-md border-b border-teal-700/30 dark:border-teal-900/40 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 dark:bg-teal-500/20 flex items-center justify-center backdrop-blur-sm border border-white/10 dark:border-teal-500/30">
              <QrCode className="w-6 h-6 text-white dark:text-teal-300" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight block leading-tight">
                Attendance<span className="text-teal-200 dark:text-teal-400">Pro</span>
              </span>
              <span className="text-[11px] text-teal-100 dark:text-teal-300/80 font-medium tracking-wider uppercase">
                Location & QR Portal
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-white dark:bg-[#163038] text-[#2D8885] dark:text-teal-300 shadow-sm font-semibold border border-transparent dark:border-teal-700/50'
                      : 'text-white/90 dark:text-slate-300 hover:bg-white/10 dark:hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* User Info & Actions */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Theme Toggle Button in Navbar */}
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/15 dark:bg-slate-800/80 hover:bg-white/25 dark:hover:bg-slate-700/80 text-white dark:text-teal-300 border border-white/15 dark:border-slate-700 transition transform active:scale-95 shadow-sm"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle Theme"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-300 animate-spin-slow" />
              ) : (
                <Moon className="w-4 h-4 text-teal-100" />
              )}
            </button>

            {user ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <Link
                  href="/profile"
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/15 dark:bg-white/10 hover:bg-white/25 dark:hover:bg-white/15 transition text-sm border border-white/10"
                >
                  <div className="w-7 h-7 rounded-full bg-white dark:bg-teal-500 text-[#2D8885] dark:text-[#0D2024] flex items-center justify-center font-bold text-xs">
                    {user.name ? user.name[0].toUpperCase() : 'U'}
                  </div>
                  <div className="hidden sm:block text-left leading-tight">
                    <div className="font-semibold text-xs text-white">{user.name}</div>
                    <div className="text-[10px] text-teal-200 dark:text-teal-400">
                      {user.role} {user.institute_name ? `• ${user.institute_name}` : ''}
                    </div>
                  </div>
                </Link>

                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl bg-white/10 dark:bg-slate-800/60 hover:bg-rose-500/80 text-white transition border border-white/10"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 rounded-xl bg-white dark:bg-teal-500 text-[#2D8885] dark:text-[#0D2024] text-sm font-bold shadow hover:bg-teal-50 dark:hover:bg-teal-400 transition"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
