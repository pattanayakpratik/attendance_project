import os
from dotenv import load_dotenv
import psycopg2
from werkzeug.security import generate_password_hash
from datetime import datetime, timedelta

_env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
if os.path.exists(_env_path):
    load_dotenv(_env_path)
else:
    load_dotenv()

def setup():
    host = os.environ.get('PG_HOST', 'localhost')
    port = int(os.environ.get('PG_PORT', 5432))
    user = os.environ.get('PG_USER', 'postgres')
    password = os.environ.get('PG_PASSWORD', '')
    dbname = os.environ.get('PG_DATABASE', 'postgres')
    sslmode = os.environ.get('PG_SSLMODE', 'require')

    conn = psycopg2.connect(
        host=host,
        port=port,
        user=user,
        password=password,
        dbname=dbname,
        sslmode=sslmode,
        connect_timeout=10
    )
    cur = conn.cursor()

    # 1. User table
    cur.execute('''
    CREATE TABLE IF NOT EXISTS "user" (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        phone VARCHAR(15) NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL
    );
    ''')

    # 2. Student table
    cur.execute('''
    CREATE TABLE IF NOT EXISTS student (
        id INT PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        class VARCHAR(50) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        phone VARCHAR(15) NOT NULL,
        password VARCHAR(255) NOT NULL
    );
    ''')

    # 3. Session table
    cur.execute('''
    CREATE TABLE IF NOT EXISTS session (
        id SERIAL PRIMARY KEY,
        session_name VARCHAR(100) NOT NULL,
        session_code VARCHAR(50) NOT NULL UNIQUE,
        expiry_time TIMESTAMP NOT NULL,
        created_by INT NOT NULL,
        class VARCHAR(50) NOT NULL,
        latitude DOUBLE PRECISION DEFAULT NULL,
        longitude DOUBLE PRECISION DEFAULT NULL,
        FOREIGN KEY (created_by) REFERENCES "user"(id) ON DELETE CASCADE
    );
    ''')

    # 4. Attendance table
    cur.execute('''
    CREATE TABLE IF NOT EXISTS attendance (
        id SERIAL PRIMARY KEY,
        student_id INT NOT NULL,
        session_id INT NOT NULL,
        status VARCHAR(10) NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES student(id) ON DELETE CASCADE,
        FOREIGN KEY (session_id) REFERENCES session(id) ON DELETE CASCADE
    );
    ''')

    # Seed initial admin and teacher if empty
    cur.execute('SELECT COUNT(*) FROM "user"')
    if cur.fetchone()[0] == 0:
        pw = generate_password_hash('123456')
        cur.execute('INSERT INTO "user" (name, email, phone, password, role) VALUES (%s, %s, %s, %s, %s)',
                    ('System Admin', 'admin@school.com', '+91 9876543210', pw, 'ADMIN'))
        cur.execute('INSERT INTO "user" (name, email, phone, password, role) VALUES (%s, %s, %s, %s, %s)',
                    ('Dr. John Doe', 'teacher@school.com', '+91 9876543211', pw, 'TEACHER'))
        print('Seeded admin & teacher!')

    # Seed initial students if empty
    cur.execute('SELECT COUNT(*) FROM student')
    if cur.fetchone()[0] == 0:
        pw = generate_password_hash('123456')
        cur.execute('INSERT INTO student (id, name, class, email, phone, password) VALUES (%s, %s, %s, %s, %s, %s)',
                    (101, 'Emma Johnson', 'Class 10', 'student@school.com', '+91 9381075071', pw))
        cur.execute('INSERT INTO student (id, name, class, email, phone, password) VALUES (%s, %s, %s, %s, %s, %s)',
                    (102, 'Robert Brown', 'Class 10', 'robert@school.com', '+91 9088552381', pw))
        print('Seeded students!')

    # Seed initial active session if empty
    cur.execute('SELECT COUNT(*) FROM session')
    if cur.fetchone()[0] == 0:
        expiry = (datetime.now() + timedelta(hours=3)).strftime('%Y-%m-%d %H:%M:%S')
        cur.execute('INSERT INTO session (session_name, session_code, expiry_time, created_by, class, latitude, longitude) VALUES (%s, %s, %s, %s, %s, %s, %s)',
                    ('Mathematics', 'MATH-101-2026', expiry, 1, 'Class 10', 20.2961, 85.8245))
        print('Seeded session!')

    conn.commit()

    cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name")
    tables = [r[0] for r in cur.fetchall()]
    print('Tables created in Supabase:', tables)

    cur.execute('SELECT id, name, email, role FROM "user"')
    print('Users:', cur.fetchall())

    cur.execute('SELECT id, name, email FROM student')
    print('Students:', cur.fetchall())

    cur.execute('SELECT id, session_name, session_code FROM session')
    print('Sessions:', cur.fetchall())

    cur.close()
    conn.close()
    print('ALL TABLES AND SEED DATA FULLY INITIALIZED ON SUPABASE!')

if __name__ == '__main__':
    setup()
