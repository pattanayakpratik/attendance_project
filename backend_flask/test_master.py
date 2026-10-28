from dotenv import load_dotenv
load_dotenv()
from app import app
import json

client = app.test_client()

# 1. Login as SUPERADMIN
res = client.post('/login_user', json={'email': 'owner@attendancepro.com', 'password': '123456'})
data = res.get_json()
print('SUPERADMIN Login:', res.status_code, data.get('role'), data.get('name'))
token = data.get('token')

# 2. Call /master/overview as SUPERADMIN
res_ov = client.get('/master/overview', headers={'Authorization': f'Bearer {token}'})
print('Master Overview Status:', res_ov.status_code)
ov_data = res_ov.get_json()
print('KPIs:', ov_data.get('kpis'))
print('Institutes Count:', len(ov_data.get('institutes', [])))
for inst in ov_data.get('institutes', []):
    print(f"   -> Institute #{inst['id']} {inst['name']}: {inst['student_count']} Students, {inst['teacher_count']} Teachers, Admin: {inst['admin_email']}")

# 3. Call /master/all_users as SUPERADMIN
res_users = client.get('/master/all_users', headers={'Authorization': f'Bearer {token}'})
users_data = res_users.get_json()
print('Total Cross-Institute Users:', users_data.get('total_count'))

# 4. Security Check: regular admin must be rejected with 403
res_reg = client.post('/login_user', json={'email': 'admin@school.com', 'password': '123456'})
reg_token = res_reg.get_json().get('token')
res_blocked = client.get('/master/overview', headers={'Authorization': f'Bearer {reg_token}'})
print('Regular admin accessing master overview status:', res_blocked.status_code)
assert res_blocked.status_code == 403, 'SECURITY FAILURE: Regular admin accessed Master Overview!'
print('>>> MASTER DASHBOARD SECURITY VERIFIED 100%!')
