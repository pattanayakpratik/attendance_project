DROP DATABASE IF EXISTS attendance_app;
CREATE DATABASE attendance_app;
USE attendance_app;

-- 1. Users Table (Admin, Teacher, Student roles)
CREATE TABLE user (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(15) NOT NULL,
    password VARCHAR(255) NOT NULL, -- Long enough for hashed passwords
    role ENUM('ADMIN', 'TEACHER', 'STUDENT') NOT NULL
);

-- 2. Student Details Table (Links to User table logically if needed, or keeps separate)
-- Note: In a unified system, you might merge 'student' and 'user', but keeping them separate works for now.
CREATE TABLE student (
    id INT PRIMARY KEY, -- Manual ID (e.g., Roll Number)
    name VARCHAR(50) NOT NULL,
    class VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(15) NOT NULL
);

-- 3. Sessions Table (Added Latitude/Longitude for Geofencing)
CREATE TABLE session (
    id INT PRIMARY KEY AUTO_INCREMENT,
    session_name VARCHAR(100) NOT NULL,
    session_code VARCHAR(50) NOT NULL UNIQUE,
    expiry_time DATETIME NOT NULL,
    created_by INT NOT NULL,
    class VARCHAR(50) NOT NULL,
    latitude DOUBLE DEFAULT NULL,  -- New Column
    longitude DOUBLE DEFAULT NULL, -- New Column
    FOREIGN KEY (created_by) REFERENCES user(id) ON DELETE CASCADE
);

-- 4. Attendance Table
CREATE TABLE attendance (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    session_id INT NOT NULL,
    status VARCHAR(10) NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES student(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES session(id) ON DELETE CASCADE
);