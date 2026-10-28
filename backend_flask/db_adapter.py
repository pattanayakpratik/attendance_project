import os
import sqlite3
import pymysql
from werkzeug.security import generate_password_hash
from datetime import datetime, timedelta

class SQLiteCursorWrapper:
    def __init__(self, cursor):
        self._cur = cursor
        self.rowcount = cursor.rowcount
        self.lastrowid = cursor.lastrowid

    def execute(self, query, params=None):
        q = query.replace('%s', '?')
        # Replace NOW() with CURRENT_TIMESTAMP for SQLite compatibility
        q = q.replace('NOW()', 'CURRENT_TIMESTAMP')
        if params is not None:
            if not isinstance(params, (list, tuple)):
                params = (params,)
            res = self._cur.execute(q, tuple(params))
        else:
            res = self._cur.execute(q)
        self.rowcount = self._cur.rowcount
        self.lastrowid = self._cur.lastrowid
        return res

    def executemany(self, query, seq_of_params):
        q = query.replace('%s', '?').replace('NOW()', 'CURRENT_TIMESTAMP')
        return self._cur.executemany(q, seq_of_params)

    def fetchone(self):
        return self._cur.fetchone()

    def fetchall(self):
        return self._cur.fetchall()

    def close(self):
        try:
            self._cur.close()
        except:
            pass

class SQLiteConnectionWrapper:
    def __init__(self, db_path):
        self.db_path = db_path
        self._conn = None

    def _get_conn(self):
        if self._conn is None:
            self._conn = sqlite3.connect(self.db_path, check_same_thread=False)
        return self._conn

    def cursor(self):
        return SQLiteCursorWrapper(self._get_conn().cursor())

    def commit(self):
        if self._conn:
            self._conn.commit()

    def rollback(self):
        if self._conn:
            self._conn.rollback()

    def close(self):
        if self._conn:
            self._conn.close()
            self._conn = None

class PyMySQLConnectionWrapper:
    def __init__(self, host, user, password, database, port, ssl_ctx=None):
        self.host = host
        self.user = user
        self.password = password
        self.database = database
        self.port = port
        self.ssl_ctx = ssl_ctx
        self._conn = None

    def _get_conn(self):
        if self._conn is None or not self._conn.open:
            kwargs = {
                'host': self.host,
                'user': self.user,
                'password': self.password,
                'database': self.database,
                'port': self.port,
                'autocommit': True,
                'connect_timeout': 10
            }
            if self.ssl_ctx:
                kwargs['ssl'] = self.ssl_ctx
            self._conn = pymysql.connect(**kwargs)
        else:
            self._conn.ping(reconnect=True)
        return self._conn

    def cursor(self):
        return self._get_conn().cursor()

    def commit(self):
        if self._conn and self._conn.open:
            self._conn.commit()

    def rollback(self):
        if self._conn and self._conn.open:
            self._conn.rollback()

    def close(self):
        if self._conn and self._conn.open:
            try:
                self._conn.close()
            except:
                pass
            self._conn = None

class PostgresCursorWrapper:
    def __init__(self, cursor, conn):
        self._cur = cursor
        self._conn = conn
        self.lastrowid = None
        self.rowcount = -1

    def execute(self, query, params=None):
        import re
        q = re.sub(r'(?i)\buser\b', '"user"', query)
        q = q.replace('NOW()', 'CURRENT_TIMESTAMP')

        is_insert = q.strip().upper().startswith('INSERT')
        has_returning = 'RETURNING' in q.upper()

        if is_insert and not has_returning and ('"user"' in q or 'session' in q or 'attendance' in q):
            mod_q = q.rstrip().rstrip(';') + ' RETURNING id;'
            try:
                res = self._cur.execute(mod_q, params) if params is not None else self._cur.execute(mod_q)
                row = self._cur.fetchone()
                if row:
                    self.lastrowid = row[0]
                self.rowcount = self._cur.rowcount
                return res
            except Exception:
                self._conn.rollback()

        res = self._cur.execute(q, params) if params is not None else self._cur.execute(q)
        self.rowcount = self._cur.rowcount
        return res

    def executemany(self, query, seq_of_params):
        import re
        q = re.sub(r'(?i)\buser\b', '"user"', query)
        return self._cur.executemany(q, seq_of_params)

    def fetchone(self):
        return self._cur.fetchone()

    def fetchall(self):
        return self._cur.fetchall()

    def close(self):
        try:
            self._cur.close()
        except:
            pass

