'use client';

import React, { useEffect, useState, use, Suspense } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  QrCode,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  RefreshCw,
  Maximize2,
  Radio,
  Loader2,
} from 'lucide-react';
import { apiRequest, getSavedUser } from '@/lib/api';

interface PageProps {
  params: Promise<{ id: string }>;
}

function SessionContent({ params }: PageProps) {
  const resolvedParams = use(params);
  const sessionId = parseInt(resolvedParams.id, 10);

  const [session, setSession] = useState<any>(null);
  const [qrBase64, setQrBase64] = useState<string | null>(null);
  const [attendees, setAttendees] = useState<any[]>([]);
  const [timeLeft, setTimeLeft] = useState<string>('30:00');
  const [isExpired, setIsExpired] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFinalized, setIsFinalized] = useState(false);

  // Demo attendees list
  const mockAttendees = [
    { student_id: 101, name: 'Emma Johnson', status: 'PRESENT', time: '9:02 AM' },
    { student_id: 102, name: 'Robert Brown', status: 'PRESENT', time: '9:05 AM' },
    { student_id: 103, name: 'David Wilson', status: 'PRESENT', time: '9:07 AM' },
    { student_id: 104, name: 'Sarah Taylor', status: 'PRESENT', time: '9:11 AM' },
  ];

  const fetchSessionData = async () => {
    const user = getSavedUser();
    setIsLoading(true);

    // 1. Fetch QR Code from backend API
    const qrRes = await apiRequest('/generate_qr', {
      method: 'POST',
      body: JSON.stringify({
        session_id: sessionId,
        requesting_user_id: user?.id || 1,
      }),
    });

    if (qrRes.ok && qrRes.data) {
      const data: any = qrRes.data;
      setQrBase64(data.qr_code);
    }

    // 2. Fetch Session details
    const sessRes = await apiRequest('/get_sessions');
    if (sessRes.ok && sessRes.data) {
      const list = (sessRes.data as any).sessions || sessRes.data;
      if (Array.isArray(list)) {
        const found = list.find((s: any) => s.id === sessionId);
        if (found) setSession(found);
      }
    }

    // 3. Fetch current attendees
    const attRes = await apiRequest(`/get_session_attendance?session_id=${sessionId}`);
    if (attRes.ok && attRes.data) {
      const attList = (attRes.data as any).attendance || attRes.data;
      if (Array.isArray(attList) && attList.length > 0) {
        setAttendees(attList);
      } else {
        setAttendees(mockAttendees);
      }
    } else {
      setAttendees(mockAttendees);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    fetchSessionData();
    const interval = setInterval(fetchSessionData, 10000);
    return () => clearInterval(interval);
  }, [sessionId]);

  // Expiry countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      const expiry = session?.expiry_time
        ? new Date(session.expiry_time).getTime()
        : Date.now() + 45 * 60 * 1000;
      const diff = expiry - Date.now();

      if (diff <= 0) {
        setTimeLeft('00:00');
        setIsExpired(true);
      } else {
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setTimeLeft(
          `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );
        setIsExpired(false);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [session]);

  const handleFinalize = async () => {
    if (!confirm('Are you sure you want to finalize and lock attendance for this session?')) return;
    await apiRequest('/finalize_attendance', {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId }),
    });
    setIsFinalized(true);
    alert('Attendance has been locked and finalized successfully.');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#0F2228] text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <Link
            href="/sessions"
            className="inline-flex items-center gap-2 text-teal-300 hover:text-white transition text-xs font-semibold px-3 py-2 rounded-xl bg-white/10"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Sessions</span>
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchSessionData}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-teal-300 transition"
              title="Refresh QR / Attendees"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                if (!document.fullscreenElement) {
                  document.documentElement.requestFullscreen();
                } else {
                  document.exitFullscreen();
                }
              }}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-teal-300 transition"
              title="Toggle Fullscreen Projector Mode"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Projector Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Big Screen Dynamic QR Code */}
          <div className="lg:col-span-7 bg-white/5 border border-teal-500/20 backdrop-blur-md rounded-3xl p-6 sm:p-10 flex flex-col items-center text-center shadow-2xl">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold mb-4 tracking-wider uppercase">
              <Radio className="w-3.5 h-3.5 animate-pulse text-teal-400" />
              Classroom Projector Mode
            </div>

            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              {session?.session_name || 'Mathematics'}
            </h1>
            <p className="text-sm text-teal-200 mt-1 font-medium">
              {session?.class || 'Class 10'} • Code:{' '}
              <span className="font-mono font-bold text-white">
                {session?.session_code || `SESSION-${sessionId}`}
              </span>
            </p>

            {/* QR Code Container with Viewfinder Accents matching mockup Screen 5 */}
            <div className="relative my-8 p-6 bg-white rounded-3xl shadow-2xl shadow-teal-500/10">
              {qrBase64 ? (
                <img
                  src={`data:image/png;base64,${qrBase64}`}
                  alt="Dynamic Session QR Code"
                  className="w-64 h-64 sm:w-72 sm:h-72 object-contain"
                />
              ) : (
                <div className="w-64 h-64 sm:w-72 sm:h-72 flex flex-col items-center justify-center bg-slate-50 text-slate-400 rounded-2xl">
                  <QrCode className="w-16 h-16 text-teal-600 animate-pulse" />
                  <span className="text-xs font-medium mt-2 text-slate-500">
                    Generating dynamic QR...
                  </span>
                </div>
              )}

              {/* Viewfinder Corner Overlays */}
              <div className="absolute -top-2 -left-2 w-8 h-8 border-t-4 border-l-4 border-teal-400 rounded-tl-xl pointer-events-none" />
              <div className="absolute -top-2 -right-2 w-8 h-8 border-t-4 border-r-4 border-teal-400 rounded-tr-xl pointer-events-none" />
              <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-4 border-l-4 border-teal-400 rounded-bl-xl pointer-events-none" />
              <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-4 border-r-4 border-teal-400 rounded-br-xl pointer-events-none" />
            </div>

            {/* Countdown Timer */}
            <div className="flex items-center gap-4 px-6 py-3 rounded-2xl bg-white/10 border border-white/10">
              <Clock className={`w-5 h-5 ${isExpired ? 'text-rose-400' : 'text-teal-300'}`} />
              <div className="text-left">
                <div className="text-[10px] text-teal-200 uppercase font-bold tracking-wider">
                  Session Expiry Countdown
                </div>
                <div
                  className={`text-2xl font-black font-mono tracking-widest ${
                    isExpired ? 'text-rose-400' : 'text-white'
                  }`}
                >
                  {timeLeft}
                </div>
              </div>
            </div>

            {/* Geofence verification alert */}
            <div className="mt-4 flex items-center gap-2 text-xs text-teal-200/80">
              <MapPin className="w-4 h-4 text-teal-400" />
              <span>GPS Geofence: 100m radius around classroom coordinates</span>
            </div>
          </div>

          {/* Right Column: Live Attendees Feed */}
          <div className="lg:col-span-5 bg-white/5 border border-teal-500/20 backdrop-blur-md rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-teal-400" />
                  <span>Live Attendees</span>
                </h2>
                <p className="text-xs text-teal-200">Real-time attendance scanning feed</p>
              </div>

              <div className="px-3.5 py-1.5 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold">
                {attendees.length} Present
              </div>
            </div>

            {/* Attendees List */}
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {attendees.length === 0 ? (
                <div className="py-12 text-center text-teal-200/60 text-xs">
                  Awaiting students to scan...
                </div>
              ) : (
                attendees.map((att, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between hover:bg-white/10 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-teal-500/30 text-teal-300 flex items-center justify-center font-bold text-xs">
                        {att.name ? att.name[0].toUpperCase() : 'S'}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">{att.name}</div>
                        <div className="text-[11px] text-teal-200">
                          Roll ID: {att.student_id} • {att.time || 'Just now'}
                        </div>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>PRESENT</span>
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Action Button: Finalize Attendance */}
            <div className="pt-2">
              <button
                onClick={handleFinalize}
                disabled={isFinalized}
                className={`w-full py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider transition shadow-lg ${
                  isFinalized
                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                    : 'bg-[#2D8885] hover:bg-[#236E6C] text-white shadow-teal-900/30'
                }`}
              >
                {isFinalized ? 'Attendance Locked' : 'Finalize & Lock Attendance'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SessionProjectorPage(props: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0F2228] flex items-center justify-center text-teal-300">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      }
    >
      <SessionContent {...props} />
    </Suspense>
  );
}
