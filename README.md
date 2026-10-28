# 📍 Smart Campus & Multi-Tenant Attendance Platform

[![Next.js](https://img.shields.io/badge/Next.js-16.0-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Flutter](https://img.shields.io/badge/Flutter-3.x-02569B?style=for-the-badge&logo=flutter)](https://flutter.dev/)
[![Flask](https://img.shields.io/badge/Flask-3.x-000000?style=for-the-badge&logo=flask)](https://flask.palletsprojects.com/)
[![Supabase PostgreSQL](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-teal.svg?style=for-the-badge)](LICENSE)

An enterprise-ready, cross-platform institutional attendance and timetable management ecosystem. Engineered with **Dynamic QR Code Projection**, **GPS Geofencing radius verification**, a **Fixed Weekly Timetable Matrix** with recess and lunch breaks, and **Multi-Tenant Campus Isolation** supporting Colleges, K-12 Schools, and Private Tuitions/Bootcamps.

---

## 🌟 Key Features

```
                          ┌─────────────────────────────────────┐
                          │   Smart Campus Attendance Platform  │
                          └──────────────────┬──────────────────┘
                                             │
             ┌───────────────────────────────┼───────────────────────────────┐
             ▼                               ▼                               ▼
   ┌───────────────────┐           ┌───────────────────┐           ┌───────────────────┐
   │ Next.js Web App   │           │ Flutter Mobile    │           │ Python Flask API  │
   │   (web_nextjs)    │           │ (mobile_flutter)  │           │  (backend_flask)  │
   └─────────┬─────────┘           └─────────┬─────────┘           └─────────┬─────────┘
             │                               │                               │
    • Dynamic QR Projector          • Live Camera QR Scanner        • Supabase PostgreSQL
    • Weekly Timetable Matrix       • Device GPS Geovalidation      • Multi-Tenant Isolation
    • Student Progression Hub       • Instant Check-In Feedback     • Session Lifecycle Tracker
    • Master Platform Portal        • Synced Dark / Light Theme     • Resilient DB Failover
```

### 1. 🛡️ Dynamic QR Code & GPS Geofencing (Zero Proxy / Buddy Punching)
* **Classroom Projector Mode**: Teachers can project a live, auto-refreshing dynamic QR code on the classroom projector with an interactive countdown timer.
* **Double-Layered Verification**: Attendance is only recorded if the student physically scans the QR code while within the configured **GPS radius** (e.g., 100 meters) of the session coordinates.
* **Exact Session Timestamps**: Tracks exact session start and end timestamps, calculated duration, and supports manual early completion.

### 2. 📅 Academic & Class Timetable Matrix (Fixed Weekly Indian Format)
* **Weekly Schedule Grid**: Built specifically around the authentic Indian institutional schedule (Monday to Saturday) that stays fixed across the academic year or semester.
* **Recess & Lunch Break Bands**: Full-width spanning horizontal rows for **Short Break / Recess** (11:00 AM) and **Lunch Break** (01:15 PM).
* **Role-Adaptive Access**:
  * **Students**: Strictly view their class's weekly matrix (e.g. `2026-2030 CSE Batch - Sem 2` or `Class 10-A`) with assigned faculty, room numbers, and a live `🔴 LIVE NOW` period indicator.
  * **Teachers**: View their assigned teaching matrix with a 1-click **"Launch Attendance"** button that auto-populates the QR creator.
  * **Admins**: Manage master institutional schedules with cohort and faculty filter dropdowns.
* **Print & Notice Board Ready**: Built-in 1-click print styling for physical timetable display.

### 3. 🏢 Multi-Tenant Institutional Hierarchy & Onboarding
* **Multi-Campus Isolation**: Complete data scoping by `institute_id` across databases, sessions, timetables, and rosters.
* **3-Tier Hierarchy**:
  1. **👑 Platform Master Admin (`SUPERADMIN`)**: Oversees global KPIs, total campuses, staff/student directories, and provisions new institutions via `/master`.
  2. **🏫 Campus Administrators (`ADMIN`)**: Manages faculty accounts, student cohorts, daily timetables, and exports reports.
  3. **👨‍🏫 Faculty / Teachers (`TEACHER`)**: Launches attendance sessions, projects QR codes, and tracks class check-ins.
  4. **🎓 Students (`STUDENT`)**: Scans attendance via mobile, checks timetables, and tracks personal attendance percentages.

### 4. 📈 Multi-Sector Progression & Cohort History
* **Higher Education / Colleges**: Graduating batch progression (e.g. `2026-2030 CSE Batch` transitioning from `Sem 1` to `Sem 2`).
* **K-12 Schools**: Annual grade promotions (e.g. `Class 10-A (2026-2027)` transitioning to `Class 11-A`).
* **Private Tuitions & Bootcamps**: Modular phase progressions (e.g. `Full Stack Python - Phase 1` transitioning to `Phase 2`).
* **Immutable Audit Trail**: Historical attendance remains permanent in `student_class_history` even after student graduation or status updates (`ACTIVE` vs `LEFT`).

---

## 🛠️ Technology Stack

| Layer | Technology | Description |
|---|---|---|
| **Web Portal** | **Next.js 16 (React 19)** | Server and Client components, Tailwind CSS, Lucide icons, Dark/Light Theme Provider |
| **Mobile App** | **Flutter 3.x (Dart)** | Cross-platform (Android & iOS), Mobile Scanner, Geolocator GPS, Storage Services |
| **Backend API** | **Python Flask 3.x** | RESTful API, PyJWT token authentication, Geopy coordinates distance calculation |
| **Primary Database** | **Supabase PostgreSQL** | Cloud PostgreSQL with pooled connection, automatic schema migration, and transparent wrappers |
| **Fallback Database** | **TiDB Serverless / SQLite** | High-availability fallback with auto-reconnecting adapter for zero-config offline runs |
| **Tunnels** | **Cloudflare Tunnel** | Instant secure HTTPS public endpoints (`https://xxx.trycloudflare.com`) for remote testing |

---

## 📂 Repository Structure

```
attendance_project/
├── backend_flask/              # Python Flask REST API & DB Adapter
│   ├── app.py                  # Core routes (Timetable, Sessions, Attendance, Auth)
│   ├── auth.py                 # JWT token generation, verification & RBAC decorators
│   ├── db_adapter.py           # Resilient multi-engine database connection wrapper
│   ├── migrate_multi_institute.py # Multi-tenant database migration scripts
│   └── setup_supabase.py       # Supabase PostgreSQL initialization script
├── web_nextjs/                 # Next.js 16 Web Dashboard
│   ├── app/
│   │   ├── dashboard/          # Analytics & quick navigation hub
│   │   ├── timetable/          # Weekly Fixed Timetable Matrix & schedule builder
│   │   ├── sessions/           # Live QR code projector & session manager
│   │   ├── students/           # Student directory & batch promotion engine
│   │   ├── teachers/           # Faculty management & assignment roster
│   │   ├── reports/            # Attendance metrics, charts & CSV export
│   │   ├── master/             # Platform Master Owner multi-institute portal
│   │   └── login/              # Unified role authentication
│   └── components/
│       └── Navbar.tsx          # Dynamic role-adaptive navigation header
├── mobile_flutter/             # Flutter Mobile Application
│   └── lib/
│       ├── screens/            # QR Scanner, Dashboard, Profile, Sessions
│       ├── services/           # ApiService, LocationService, StorageService
│       └── theme/              # Synced teal/emerald dark & light theme controller
├── LICENSE                     # MIT License
└── README.md                   # Platform documentation
```

---

## 🚀 Quick Start Guide

### 1. Backend API (`backend_flask`)

1. Navigate to the backend directory:
   ```bash
   cd backend_flask
   ```
2. Activate virtual environment and install dependencies:
   ```bash
   # Windows
   .venv\Scripts\activate
   pip install -r requirements.txt
   ```
3. Configure environment variables in `backend_flask/.env`:
   ```env
   DB_ENGINE=postgres
   PG_HOST=aws-0-eu-north-1.pooler.supabase.com
   PG_PORT=5432
   PG_USER=postgres.your_project_ref
   PG_PASSWORD=your_password
   PG_DATABASE=postgres
   PG_SSLMODE=require
   PORT=5000
   SECRET_KEY=your_secret_key
   ```
4. Start the server:
   ```bash
   python app.py
   # Or run with free Cloudflare tunnel:
   python tunnel.py
   ```

---

### 2. Next.js Web Dashboard (`web_nextjs`)

1. Navigate to the web directory:
   ```bash
   cd web_nextjs
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure `web_nextjs/.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://127.0.0.1:5000
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

### 3. Flutter Mobile App (`mobile_flutter`)

1. Navigate to the mobile directory:
   ```bash
   cd mobile_flutter
   ```
2. Fetch Flutter packages:
   ```bash
   flutter pub get
   ```
3. Run on connected Android / iOS device or emulator:
   ```bash
   flutter run
   ```
4. On the mobile login screen, tap ⚙️ **Settings** to point the API base URL to your backend or tunnel.

---

## 🔑 Default Accounts (Demo & Testing)

| Role | Email / ID | Password | Scope & Privileges |
|---|---|---|---|
| **👑 Master Owner** | `owner@attendance.system` | `Master@2026` | Global multi-campus KPIs, cross-institute directory |
| **🏫 Campus Admin** | `admin@school.com` | `123456` | Institute management, cohort promotions, master timetable |
| **👨‍🏫 Faculty / Teacher** | `teacher@school.com` | `123456` | Launches QR sessions, views assigned weekly schedule |
| **🎓 Student** | `301` or `aarav@school.com` | `123456` | Scans QR attendance, views enrolled class timetable |

---

## 📄 License

This project is open-source and distributed under the **[MIT License](LICENSE)**.

Copyright © 2026 [Pratik Pattanayak](https://github.com/pattanayakpratik). All rights reserved.
