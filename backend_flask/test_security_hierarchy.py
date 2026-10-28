from dotenv import load_dotenv
load_dotenv()
from app import app
import json

client = app.test_client()

print("=" * 65)
print("TESTING STRICT ONBOARDING & REGISTRATION PERMISSION HIERARCHY")
print("=" * 65)

# 1. Unauthenticated public tries to create an Admin -> Must fail (403)
res_pub_admin = client.post('/register_user', json={
    'name': 'Hacker Admin',
    'email': 'hacker@evil.com',
    'phone': '+91 9999999999',
    'password': 'password123',
    'role': 'ADMIN'
})
print("1. Public creating Admin:", res_pub_admin.status_code, res_pub_admin.get_json())
assert res_pub_admin.status_code == 403, "SECURITY LEAK: Public was able to create Admin!"
print("   >>> PUBLIC ADMIN CREATION BLOCKED (403)!")

# 2. Unauthenticated public tries to register an Institute -> Must fail (403)
res_pub_inst = client.post('/register_institute', json={
    'name': 'Fake College',
    'code': 'FAKE-01',
    'admin_name': 'Fake Admin',
    'admin_email': 'fake@admin.com',
    'admin_password': 'password123'
})
print("\n2. Public creating Institute:", res_pub_inst.status_code, res_pub_inst.get_json())
assert res_pub_inst.status_code == 403, "SECURITY LEAK: Public was able to create Institute!"
print("   >>> PUBLIC INSTITUTE CREATION BLOCKED (403)!")

# 3. Regular Campus Admin tries to create an Institute -> Must fail (403)
res_login_gw = client.post('/login_user', json={'email': 'admin@school.com', 'password': '123456'})
token_gw = res_login_gw.get_json().get('token')

res_gw_inst = client.post('/register_institute', 
    headers={'Authorization': f'Bearer {token_gw}'},
    json={
        'name': 'Rogue Campus',
        'code': 'ROGUE-01',
        'admin_name': 'Rogue Admin',
        'admin_email': 'rogue@school.com',
        'admin_password': 'password123'
    }
)
print("\n3. Campus Admin creating Institute:", res_gw_inst.status_code, res_gw_inst.get_json())
assert res_gw_inst.status_code == 403, "SECURITY LEAK: Campus Admin was able to create Institute!"
print("   >>> CAMPUS ADMIN BLOCKED FROM CREATING INSTITUTES (403)!")

# 4. Unknown/un-enrolled student trying to login -> Must fail (404)
res_unregistered_student = client.post('/student_login', json={
    'email': 'stranger@gmail.com',
    'password': '123456'
})
print("\n4. Un-enrolled Student login:", res_unregistered_student.status_code, res_unregistered_student.get_json())
assert res_unregistered_student.status_code == 404, "SECURITY ERROR: Stranger was able to authenticate!"
print("   >>> UN-ENROLLED STUDENT CANNOT LOGIN (404)!")

# 5. Master Owner CAN onboard Institute -> Must succeed (201)
res_login_owner = client.post('/login_user', json={'email': 'owner@attendancepro.com', 'password': '123456'})
token_owner = res_login_owner.get_json().get('token')

# Clean test code in case already exists
import uuid
unique_code = f"TEST-{uuid.uuid4().hex[:4].upper()}"
res_owner_inst = client.post('/register_institute',
    headers={'Authorization': f'Bearer {token_owner}'},
    json={
        'name': 'IIT Bombay Campus',
        'code': unique_code,
        'address': 'Powai, Mumbai',
        'admin_name': 'Dean of Academics',
        'admin_email': f'dean_{unique_code.lower()}@iitb.ac.in',
        'admin_password': 'securePassword123',
        'admin_phone': '+91 9876543299'
    }
)
print("\n5. Master Owner onboarding Institute:", res_owner_inst.status_code, res_owner_inst.get_json().get('message'))
assert res_owner_inst.status_code == 201, "Master Owner could not onboard institute!"
print("   >>> MASTER OWNER INSTITUTE ONBOARDING VERIFIED (201)!")

print("\n" + "=" * 65)
print("ALL STRICT ONBOARDING HIERARCHY TESTS PASSED WITH 100% SECURITY!")
print("=" * 65)
