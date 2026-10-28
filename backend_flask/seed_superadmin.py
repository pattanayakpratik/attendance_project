import psycopg2
from werkzeug.security import generate_password_hash

def seed_superadmin():
    conn = psycopg2.connect(
        host='aws-0-eu-north-1.pooler.supabase.com',
        port=5432,
        user='postgres.rchlaxijtptfvuvjcngz',
        password='p/92Br$%./gUWAk',
        dbname='postgres',
        sslmode='require',
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