class PostgresConnectionWrapper:
    def __init__(self, host, user, password, dbname, port, sslmode='require'):
        self.host = host
        self.user = user
        self.password = password
        self.dbname = dbname
        self.port = port
        self.sslmode = sslmode
        self._conn = None

    def _get_conn(self):
        import psycopg2
        if self._conn is None or self._conn.closed != 0:
            self._conn = psycopg2.connect(
                host=self.host,
                port=self.port,
                user=self.user,
                password=self.password,
                dbname=self.dbname,
                sslmode=self.sslmode,
                connect_timeout=10
            )
            self._conn.autocommit = True
        return self._conn

    def cursor(self):
        return PostgresCursorWrapper(self._get_conn().cursor(), self._get_conn())

    def commit(self):
        if self._conn and self._conn.closed == 0:
            self._conn.commit()

    def rollback(self):
        if self._conn and self._conn.closed == 0:
            self._conn.rollback()

    def close(self):
        if self._conn and self._conn.closed == 0:
            try:
                self._conn.close()
            except:
                pass
            self._conn = None

class ResilientMySQL:
    """
    Transparent database adapter that connects to PostgreSQL or MySQL if available,
    or smoothly falls back to a zero-config local SQLite database (attendance.db).
    """
    def __init__(self, app=None):
        self.app = app
        self.is_sqlite = False
        self._postgres_conn = None
        self._mysql_conn = None
        self._sqlite_conn = None
        if app is not None:
            self.init_app(app)

    def init_app(self, app):
        self.app = app
        engine = os.environ.get('DB_ENGINE', 'auto').lower()
        db_url = os.environ.get('DATABASE_URL', '')

        # 1. Try PostgreSQL if configured
        if engine in ('postgres', 'postgresql') or db_url.startswith('postgres://') or db_url.startswith('postgresql://') or os.environ.get('PG_HOST'):
            try:
                import urllib.parse
                if db_url:
                    parsed = urllib.parse.urlparse(db_url)
                    pg_user = urllib.parse.unquote(parsed.username or 'postgres')
                    pg_pass = urllib.parse.unquote(parsed.password or '')
                    pg_host = parsed.hostname or 'localhost'
                    pg_port = parsed.port or 5432
                    pg_db = parsed.path.lstrip('/') or 'postgres'
                else:
                    pg_host = os.environ.get('PG_HOST', 'localhost')
                    pg_port = int(os.environ.get('PG_PORT', 5432))
                    pg_user = os.environ.get('PG_USER', 'postgres')
                    pg_pass = os.environ.get('PG_PASSWORD', '')
                    pg_db = os.environ.get('PG_DATABASE', 'postgres')

                sslmode = os.environ.get('PG_SSLMODE', 'require')
                self._postgres_conn = PostgresConnectionWrapper(
                    host=pg_host,
                    user=pg_user,
                    password=pg_pass,
                    dbname=pg_db,
                    port=pg_port,
                    sslmode=sslmode
                )
                cur = self._postgres_conn.cursor()
                cur.execute("SELECT 1")
                cur.close()

                self.is_sqlite = False
                app.logger.info("Connected to PostgreSQL (Supabase) at %s:%s/%s", pg_host, pg_port, pg_db)
                return
            except Exception as e:
                app.logger.warning("PostgreSQL connection failed: %s. Trying MySQL/SQLite.", e)

        # 2. Try MySQL if configured
        if engine not in ('sqlite', 'postgres', 'postgresql'):
            try:
                # Try connecting to MySQL
                host = app.config.get('MYSQL_HOST', '127.0.0.1')
                user = app.config.get('MYSQL_USER', 'root')
                passwd = app.config.get('MYSQL_PASSWORD', '')
                db_name = app.config.get('MYSQL_DB', 'attendance_app')
                port = int(app.config.get('MYSQL_PORT', 3306))

                # Determine if SSL/TLS is needed (e.g. TiDB Cloud or remote cloud host)
                use_ssl = (
                    os.environ.get('MYSQL_SSL', '').lower() in ('true', '1', 'yes')
                    or port == 4000
                    or 'tidbcloud.com' in host
                    or (host not in ('127.0.0.1', 'localhost') and not host.startswith('192.168.') and not host.startswith('10.'))
                )

                ssl_ctx = None
                if use_ssl:
                    import ssl
                    ssl_ctx = ssl.create_default_context()

                # Test socket connection and initialize connection wrapper
                self._mysql_conn = PyMySQLConnectionWrapper(
                    host=host,
                    user=user,
                    password=passwd,
                    database=db_name,
                    port=port,
                    ssl_ctx=ssl_ctx
                )
                # Verify cursor works
                cur = self._mysql_conn.cursor()
                cur.execute("SELECT 1")
                cur.close()

                self.is_sqlite = False
                app.logger.info("Connected to MySQL database at %s:%s (ssl=%s)", host, port, use_ssl)
                return
            except Exception as e:
                app.logger.warning("MySQL connection failed: %s. Using SQLite fallback.", e)

        # Fallback to SQLite
        self.is_sqlite = True
        base_dir = os.path.dirname(os.path.abspath(__file__))
        db_path = os.path.join(base_dir, 'attendance.db')
        self._sqlite_conn = SQLiteConnectionWrapper(db_path)
        self._init_sqlite_schema(db_path)
        app.logger.info("Initialized local SQLite database: %s", db_path)

    @property
    def connection(self):
        if not self.is_sqlite:
            if self._postgres_conn:
                return self._postgres_conn
            if self._mysql_conn:
                return self._mysql_conn
        return self._sqlite_conn

    def _init_sqlite_schema(self, db_path):
        conn = sqlite3.connect(db_path)
        cur = conn.cursor()

        # 1. Users Table
        cur.execute('''
            CREATE TABLE IF NOT EXISTS user (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                phone TEXT NOT NULL,
                password TEXT NOT NULL,
                role TEXT NOT NULL
            )
        ''')

        # 2. Student Details Table
        cur.execute('''
            CREATE TABLE IF NOT EXISTS student (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                class TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                phone TEXT NOT NULL,
                password TEXT NOT NULL,
                institute_id INTEGER DEFAULT 1,
                status TEXT DEFAULT 'ACTIVE',
                course TEXT,
                batch TEXT,
                semester TEXT
            )
        ''')

        # 2b. Student Class History (Batch & Semester Progression)
        cur.execute('''
            CREATE TABLE IF NOT EXISTS student_class_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id INTEGER NOT NULL,
                institute_id INTEGER NOT NULL,
                course TEXT,
                batch TEXT,
                semester TEXT,
                class_name TEXT NOT NULL,
                academic_year TEXT,
                status TEXT DEFAULT 'ACTIVE',
                promoted_at TEXT DEFAULT CURRENT_TIMESTAMP,
                promoted_by INTEGER
            )
        ''')

        # 3. Sessions Table
        cur.execute('''
            CREATE TABLE IF NOT EXISTS session (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_name TEXT NOT NULL,
                session_code TEXT NOT NULL UNIQUE,
                expiry_time TEXT NOT NULL,
                created_by INTEGER NOT NULL,
                class TEXT NOT NULL,
                latitude REAL,
                longitude REAL,
                institute_id INTEGER DEFAULT 1,
                start_time TEXT DEFAULT CURRENT_TIMESTAMP,
                end_time TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                status TEXT DEFAULT 'ACTIVE'
            )
        ''')

        # 4. Attendance Table
        cur.execute('''
            CREATE TABLE IF NOT EXISTS attendance (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id INTEGER NOT NULL,
                session_id INTEGER NOT NULL,
                status TEXT NOT NULL,
                timestamp TEXT DEFAULT CURRENT_TIMESTAMP
            )
        ''')

        # Seed initial admin and teacher if empty
        cur.execute("SELECT COUNT(*) FROM user")
        if cur.fetchone()[0] == 0:
            pw = generate_password_hash('123456')
            cur.execute("INSERT INTO user (name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)",
                        ('System Admin', 'admin@school.com', '+91 9876543210', pw, 'ADMIN'))
            cur.execute("INSERT INTO user (name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)",
                        ('Dr. John Doe', 'teacher@school.com', '+91 9876543211', pw, 'TEACHER'))

        # Seed initial student if empty
        cur.execute("SELECT COUNT(*) FROM student")
        if cur.fetchone()[0] == 0:
            pw = generate_password_hash('123456')
            cur.execute("INSERT INTO student (id, name, class, email, phone, password) VALUES (?, ?, ?, ?, ?, ?)",
                        (101, 'Emma Johnson', 'Class 10', 'student@school.com', '+91 9381075071', pw))
            cur.execute("INSERT INTO student (id, name, class, email, phone, password) VALUES (?, ?, ?, ?, ?, ?)",
                        (102, 'Robert Brown', 'Class 10', 'robert@school.com', '+91 9088552381', pw))

        # Seed initial active session if empty
        cur.execute("SELECT COUNT(*) FROM session")
        if cur.fetchone()[0] == 0:
            expiry = (datetime.now() + timedelta(hours=3)).strftime('%Y-%m-%d %H:%M:%S')
            cur.execute("INSERT INTO session (session_name, session_code, expiry_time, created_by, class, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?)",
                        ('Mathematics', 'MATH-101-2026', expiry, 1, 'Class 10', 20.2961, 85.8245))

        conn.commit()
        conn.close()
