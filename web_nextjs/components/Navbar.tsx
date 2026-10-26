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
  CalendarDays,
} from 'lucide-react';
import { getSavedUser, clearUser, UserSession } from '@/lib/api';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);

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
    <header className="sticky top-0 z-50 bg-[#2D8885] text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <QrCode className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight block leading-tight">
                Attendance<span className="text-teal-200">Pro</span>
              </span>
              <span className="text-[11px] text-teal-100 font-medium tracking-wider uppercase">
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
                      ? 'bg-white text-[#2D8885] shadow-sm font-semibold'
                      : 'text-white/90 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* User Info & Actions */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/profile"
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 transition text-sm"
                >
                  <div className="w-7 h-7 rounded-full bg-white text-[#2D8885] flex items-center justify-center font-bold text-xs">
                    {user.name ? user.name[0].toUpperCase() : 'U'}
                  </div>
                  <div className="hidden sm:block text-left leading-tight">
                    <div className="font-semibold text-xs text-white">{user.name}</div>
                    <div className="text-[10px] text-teal-200">{user.role}</div>
                  </div>
                </Link>

                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl bg-white/10 hover:bg-rose-500/80 text-white transition"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 rounded-xl bg-white text-[#2D8885] text-sm font-bold shadow hover:bg-teal-50 transition"
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
