-- ==========================================
-- Smart Attendance System - Multi-Tenant Schema
-- Compatible with PostgreSQL & MySQL
-- ==========================================

-- 1. Institutes Table (Multi-Tenancy)
CREATE TABLE IF NOT EXISTS institute (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Users Table (Admin, Teacher roles)
CREATE TABLE IF NOT EXISTS "user" (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(15) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    institute_id INT REFERENCES institute(id) ON DELETE CASCADE
);

-- 3. Student Details Table
CREATE TABLE IF NOT EXISTS student (
    id INT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    class VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(15) NOT NULL,
    password VARCHAR(255) NOT NULL,
    institute_id INT REFERENCES institute(id) ON DELETE CASCADE
);

-- 4. Sessions Table (Dynamic GPS Geofencing + QR)
CREATE TABLE IF NOT EXISTS session (
    id SERIAL PRIMARY KEY,
    session_name VARCHAR(100) NOT NULL,
    session_code VARCHAR(50) NOT NULL UNIQUE,
    expiry_time TIMESTAMP NOT NULL,
    created_by INT NOT NULL,
    class VARCHAR(50) NOT NULL,
    latitude DOUBLE PRECISION DEFAULT NULL,
    longitude DOUBLE PRECISION DEFAULT NULL,
    institute_id INT REFERENCES institute(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES "user"(id) ON DELETE CASCADE
);

-- 5. Attendance Table
CREATE TABLE IF NOT EXISTS attendance (
    id SERIAL PRIMARY KEY,
    student_id INT NOT NULL,
    session_id INT NOT NULL,
    status VARCHAR(10) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES student(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES session(id) ON DELETE CASCADE
);
