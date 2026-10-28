'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  QrCode,
  Plus,
  Clock,
  MapPin,
  Filter,
  ArrowRight,
  Loader2,
  Calendar,
  Radio,
  CheckCircle2,
  AlertCircle,
  Square,
  PlayCircle,
  Timer
} from 'lucide-react';
import { apiRequest, getSavedUser } from '@/lib/api';

interface Session {
  id: number;
  session_name: string;
  session_code: string;
  class: string;
  expiry_time: string;
  start_time?: string;
  end_time?: string;
  created_at?: string;
  duration_minutes?: number;
  status?: 'ACTIVE' | 'EXPIRED' | 'COMPLETED' | string;
  created_by?: number;
  created_by_name?: string;
  latitude?: number;
  longitude?: number;
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterText, setFilterText] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [endingSessionId, setEndingSessionId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form states matching Mockup Screen 4 & 5
  const [newSessionName, setNewSessionName] = useState('');
  const [newClass, setNewClass] = useState('2026-2030 CSE Batch - Sem 2');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [startNow, setStartNow] = useState(true);
  const [customStartTime, setCustomStartTime] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [detectingGps, setDetectingGps] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock sessions fallback
  const mockSessions: Session[] = [
    {
      id: 1,
      session_name: 'Advanced AI & Machine Learning',
      session_code: 'SESSION_AI_9901',
      class: '2026-2030 CSE Batch - Sem 2',
      start_time: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      end_time: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
      expiry_time: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
      duration_minutes: 60,
      status: 'ACTIVE',
      created_by_name: 'Dr. John Doe',
      latitude: 28.6139,
      longitude: 77.2090,
    },
    {
      id: 2,
      session_name: 'Data Structures & Algorithms',
      session_code: 'SESSION_DSA_4492',
      class: 'Class 10-A (2026-2027)',
      start_time: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
      end_time: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      expiry_time: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      duration_minutes: 60,
      status: 'COMPLETED',
      created_by_name: 'Dr. Katherine Bell',
      latitude: 28.6139,
      longitude: 77.2090,
    },
  ];

  const fetchSessions = async () => {
    setIsLoading(true);
    const res = await apiRequest('/get_sessions');
    if (res.ok && res.data) {
      const list = (res.data as any).sessions || res.data;
      if (Array.isArray(list) && list.length > 0) {
        setSessions(list);
        setFilteredSessions(list);
      } else {
        setSessions(mockSessions);
        setFilteredSessions(mockSessions);
      }
    } else {
      setSessions(mockSessions);
      setFilteredSessions(mockSessions);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    setCurrentTime(Date.now());
    fetchSessions();
  }, []);

  useEffect(() => {
    const q = filterText.toLowerCase();
    setFilteredSessions(
      sessions.filter(
        (s) =>
          s.session_name.toLowerCase().includes(q) ||
          s.class.toLowerCase().includes(q) ||
          s.session_code.toLowerCase().includes(q)
      )
    );
  }, [filterText, sessions]);

  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    setDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toFixed(6));
        setLongitude(pos.coords.longitude.toFixed(6));
        setDetectingGps(false);
      },
      (err) => {
        alert('Could not retrieve GPS coordinates: ' + err.message);
        setDetectingGps(false);
      },
      { enableHighAccuracy: true }
    );
  };

  // Create Session
  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!latitude || !longitude || isNaN(parseFloat(latitude)) || isNaN(parseFloat(longitude))) {
      alert('Please enter valid Latitude & Longitude coordinates or click "Auto-Detect Current GPS".');
      return;
    }
    const user = getSavedUser();
    setIsSubmitting(true);

    const now = new Date();
    const startDate = startNow || !customStartTime ? now : new Date(customStartTime);
    const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

    const formatDt = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(
        d.getHours()
      ).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;

    const startFormatted = formatDt(startDate);
    const endFormatted = formatDt(endDate);

    const res = await apiRequest('/add_session', {
      method: 'POST',
      body: JSON.stringify({
        session_name: newSessionName.trim(),
        class: newClass.trim(),
        start_time: startFormatted,
        end_time: endFormatted,
        expiry_time: endFormatted,
        duration: durationMinutes,
        requesting_user_id: user?.id || 1,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
      }),
    });

    setIsSubmitting(false);

    if (res.ok) {
      fetchSessions();
      setShowCreateModal(false);
      setNewSessionName('');
      setToastMessage(`Session "${newSessionName}" started! Active until ${endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
      setTimeout(() => setToastMessage(null), 5000);
    } else {
      // Local fallback
      const newSess: Session = {
        id: Date.now(),
        session_name: newSessionName,
        session_code: `SESSION_${Date.now().toString(16).slice(-8).toUpperCase()}`,
        class: newClass,
        start_time: startFormatted,
        end_time: endFormatted,
        expiry_time: endFormatted,
        duration_minutes: durationMinutes,
        status: 'ACTIVE',
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
      };
      setSessions((prev) => [newSess, ...prev]);
      setShowCreateModal(false);
    }
  };

  // Manually End / Close Session Early
  const handleEndSessionEarly = async (sess: Session) => {
    if (!window.confirm(`Finalize and end session "${sess.session_name}" now? This will lock attendance and record the final end timestamp.`)) {
      return;
    }

    setEndingSessionId(sess.id);
    const res = await apiRequest('/end_session', {
      method: 'POST',
      body: JSON.stringify({ session_id: sess.id }),
    });
    setEndingSessionId(null);

    if (res.ok) {
      setToastMessage(`Session "${sess.session_name}" ended. Final attendance locked.`);
      setTimeout(() => setToastMessage(null), 4000);
      fetchSessions();
    } else {
      setSessions((prev) =>
        prev.map((s) => (s.id === sess.id ? { ...s, status: 'COMPLETED' } : s))
      );
      setToastMessage(`Session ended (offline mode).`);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const formatDateTime = (val?: string) => {
    if (!val) return '—';
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return val;
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return val;
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F5F7F8] dark:bg-[#0B1619] p-4 sm:p-6 lg:p-8 transition-colors duration-200">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Toast Notification */}
        {toastMessage && (
          <div className="p-3 bg-teal-50 dark:bg-teal-950/80 border border-teal-200 dark:border-teal-800 text-[#2D8885] dark:text-teal-300 text-xs font-semibold rounded-2xl flex items-center gap-2 shadow-sm animate-fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
              Class Attendance Sessions
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Live attendance sessions tracking start time, end time, duration, and GPS coordinates.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-5 py-3 bg-[#2D8885] dark:bg-teal-600 hover:bg-[#236E6C] dark:hover:bg-teal-500 text-white font-bold text-sm rounded-2xl shadow-lg shadow-teal-700/10 transition transform hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5" />
            <span>Start New Session</span>
          </button>
        </div>

        {/* Filter Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
            <Filter className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Filter sessions by subject name, class/batch, or session code..."
            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-[#132429] border border-slate-200/80 dark:border-[#1E373E] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-2xl text-xs sm:text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2D8885]/30 focus:border-[#2D8885] transition"
          />
        </div>

        {/* Sessions list */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="py-20 text-center">
              <Loader2 className="w-8 h-8 text-[#2D8885] dark:text-teal-400 animate-spin mx-auto" />
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 font-medium">Loading session logs...</p>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="bg-white dark:bg-[#132429] rounded-3xl p-12 text-center border border-slate-200 dark:border-[#1E373E]">
              <QrCode className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400 font-medium">No sessions found matching your filter</p>
            </div>
          ) : (
            filteredSessions.map((session) => {
              const status = (session.status || 'ACTIVE').toUpperCase();
              const isLive = status === 'ACTIVE';
              const isCompleted = status === 'COMPLETED';
              const isEnding = endingSessionId === session.id;

              return (
                <div
                  key={session.id}
                  className="bg-white dark:bg-[#132429] p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-[#1E373E] shadow-sm hover:shadow-md hover:border-teal-300 dark:hover:border-teal-500/50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-2">
                    {/* Title and Badges */}
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{session.session_name}</h3>
                      
                      {/* Status Badge */}
                      {isLive ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5 animate-pulse">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span>Live Session</span>
                        </span>
                      ) : isCompleted ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          Finalized / Ended
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500">
                          Expired
                        </span>
                      )}

                      {/* Duration Tag */}
                      {session.duration_minutes && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center gap-1">
                          <Timer className="w-3 h-3 text-[#2D8885]" />
                          <span>{session.duration_minutes} Mins</span>
                        </span>
                      )}
                    </div>

                    {/* Metadata & Timestamps Row */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                      {/* Class */}
                      <span className="text-[#2D8885] dark:text-teal-400 font-bold">{session.class}</span>
                      <span>•</span>

                      {/* Start Timestamp */}
                      <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-semibold" title="Session Start Time">
                        <Clock className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Started: {formatDateTime(session.start_time || session.created_at)}</span>
                      </span>
                      <span>•</span>

                      {/* End Timestamp */}
                      <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-semibold" title="Session End / Expiry Time">
                        <Clock className="w-3.5 h-3.5 text-rose-500" />
                        <span>Ended: {formatDateTime(session.end_time || session.expiry_time)}</span>
                      </span>

                      {/* GPS */}
                      {session.latitude && session.longitude && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-slate-400 dark:text-slate-500">
                            <MapPin className="w-3.5 h-3.5" />
                            GPS: {session.latitude.toString().slice(0, 7)}, {session.longitude.toString().slice(0, 7)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2.5 justify-end">
                    {/* If Live: Show End Session Early */}
                    {isLive && (
                      <button
                        type="button"
                        disabled={isEnding}
                        onClick={() => handleEndSessionEarly(session)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 transition"
                        title="End session early to finalize attendance immediately"
                      >
                        {isEnding ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Square className="w-3.5 h-3.5" />
                        )}
                        <span>End Session</span>
                      </button>
                    )}

                    {/* Project Dynamic QR */}
                    <Link
                      href={`/sessions/${session.id}`}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2D8885] dark:bg-teal-600 hover:bg-[#236E6C] dark:hover:bg-teal-500 text-white font-bold text-xs shadow-md transition"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>{isLive ? 'Project QR' : 'View Attendance'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ----------------- CREATE SESSION MODAL ----------------- */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#132429] rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-white dark:border-[#1E373E] transition-colors">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-1">Start New Attendance Session</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
              Generates a dynamic QR code bound to your classroom GPS location and records exact start/end timestamps.
            </p>

            <form onSubmit={handleCreateSession} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Subject / Lecture Name *
                </label>
                <input
                  type="text"
                  value={newSessionName}
                  onChange={(e) => setNewSessionName(e.target.value)}
                  placeholder="e.g. Data Structures & Algorithms"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#1A3138] border border-slate-200 dark:border-[#22424B] rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#2D8885]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Class / Cohort / Batch *
                  </label>
                  <input
                    type="text"
                    value={newClass}
                    onChange={(e) => setNewClass(e.target.value)}
                    placeholder="e.g. 2026-2030 CSE Batch - Sem 2"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#1A3138] border border-slate-200 dark:border-[#22424B] rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#2D8885]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Session Duration *
                  </label>
                  <select
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#1A3138] border border-slate-200 dark:border-[#22424B] rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#2D8885]"
                  >
                    <option value={30}>30 Minutes</option>
                    <option value={45}>45 Minutes (Standard)</option>
                    <option value={60}>60 Minutes (1 Hour)</option>
                    <option value={90}>90 Minutes (1.5 Hours)</option>
                    <option value={120}>120 Minutes (2 Hours Lab)</option>
                  </select>
                </div>
              </div>

              {/* Start Timestamp Control */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#0E1E22] border border-slate-200/80 dark:border-[#1E373E]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Start Time:</span>
                  </span>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={startNow}
                      onChange={(e) => setStartNow(e.target.checked)}
                      className="rounded text-[#2D8885] focus:ring-[#2D8885]"
                    />
                    <span>Start Live Right Now</span>
                  </label>
                </div>
                {!startNow && (
                  <div className="mt-2">
                    <input
                      type="datetime-local"
                      value={customStartTime}
                      onChange={(e) => setCustomStartTime(e.target.value)}
                      required={!startNow}
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-[#132429] border border-slate-200 dark:border-[#22424B]"
                    />
                  </div>
                )}
              </div>

              {/* GPS Geofence */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    Geofence GPS Coordinates *
                  </label>
                  <button
                    type="button"
                    onClick={handleDetectGPS}
                    className="text-[11px] text-[#2D8885] dark:text-teal-400 hover:underline font-bold flex items-center gap-1"
                  >
                    <Radio className="w-3 h-3 animate-pulse" />
                    <span>{detectingGps ? 'Detecting...' : 'Auto-Detect Current GPS'}</span>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    placeholder="Latitude (e.g. 28.6139)"
                    required
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#1A3138] border border-slate-200 dark:border-[#22424B] rounded-xl text-xs font-mono text-slate-900 dark:text-slate-100"
                  />
                  <input
                    type="text"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    placeholder="Longitude (e.g. 77.2090)"
                    required
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#1A3138] border border-slate-200 dark:border-[#22424B] rounded-xl text-xs font-mono text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#22424B] text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-[#2D8885] dark:bg-teal-600 hover:bg-[#236E6C] dark:hover:bg-teal-500 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Creating Session...</span>
                    </>
                  ) : (
                    <>
                      <PlayCircle className="w-3.5 h-3.5" />
                      <span>Launch Live Session</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}