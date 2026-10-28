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
} from 'lucide-react';
import { apiRequest, getSavedUser } from '@/lib/api';

interface Session {
  id: number;
  session_name: string;
  session_code: string;
  class: string;
  expiry_time: string;
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

  // Form states matching Mockup Screen 4 & 5
  const [newSessionName, setNewSessionName] = useState('');
  const [newClass, setNewClass] = useState('Class 10');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [latitude, setLatitude] = useState('20.296100');
  const [longitude, setLongitude] = useState('85.824500');
  const [detectingGps, setDetectingGps] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Seed data matching Screen 4 of Design Mockup
  const mockSessions: Session[] = [
    {
      id: 1,
      session_name: 'Mathematics',
      session_code: 'MATH-10-8801',
      class: 'Class 10',
      expiry_time: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
      created_by_name: 'Dr. John Doe',
      latitude: 20.2961,
      longitude: 85.8245,
    },
    {
      id: 2,
      session_name: 'Physics',
      session_code: 'PHYS-10-4492',
      class: 'Class 10',
      expiry_time: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      created_by_name: 'Dr. Katherine Bell',
      latitude: 20.2961,
      longitude: 85.8245,
    },
    {
      id: 3,
      session_name: 'Chemistry Lab',
      session_code: 'CHEM-11-2099',
      class: 'Class 11',
      expiry_time: new Date(Date.now() + 90 * 60 * 1000).toISOString(),
      created_by_name: 'Prof. Marcus',
      latitude: 20.2961,
      longitude: 85.8245,
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

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = getSavedUser();
    setIsSubmitting(true);

    const res = await apiRequest('/add_session', {
      method: 'POST',
      body: JSON.stringify({
        session_name: newSessionName,
        class: newClass,
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
    } else {
      // Offline fallback: prepend newly created session locally
      const newSess: Session = {
        id: Date.now(),
        session_name: newSessionName,
        session_code: `${newSessionName.slice(0, 4).toUpperCase()}-${Date.now().toString().slice(-4)}`,
        class: newClass,
        expiry_time: new Date(Date.now() + durationMinutes * 60 * 1000).toISOString(),
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
      };
      setSessions((prev) => [newSess, ...prev]);
      setShowCreateModal(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F5F7F8] dark:bg-[#0B1619] p-4 sm:p-6 lg:p-8 transition-colors duration-200">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Sessions</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Active classroom attendance sessions and live QR code projectors
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-5 py-3 bg-[#2D8885] dark:bg-teal-600 hover:bg-[#236E6C] dark:hover:bg-teal-500 text-white font-bold text-sm rounded-2xl shadow-lg shadow-teal-700/10 transition"
          >
            <Plus className="w-5 h-5" />
            <span>Create Session</span>
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
            placeholder="Filter sessions by name, class, or code..."
            className="w-full pl-11 pr-4 py-3.5 bg-white dark:bg-[#132429] border border-slate-200/80 dark:border-[#1E373E] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-2xl text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2D8885]/30 focus:border-[#2D8885] dark:focus:border-teal-400 transition"
          />
        </div>

        {/* Sessions list */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="py-20 text-center">
              <Loader2 className="w-8 h-8 text-[#2D8885] dark:text-teal-400 animate-spin mx-auto" />
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 font-medium">Loading sessions...</p>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="bg-white dark:bg-[#132429] rounded-3xl p-12 text-center border border-slate-200 dark:border-[#1E373E]">
              <QrCode className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400 font-medium">No sessions found matching your filter</p>
            </div>
          ) : (
            filteredSessions.map((session) => {
              const isOpen = currentTime > 0
                ? new Date(session.expiry_time).getTime() > currentTime
                : true;

              return (
                <div
                  key={session.id}
                  className="bg-white dark:bg-[#132429] p-6 rounded-3xl border border-slate-200/80 dark:border-[#1E373E] shadow-sm hover:shadow-md hover:border-teal-300 dark:hover:border-teal-500/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{session.session_name}</h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          isOpen
                            ? 'bg-[#E7F3F2] dark:bg-teal-950/80 text-[#2D8885] dark:text-teal-300'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                        }`}
                      >
                        {isOpen ? 'Open' : 'Finished'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 font-medium">
                      <span className="text-[#2D8885] dark:text-teal-400 font-bold">{session.class}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                        {new Date(session.expiry_time).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {session.latitude && session.longitude && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-slate-400 dark:text-slate-500">
                            <MapPin className="w-3.5 h-3.5" />
                            GPS: {session.latitude.toString().slice(0, 7)},{' '}
                            {session.longitude.toString().slice(0, 7)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Link
                      href={`/sessions/${session.id}`}
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-teal-50 dark:bg-teal-950/60 hover:bg-[#2D8885] dark:hover:bg-teal-600 hover:text-white text-[#2D8885] dark:text-teal-300 font-bold text-xs transition duration-200 border border-teal-200/50 dark:border-teal-800/40"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>Project QR</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Create Session Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#132429] rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-white dark:border-[#1E373E] transition-colors duration-200">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-1">Create New Attendance Session</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Generate a dynamic QR code bound to your classroom GPS location.
            </p>

            <form onSubmit={handleCreateSession} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Subject / Session Name</label>
                <input
                  type="text"
                  value={newSessionName}
                  onChange={(e) => setNewSessionName(e.target.value)}
                  placeholder="e.g. Mathematics"
                  required
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-[#1A3138] border border-slate-200 dark:border-[#22424B] rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-[#2D8885] dark:focus:border-teal-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Class</label>
                  <input
                    type="text"
                    value={newClass}
                    onChange={(e) => setNewClass(e.target.value)}
                    placeholder="e.g. Class 10"
                    required
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-[#1A3138] border border-slate-200 dark:border-[#22424B] rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-[#2D8885] dark:focus:border-teal-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Duration (Minutes)</label>
                  <input
                    type="number"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 30)}
                    min={5}
                    max={360}
                    required
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-[#1A3138] border border-slate-200 dark:border-[#22424B] rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#2D8885] dark:focus:border-teal-400"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Geofence Location (GPS)</label>
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
                    placeholder="Latitude"
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#1A3138] border border-slate-200 dark:border-[#22424B] rounded-xl text-xs font-mono text-slate-900 dark:text-slate-100"
                  />
                  <input
                    type="text"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    placeholder="Longitude"
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#1A3138] border border-slate-200 dark:border-[#22424B] rounded-xl text-xs font-mono text-slate-900 dark:text-slate-100"
                  />
                </div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Students must be within 100 meters to be marked PRESENT.</p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-[#22424B] text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-[#2D8885] dark:bg-teal-600 hover:bg-[#236E6C] dark:hover:bg-teal-500 text-white text-xs font-bold rounded-xl shadow transition flex items-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save & Start</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
