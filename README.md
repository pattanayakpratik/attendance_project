# 📍 Smart Campus Attendance System (QR & Geolocation)

A modern, cross-platform attendance management system powered by **Next.js 16**, **Flutter**, **Flask**, and **Cloudflare Tunnels**. Built with real-time dynamic QR code projection and GPS geofence radius verification.

---

## 🎨 UI & Architecture Overview

* **Web Dashboard (`web_nextjs`)**:
  * **Login**: Admin, Teacher, and Student role authentication.
  * **Dashboard**: 2x2 quick navigation grid + live attendance KPIs.
  * **Sessions & QR**: Filterable sessions with classroom GPS detection.
  * **Classroom Projector Mode**: Fullscreen dynamic QR code display with countdown timer, 100m geofence indicator, and live attendee feed.
  * **Student & Teacher Directories**: Rosters and profile creation.
  * **Attendance Stats**: Class-wise absent percentage breakdown and CSV export.
  * **Profile**: User details, dark mode toggle, and logout.

* **Mobile App (`mobile_flutter`)**:
  * Cross-platform (Android & iOS).
  * 8 screens designed faithfully to the design mockup.
  * Dark-mode camera QR scanner with teal viewfinder brackets.
  * High-accuracy device GPS verification via `geolocator`.

* **Backend (`backend_flask`)**:
  * **Dual Database Engine**: Automatically uses MySQL if running, or zero-config local SQLite (`attendance.db`) with automatic table creation and demo accounts.
  * **Free Cloudflare Tunnel**: Instant public HTTPS tunnel (`https://xxxx.trycloudflare.com`) without paying for cloud MySQL or hosting.

---

## 🚀 Quick Start Guide

### 1. Start the Live Backend (Free Cloudflare Tunnel)
Simply double-click:
```bash
start_live_backend.bat
```
Or run from terminal:
```bash
cd backend_flask
call .venv\Scripts\activate
python tunnel.py
```
> This will start your Flask API and generate a public HTTPS URL (e.g., `https://your-tunnel.trycloudflare.com`).

---

### 2. Run the Next.js Web Dashboard
```bash
cd web_nextjs
npm install
npm run dev
```
Open **`http://localhost:3000`** in your browser.

> To connect the Web Dashboard to your live Cloudflare Tunnel, create `web_nextjs/.env.local`:
> ```env
> NEXT_PUBLIC_API_URL=https://your-tunnel.trycloudflare.com
> ```

---

### 3. Run the Flutter Mobile App
```bash
cd mobile_flutter
flutter run
```
> In the mobile app's Login screen, tap the ⚙️ **Settings gear** to set your backend URL to your live Cloudflare Tunnel or local IP.

---

## 🔑 Default Demo Accounts
| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@school.com` | `123456` |
| **Teacher** | `teacher@school.com` | `123456` |
| **Student** | `student@school.com` | `123456` |
