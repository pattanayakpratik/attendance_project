'use client';

import React, { useState } from 'react';
import { BarChart3, Download, Filter, TrendingUp, Users, ArrowDownRight } from 'lucide-react';

export default function ReportsPage() {
  const [selectedTab, setSelectedTab] = useState<'class' | 'student'>('class');

  // Stats matching Mockup Screen 6
  const classStats = [
    {
      title: 'Absent',
      percentage: 12,
      className: 'Class 10',
      code: '0407%',
      colorClass: 'bg-[#E06D53]',
      textClass: 'text-[#E06D53]',
      bgLightClass: 'bg-rose-50',
    },
    {
      title: 'Absent',
      percentage: 9,
      className: 'Class 11',
      code: '6001%',
      colorClass: 'bg-[#6366F1]',
      textClass: 'text-[#6366F1]',
      bgLightClass: 'bg-indigo-50',
    },
    {
      title: 'Class 12',
      percentage: 5,
      className: 'Class 12',
      code: '2071%',
      colorClass: 'bg-[#3B82F6]',
      textClass: 'text-[#3B82F6]',
      bgLightClass: 'bg-blue-50',
    },
  ];

  const studentStats = [
    { id: 101, name: 'Emma Johnson', class: 'Class 10', total: 24, present: 22, absent: 2, rate: '91.6%' },
    { id: 102, name: 'Robert Brown', class: 'Class 10', total: 24, present: 23, absent: 1, rate: '95.8%' },
    { id: 103, name: 'David Wilson', class: 'Class 10', total: 24, present: 20, absent: 4, rate: '83.3%' },
    { id: 104, name: 'Sarah Taylor', class: 'Class 10', total: 24, present: 24, absent: 0, rate: '100%' },
  ];

  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Student ID,Name,Class,Total Sessions,Present,Absent,Attendance Rate']
        .concat(
          studentStats.map(
            (s) => `${s.id},${s.name},${s.class},${s.total},${s.present},${s.absent},${s.rate}`
          )
        )
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `attendance_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F5F7F8] p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Attendance Stats</h1>
            <p className="text-sm text-slate-500 mt-1">
              Class absenteeism breakdown and student-wise attendance records
            </p>
          </div>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-5 py-3 bg-[#2D8885] hover:bg-[#236E6C] text-white font-bold text-sm rounded-2xl shadow-lg shadow-teal-700/10 transition"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Segmented Selector Tabs matching Mockup Screen 6 */}
        <div className="inline-flex items-center gap-2 p-1.5 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <button
            onClick={() => setSelectedTab('class')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              selectedTab === 'class'
                ? 'bg-[#2D8885] text-white shadow-md'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Class Wise
          </button>
          <button
            onClick={() => setSelectedTab('student')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              selectedTab === 'student'
                ? 'bg-[#2D8885] text-white shadow-md'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Student Wise
          </button>
        </div>

        {selectedTab === 'class' ? (
          /* Class Wise Progress Cards matching Mockup Screen 6 */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {classStats.map((item, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-slate-800">{item.title}</span>
                  <span className="text-xl font-black text-slate-800">{item.percentage} %</span>
                </div>

                {/* Progress Bar matching mockup */}
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.colorClass} rounded-full transition-all duration-500`}
                    style={{ width: `${item.percentage * 3}%` }}
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-semibold text-slate-500">{item.className}</span>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${item.bgLightClass} ${item.textClass}`}
                  >
                    {item.code}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Student Wise Table */
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-base">Student Attendance Register</h3>
              <p className="text-xs text-slate-400 mt-0.5">Cumulative attendance percentage for active term</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                    <th className="px-6 py-4">Student</th>
                    <th className="px-6 py-4">Class</th>
                    <th className="px-6 py-4">Total Sessions</th>
                    <th className="px-6 py-4">Present</th>
                    <th className="px-6 py-4">Absent</th>
                    <th className="px-6 py-4">Attendance Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {studentStats.map((st) => (
                    <tr key={st.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-6 py-4 font-bold text-slate-800 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#E7F3F2] text-[#2D8885] flex items-center justify-center font-bold text-xs">
                          {st.name[0]}
                        </div>
                        <div>
                          <div>{st.name}</div>
                          <div className="text-[11px] text-slate-400 font-normal">Roll: {st.id}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-600">{st.class}</td>
                      <td className="px-6 py-4 text-slate-600">{st.total}</td>
                      <td className="px-6 py-4 font-semibold text-emerald-600">{st.present}</td>
                      <td className="px-6 py-4 font-semibold text-[#E06D53]">{st.absent}</td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-black text-xs">
                          {st.rate}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
