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

class ResilientMySQL:
    """
    Transparent database adapter that connects to MySQL if available,
    or smoothly falls back to a zero-config local SQLite database (attendance.db).
    """
    def __init__(self, app=None):
        self.app = app
        self.is_sqlite = False
        self._mysql_conn = None
        self._sqlite_conn = None
        if app is not None:
            self.init_app(app)

    def init_app(self, app):
        self.app = app
        engine = os.environ.get('DB_ENGINE', 'auto').lower()

        if engine != 'sqlite':
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
        if not self.is_sqlite and self._mysql_conn:
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
                password TEXT NOT NULL
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
                longitude REAL
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
