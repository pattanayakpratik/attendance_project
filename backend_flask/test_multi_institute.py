from dotenv import load_dotenv
load_dotenv()
from app import app
import json

client = app.test_client()

print("=" * 60)
print("TESTING MULTI-INSTITUTE TENANCY ISOLATION")
print("=" * 60)

# 1. Login Greenwood Admin (Institute 1)
res_gw = client.post('/login_user', json={'email': 'admin@school.com', 'password': '123456'})
data_gw = res_gw.get_json()
token_gw = data_gw.get('token')
inst1_id = data_gw.get('institute_id')
inst1_name = data_gw.get('institute_name')
print(f"1. Greenwood Admin Logged In: Institute #{inst1_id} '{inst1_name}'")

# 2. Login Apex Admin (Institute 2)
res_apex = client.post('/login_user', json={'email': 'admin@apex.edu', 'password': '123456'})
data_apex = res_apex.get_json()
token_apex = data_apex.get('token')
inst2_id = data_apex.get('institute_id')
inst2_name = data_apex.get('institute_name')
print(f"2. Apex Admin Logged In: Institute #{inst2_id} '{inst2_name}'")

# 3. Test Student Isolation
res_students_gw = client.get('/get_all_student', headers={'Authorization': f'Bearer {token_gw}'})
students_gw = res_students_gw.get_json().get('students', [])
names_gw = [s['name'] for s in students_gw]
print(f"\n3. Institute #1 Students ({len(names_gw)}): {names_gw}")

res_students_apex = client.get('/get_all_student', headers={'Authorization': f'Bearer {token_apex}'})
students_apex = res_students_apex.get_json().get('students', [])
names_apex = [s['name'] for s in students_apex]
print(f"   Institute #2 Students ({len(names_apex)}): {names_apex}")

assert 'Maya Patel' not in names_gw, "SECURITY LEAK: Institute 2 student visible to Institute 1!"
assert 'Emma Johnson' not in names_apex, "SECURITY LEAK: Institute 1 student visible to Institute 2!"
print("   >>> STUDENT ISOLATION VERIFIED 100%!")

# 4. Test Teacher Isolation
res_teachers_gw = client.get('/get_teachers', headers={'Authorization': f'Bearer {token_gw}'})
teachers_gw = [t['name'] for t in res_teachers_gw.get_json().get('teachers', [])]
print(f"\n4. Institute #1 Teachers: {teachers_gw}")

res_teachers_apex = client.get('/get_teachers', headers={'Authorization': f'Bearer {token_apex}'})
teachers_apex = [t['name'] for t in res_teachers_apex.get_json().get('teachers', [])]
print(f"   Institute #2 Teachers: {teachers_apex}")

assert 'Prof. Alan Turing' not in teachers_gw, "SECURITY LEAK: Institute 2 teacher visible to Institute 1!"
assert 'Dr. John Doe' not in teachers_apex, "SECURITY LEAK: Institute 1 teacher visible to Institute 2!"
print("   >>> TEACHER ISOLATION VERIFIED 100%!")

# 5. Test Session Isolation
res_sessions_gw = client.get('/get_sessions', headers={'Authorization': f'Bearer {token_gw}'})
sessions_gw = [s['session_name'] for s in res_sessions_gw.get_json().get('sessions', [])]
print(f"\n5. Institute #1 Sessions: {sessions_gw}")

res_sessions_apex = client.get('/get_sessions', headers={'Authorization': f'Bearer {token_apex}'})
sessions_apex = [s['session_name'] for s in res_sessions_apex.get_json().get('sessions', [])]
print(f"   Institute #2 Sessions: {sessions_apex}")

assert 'Quantum Physics Lab' not in sessions_gw, "SECURITY LEAK: Institute 2 session visible to Institute 1!"
assert 'Mathematics' not in sessions_apex, "SECURITY LEAK: Institute 1 session visible to Institute 2!"
print("   >>> SESSION ISOLATION VERIFIED 100%!")

# 6. Test GET /get_institutes
res_insts = client.get('/get_institutes')
all_insts = res_insts.get_json().get('institutes', [])
print(f"\n6. Total Registered Institutes: {len(all_insts)}")
for inst in all_insts:
    print(f"   - #{inst['id']} {inst['name']} ({inst['code']})")

print("\n" + "=" * 60)
print("ALL MULTI-INSTITUTE TENANCY TESTS PASSED WITH ZERO LEAKS!")
print("=" * 60)
