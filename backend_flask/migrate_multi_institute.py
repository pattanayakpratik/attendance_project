import psycopg2
from werkzeug.security import generate_password_hash
from datetime import datetime, timedelta

def migrate():
    password = 'p/92Br$%./gUWAk'
    conn = psycopg2.connect(
        host='aws-0-eu-north-1.pooler.supabase.com',
        port=5432,
        user='postgres.rchlaxijtptfvuvjcngz',
        password=password,
        dbname='postgres',
        sslmode='require',
        connect_timeout=10
    )
    cur = conn.cursor()

    print("Running Multi-Institute Migration on Supabase PostgreSQL...")

    # 1. Create institute table
    cur.execute('''
    CREATE TABLE IF NOT EXISTS institute (
        id SERIAL PRIMARY KEY,
        name VARCHAR(120) NOT NULL,
        code VARCHAR(50) NOT NULL UNIQUE,
        address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    ''')

    # 2. Add institute_id columns if not exist
    cur.execute('''
    ALTER TABLE "user" ADD COLUMN IF NOT EXISTS institute_id INT REFERENCES institute(id) ON DELETE SET NULL;
    ''')

    cur.execute('''
    ALTER TABLE student ADD COLUMN IF NOT EXISTS institute_id INT REFERENCES institute(id) ON DELETE SET NULL;
    ''')

    cur.execute('''
    ALTER TABLE session ADD COLUMN IF NOT EXISTS institute_id INT REFERENCES institute(id) ON DELETE SET NULL;
    ''')

    # 3. Seed Institute 1 (Default Institute)
    cur.execute("SELECT id FROM institute WHERE id = 1")
    if not cur.fetchone():
        cur.execute('''
        INSERT INTO institute (id, name, code, address)
        VALUES (1, 'Greenwood International School', 'GW-001', '742 Evergreen Terrace, Campus A')
        ON CONFLICT (id) DO NOTHING;
        ''')
        print("Created Institute #1: Greenwood International School")

    # 4. Seed Institute 2 (Apex Institute of Technology) to demonstrate isolation
    cur.execute("SELECT id FROM institute WHERE id = 2")
    if not cur.fetchone():
        cur.execute('''
        INSERT INTO institute (id, name, code, address)
        VALUES (2, 'Apex Institute of Technology', 'AIT-002', '100 Innovation Way, Tech Park')
        ON CONFLICT (id) DO NOTHING;
        ''')
        print("Created Institute #2: Apex Institute of Technology")

    # Reset sequence if needed
    cur.execute("SELECT setval('institute_id_seq', (SELECT MAX(id) FROM institute))")

    # 5. Backfill existing data with institute_id = 1
    cur.execute('UPDATE "user" SET institute_id = 1 WHERE institute_id IS NULL')
    cur.execute('UPDATE student SET institute_id = 1 WHERE institute_id IS NULL')
    cur.execute('UPDATE session SET institute_id = 1 WHERE institute_id IS NULL')

    # 6. Seed demo users for Institute 2
    cur.execute('SELECT id FROM "user" WHERE email = %s', ('admin@apex.edu',))
    if not cur.fetchone():
        pw = generate_password_hash('123456')
        cur.execute('''
        INSERT INTO "user" (name, email, phone, password, role, institute_id)
        VALUES (%s, %s, %s, %s, %s, %s)
        ''', ('Apex Admin', 'admin@apex.edu', '+91 9123456780', pw, 'ADMIN', 2))
        cur.execute('''
        INSERT INTO "user" (name, email, phone, password, role, institute_id)
        VALUES (%s, %s, %s, %s, %s, %s)
        ''', ('Prof. Alan Turing', 'teacher@apex.edu', '+91 9123456781', pw, 'TEACHER', 2))
        print("Seeded Institute #2 Admin & Teacher")

    # Seed demo student for Institute 2
    cur.execute('SELECT id FROM student WHERE id = 201')
    if not cur.fetchone():
        pw = generate_password_hash('123456')
        cur.execute('''
        INSERT INTO student (id, name, class, email, phone, password, institute_id)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        ''', (201, 'Maya Patel', 'CS-Year-1', 'student@apex.edu', '+91 9123456782', pw, 2))
        print("Seeded Institute #2 Student")

    # Seed demo session for Institute 2
    cur.execute('SELECT id FROM session WHERE session_code = %s', ('PHYS-201-2026',))
    if not cur.fetchone():
        expiry = (datetime.now() + timedelta(hours=3)).strftime('%Y-%m-%d %H:%M:%S')
        # Find apex teacher id
        cur.execute('SELECT id FROM "user" WHERE email = %s', ('teacher@apex.edu',))
        apex_teacher_id = cur.fetchone()[0]
        cur.execute('''
        INSERT INTO session (session_name, session_code, expiry_time, created_by, class, latitude, longitude, institute_id)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        ''', ('Quantum Physics Lab', 'PHYS-201-2026', expiry, apex_teacher_id, 'CS-Year-1', 12.9716, 77.5946, 2))
        print("Seeded Institute #2 Session")

    conn.commit()

    # Verify counts per institute
    cur.execute('''
    SELECT i.id, i.name, i.code, 
           COUNT(DISTINCT u.id) as user_count,
           COUNT(DISTINCT s.id) as student_count,
           COUNT(DISTINCT sess.id) as session_count
    FROM institute i
    LEFT JOIN "user" u ON u.institute_id = i.id
    LEFT JOIN student s ON s.institute_id = i.id
    LEFT JOIN session sess ON sess.institute_id = i.id
    GROUP BY i.id, i.name, i.code
    ORDER BY i.id;
    ''')
    print("\n--- Multi-Institute Migration Verification ---")
    for row in cur.fetchall():
        print(f"Institute #{row[0]} '{row[1]}' ({row[2]}): {row[3]} Users, {row[4]} Students, {row[5]} Sessions")

    cur.close()
    conn.close()
    print("\nMigration completed successfully!")

if __name__ == '__main__':
    migrate()
