import os
from dotenv import load_dotenv
import psycopg2
from werkzeug.security import generate_password_hash

_env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
if os.path.exists(_env_path):
    load_dotenv(_env_path)
else:
    load_dotenv()

def seed_superadmin():
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

    cur.execute("SELECT id FROM \"user\" WHERE role = 'SUPERADMIN'")
    if not cur.fetchone():
        pw = generate_password_hash('123456')
        cur.execute('''
        INSERT INTO "user" (name, email, phone, password, role, institute_id)
        VALUES (%s, %s, %s, %s, %s, NULL)
        ''', ('Platform Master Owner', 'owner@attendancepro.com', '+91 9999999999', pw, 'SUPERADMIN'))
        conn.commit()
        print("Created Master Superadmin: owner@attendancepro.com / 123456")
    else:
        print("Master Superadmin already exists!")

    cur.execute("SELECT id, name, email, role, institute_id FROM \"user\" WHERE role = 'SUPERADMIN'")
    print("Superadmin user:", cur.fetchone())

    cur.close()
    conn.close()

if __name__ == '__main__':
    seed_superadmin()
