from dotenv import load_dotenv

load_dotenv()



from flask import Flask, request, jsonify

from flask_cors import CORS

from geopy.distance import geodesic

from werkzeug.utils import secure_filename

import pandas as pd

import os

import qrcode

import io

import base64

from datetime import datetime, timedelta

import uuid



try:

    import MySQLdb

except ImportError:

    import pymysql

    pymysql.install_as_MySQLdb()

    import MySQLdb



from werkzeug.security import generate_password_hash, check_password_hash

from db_adapter import ResilientMySQL

from auth import generate_auth_token, verify_auth_token, require_auth, get_auth_user_from_request, get_auth_institute_id



app = Flask(__name__)

CORS(app)



# Database Configuration with Environment Variables fallback

app.config['MYSQL_HOST'] = os.getenv('MYSQL_HOST', '127.0.0.1')

app.config['MYSQL_USER'] = os.getenv('MYSQL_USER', 'root')

app.config['MYSQL_PASSWORD'] = os.getenv('MYSQL_PASSWORD', '')

app.config['MYSQL_DB'] = os.getenv('MYSQL_DB', 'attendance_app')

app.config['MYSQL_PORT'] = int(os.getenv('MYSQL_PORT', 3306))



mysql = ResilientMySQL(app)



# Example: Allowed location (your campus)

# Geofence location is dynamic: entered by Admin / Teacher per session

ALLOWED_RADIUS = 0.1  # in km



# ================================

#  API Routes

# ================================



# Add Student

@app.route('/add_student', methods=['POST'])

def add_student():

    data = request.get_json()



    if not data:

        return jsonify({"message": "Request payload is missing or not valid JSON."}), 400



    student_id = data.get('id')

    name = data.get('name')

    batch = (data.get('batch') or '').strip()
    semester = (data.get('semester') or 'Sem 1').strip()
    class_name = (data.get('class') or '').strip()
    if not class_name and batch:
        class_name = f"{batch} - {semester}"

    email = data.get('email')

    phone = data.get('phone')

    password = data.get('password') # FIX: Get password from request

    auth_user_id, _ = get_auth_user_from_request()

    requesting_user_id = data.get('request_id') or data.get('requesting_user_id') or auth_user_id



    required_fields = {

        "id": student_id,

        "name": name,

        "class": class_name,

        "email": email,

        "phone": phone,

        "password": password, # FIX: Make password required

        "request_id": requesting_user_id

    }



    missing_fields = [key for key, value in required_fields.items() if value is None]

    if missing_fields:

        return jsonify({"message": f"Missing required fields: {', '.join(missing_fields)}"}), 400



    # FIX: Hash the password securely

    hashed_password = generate_password_hash(password)



    cur = None

    try:

        cur = mysql.connection.cursor()



        # Authorization check

        cur.execute("SELECT role FROM user WHERE id = %s", (requesting_user_id,))

        user_role_result = cur.fetchone()



        if not user_role_result or user_role_result[0] not in ('ADMIN', 'TEACHER', 'SUPERADMIN'):

            return jsonify({'message': 'User not authorized to add students.'}), 403



        # Check if student ID already exists

        cur.execute("SELECT id FROM student WHERE id = %s", (student_id,))

        if cur.fetchone():

            return jsonify({'message': f"Student with ID {student_id} already exists."}), 409



        # FIX: Insert the hashed password

        inst_id = data.get('institute_id') or get_auth_institute_id()
        if not inst_id and requesting_user_id:
            cur.execute("SELECT institute_id FROM user WHERE id = %s", (requesting_user_id,))
            r = cur.fetchone()
            if r and r[0]:
                inst_id = r[0]
        if not inst_id:
            inst_id = 1

        course = (data.get('course') or '').strip()
        batch = (data.get('batch') or '').strip()
        semester = (data.get('semester') or 'Sem 1').strip()
        academic_year = (data.get('academic_year') or '2026-2027').strip()

        if not class_name and batch:
            class_name = f"{batch} - {semester}"
        elif not batch and class_name:
            batch = class_name

        cur.execute("""
            INSERT INTO student (id, name, class, email, phone, password, institute_id, status, course, batch, semester) 
            VALUES (%s, %s, %s, %s, %s, %s, %s, 'ACTIVE', %s, %s, %s)
        """, (student_id, name, class_name, email, phone, hashed_password, inst_id, course, batch, semester))

        # Initialize student_class_history entry
        cur.execute("""
            INSERT INTO student_class_history 
            (student_id, institute_id, course, batch, semester, class_name, academic_year, status, promoted_by)
            VALUES (%s, %s, %s, %s, %s, %s, %s, 'ACTIVE', %s)
        """, (student_id, inst_id, course, batch, semester, class_name, academic_year, requesting_user_id))

        mysql.connection.commit()

    except MySQLdb.Error as e:

        app.logger.error(f"Database error in add_student: {e}")

        mysql.connection.rollback()

        return jsonify({'message': 'Failed to add student due to a database error.'}), 500

    finally:

        if cur:

            cur.close()



    return jsonify({'message': 'Student added successfully!'}), 201



# add session

@app.route('/add_session', methods=['POST'])

def add_session():

    data = request.get_json()



    if not data:

        return jsonify({"message": "Request payload is missing or not valid JSON."}), 400



    session_name = data.get('session_name')

    expiry_time_str = data.get('expiry_time')

    auth_user_id, _ = get_auth_user_from_request()

    created_by = data.get('created_by') or data.get('request_id') or auth_user_id

    class_name = data.get('class')

    latitude = data.get('latitude')

    longitude = data.get('longitude')



    required_fields = {

        "session_name": session_name,

        "expiry_time": expiry_time_str,

        "created_by": created_by,

        "class": class_name,

        "latitude": latitude,

        "longitude": longitude

    }



    missing_fields = [key for key, value in required_fields.items() if value is None]

    if missing_fields:

        return jsonify({"message": f"Missing required fields: {', '.join(missing_fields)}"}), 400



    # Validate expiry_time format

    try:

        datetime.strptime(expiry_time_str, '%Y-%m-%d %H:%M:%S')

    except ValueError:

        return jsonify({"message": "Invalid expiry_time format. Expected YYYY-MM-DD HH:MM:SS"}), 400



    # Validate coordinate types

    try:

        latitude = float(latitude)

        longitude = float(longitude)

    except ValueError:

        return jsonify({"message": "Latitude and longitude must be valid numbers."}), 400



    cur = None

    try:

        cur = mysql.connection.cursor()



        # Authorization: Check if the creator is an ADMIN or TEACHER

        cur.execute("SELECT role FROM user WHERE id = %s", (created_by,))

        user_role_result = cur.fetchone()

        if not user_role_result or user_role_result[0] not in ('ADMIN', 'TEACHER', 'SUPERADMIN'):

            return jsonify({'message': 'User not authorized to create sessions.'}), 403



        # FIX: Auto-generate a guaranteed unique session code using uuid

        session_code = f"SESSION_{uuid.uuid4().hex[:8].upper()}"



        inst_id = data.get('institute_id') or get_auth_institute_id()
        if not inst_id and created_by:
            cur.execute("SELECT institute_id FROM user WHERE id = %s", (created_by,))
            r = cur.fetchone()
            if r and r[0]:
                inst_id = r[0]
        if not inst_id:
            inst_id = 1

        cur.execute("""
            INSERT INTO session (session_name, session_code, expiry_time, created_by, class, latitude, longitude, institute_id)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (session_name, session_code, expiry_time_str, created_by, class_name, latitude, longitude, inst_id))



        mysql.connection.commit()

        session_id_server = cur.lastrowid 



    except MySQLdb.Error as e:

        app.logger.error(f"Database error in add_session: {e}")

        mysql.connection.rollback()

        return jsonify({'message': 'Failed to add session due to a database error.'}), 500

    finally:

        if cur:

            cur.close()



    return jsonify({

        "message": "Session added successfully!",

        "session_id": session_id_server,

        "session_code": session_code

    }), 201





# Generate QR Code

@app.route('/generate_qr', methods=['POST'])

def generate_qr():

    data = request.get_json()

    if not data:

        return jsonify({'message': 'Request payload is missing or not valid JSON.'}), 400

    session_id = data.get('session_id')

    auth_user_id, _ = get_auth_user_from_request()

    requesting_user_id = data.get('requesting_user_id') or data.get('request_id') or auth_user_id

    # Validate presence and type

    if not all([session_id, requesting_user_id]):

        return jsonify({'message': 'Missing session_id or requesting_user_id in request.'}), 400

    try:

        session_id = int(session_id)

        requesting_user_id = int(requesting_user_id)

    except (ValueError, TypeError):

        return jsonify({'message': 'session_id and requesting_user_id must be integers.'}), 400

    try:

        cur = mysql.connection.cursor()

        # Fetch session details

        cur.execute("""

            SELECT session_code, expiry_time, created_by 

            FROM session 

            WHERE id = %s

        """, (session_id,))

        session = cur.fetchone()

        # Check if session exists

        if not session:

            return jsonify({'message': 'Session not found.'}), 404

        # Unpack session details

        session_code, expiry_time, created_by = session

        # Fetch requesting user's role

        cur.execute("SELECT role FROM user WHERE id = %s", (requesting_user_id,))

        user = cur.fetchone()

        if not user:

            return jsonify({'message': 'Requesting user not found.'}), 404

        user_role = user[0]

        # Check expiration

        if datetime.now() > expiry_time:

            app.logger.info(f"Generating QR for expired session ID: {session_id}")

        # Authorization check

        if requesting_user_id != created_by and user_role != 'ADMIN':

            return jsonify({'message': 'Not authorized to generate QR for this session.'}), 403

        # Prepare QR data

        formatted_expiry_time = expiry_time.strftime('%Y-%m-%d %H:%M:%S')

        qr_data = {

            'session_id': session_id,

            'session_code': session_code,

            'expiry_time': formatted_expiry_time

        }

        # Generate QR

        qr_img = qrcode.make(str(qr_data))

        buffered = io.BytesIO()

        qr_img.save(buffered, format="PNG")

        qr_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')

    except MySQLdb.Error as e:

        app.logger.error(f"Database error in generate_qr: {e}")

        return jsonify({'message': 'Failed to generate QR due to a database error.'}), 500

    except Exception as e:

        app.logger.error(f"Unexpected error in generate_qr: {e}")

        return jsonify({'message': 'An unexpected error occurred while generating QR code.'}), 500

    finally:

        if cur:

            cur.close()

    return jsonify({

        'qr_code': qr_base64,

        'session_id': session_id,

        'session_code': session_code,

        'expiry_time': formatted_expiry_time

    }), 200



# mark attendance

@app.route('/mark_attendance', methods=['POST'])

def mark_attendance():

    data = request.get_json()

    if not data:

        return jsonify({'message': 'Request payload is missing or not valid JSON.'}), 400

    

    student_id = data.get('student_id')

    session_id = data.get('session_id')

    lat = data.get('latitude')

    lng = data.get('longitude')



    # Validate required fields

    if not all([student_id, session_id, lat, lng]):

        return jsonify({'message': 'Missing required fields in request.'}), 400

    

    try:

        student_id = int(student_id)

        session_id = int(session_id)

        lat = float(lat)

        lng = float(lng)

    except (ValueError, TypeError):

        return jsonify({'message': 'Invalid data type for student_id, session_id, latitude, or longitude.'}), 400



    cur = None

    current_time = datetime.now()

    

    try:

        cur = mysql.connection.cursor()

        

        # 1. Fetch Session Expiry AND Location (Dynamic Geofencing)

        # Assumes session table has 'latitude' and 'longitude' columns

        cur.execute("SELECT expiry_time, latitude, longitude FROM session WHERE id = %s", (session_id,))

        result = cur.fetchone()

        

        if not result:

            return jsonify({'message': 'Invalid session ID.'}), 400

        

        expiry_time, session_lat, session_lng = result



        # 2. Check Expiry

        if current_time > expiry_time:

            # You might want to return 400 here instead of marking ABSENT

            # But sticking to your logic:

            status = 'ABSENT' 

        else:

            # 3. Check Location (Dynamic)

            if session_lat is None or session_lng is None:

                # Fallback: If session has no location, assume PRESENT (or handle error)

                status = 'PRESENT'

            else:

                student_location = (lat, lng)

                session_location = (session_lat, session_lng)

                

                # Calculate distance

                distance_km = geodesic(session_location, student_location).km

                

                # Use a reasonable radius (e.g., 0.1 km = 100 meters)

                # You can make this configurable per session if needed

                ALLOWED_RADIUS = 0.1 

                

                status = 'PRESENT' if distance_km <= ALLOWED_RADIUS else 'ABSENT'



        # 4. Check Duplicate Attendance

        cur.execute("SELECT id FROM attendance WHERE student_id = %s AND session_id = %s", (student_id, session_id))

        if cur.fetchone():

            return jsonify({'message': 'Attendance already marked for this session.', 'status': 'already_marked'}), 409

        

        # 5. Record Attendance

        cur.execute("""

            INSERT INTO attendance (student_id, session_id, status, timestamp)

            VALUES (%s, %s, %s, %s)

        """, (student_id, session_id, status, current_time))

        

        mysql.connection.commit()

        

        # Return specific message if absent due to location

        if status == 'ABSENT' and current_time <= expiry_time:

             return jsonify({'message': 'Attendance marked as ABSENT (Location mismatch).', 'status': status}), 200



    except MySQLdb.Error as e:

        app.logger.error(f"Database error in mark_attendance: {e}")

        mysql.connection.rollback()

        return jsonify({'message': 'Database error occurred while marking attendance.'}), 500

    finally:

        if cur:

            cur.close()

            

    return jsonify({'message': f'Attendance marked as {status}.', 'status': status}), 200

# finalize attendance

@app.route('/finalize_attendance', methods=['POST'])

def finalize_attendance():

    data = request.get_json()

    if not data:

        return jsonify({'message': 'Request payload is missing or not valid JSON.'}), 400

    session_id = data.get('session_id')

    if not session_id:

        return jsonify({'message': 'session_id is required.'}), 400

    try:

        session_id = int(session_id)

    except (ValueError, TypeError):

        return jsonify({'message': 'Invalid session_id.'}), 400

    cur = None

    current_time = datetime.now()

    try:

        cur = mysql.connection.cursor()

        # Check if session exists

        cur.execute("SELECT class FROM session WHERE id = %s", (session_id,))

        session_result = cur.fetchone()

        if not session_result:

            return jsonify({'message': 'Invalid session ID.'}), 400

        class_name = session_result[0]

        # Find students of this class who haven't marked attendance yet

        cur.execute("""

            SELECT s.id 

            FROM student s

            WHERE s.class = %s

            AND s.id NOT IN (

                SELECT student_id FROM attendance WHERE session_id = %s

            )

        """, (class_name, session_id))

        absent_students = cur.fetchall()

        if absent_students:

            # Insert 'absent' records for them

            cur.executemany("""

                INSERT INTO attendance (student_id, session_id, status, timestamp)

                VALUES (%s, %s, %s, %s)

            """, [(student_id[0], session_id, 'ABSENT', current_time) for student_id in absent_students])

            mysql.connection.commit()

            num_absent = len(absent_students)

        else:

            num_absent = 0

    except MySQLdb.Error as e:

        app.logger.error(f"Database error in finalize_session: {e}")

        mysql.connection.rollback()

        return jsonify({'message': 'Database error occurred while finalizing session.'}), 500

    finally:

        if cur:

            cur.close()

    return jsonify({

        'message': f'Session finalized successfully. {num_absent} students marked as absent.',

        'absent_count': num_absent

    }), 200





# Attendance Report for perticular student

@app.route('/attendance_report', methods=['GET'])

def attendance_report():

    student_id = request.args.get('student_id')

    if not student_id:

        return jsonify({'message': 'student_id parameter is required.'}), 400

    try:

        student_id = int(student_id)

    except ValueError:

        return jsonify({'message': 'student_id must be an integer.'}), 400

    cur = None

    try:

        cur = mysql.connection.cursor()

        cur.execute("""

            SELECT a.session_id, a.status, a.timestamp

            FROM attendance a

            JOIN session s ON a.session_id = s.id

            WHERE a.student_id = %s

            ORDER BY a.timestamp DESC

        """, (student_id,))

        records = cur.fetchall()

        present_count = 0

        absent_count = 0

        detailed_records = []

        if records:

            for row in records:

                status = row[1]  # a.status

                if status == 'PRESENT':

                    present_count += 1

                elif status == 'ABSENT':

                    absent_count += 1

                # Add other status counts here if needed

                detailed_records.append({

                    'session_id': row[0],

                    'status': status,

                    'timestamp': str(row[2])

                })

        response_data = {'present_count': present_count, 'absent_count': absent_count, 'records': detailed_records,}

        total_session = present_count + absent_count

        if total_session > 0:

            response_data['attendance_percentage'] = (present_count / total_session) * 100

        else:

            response_data['attendance_percentage'] = 0.0

        response_data['total_session'] = total_session

        return jsonify(response_data), 200

    except MySQLdb.Error as e:

        app.logger.error(f"Database error in attendance_report: {e}")

        return jsonify({'message': 'Failed to retrieve attendance report due to a database error.'}), 500

    finally:

        if cur:

            cur.close()





# get all the students 

@app.route('/get_all_student', methods=['GET'])

def get_all_student():

    user_id, token_role = get_auth_user_from_request()

    raw_id = user_id or request.args.get('request_id') or request.args.get('id')

    if not raw_id:

        return jsonify({'message': 'request_id parameter or Bearer token is required.'}), 400

    try:

        request_id = int(raw_id)

    except ValueError:

        return jsonify({'message': 'request_id must be an integer.'}), 400

    cur = None

    try:

        cur = mysql.connection.cursor()     

        user_role = token_role

        if not user_role:

            cur.execute("SELECT role FROM user WHERE id = %s", (request_id,))

            user_role_result = cur.fetchone()

            if user_role_result:

                user_role = user_role_result[0]

        if not user_role or user_role not in ('ADMIN', 'TEACHER', 'SUPERADMIN'):

            return jsonify({'message': 'User not authorized to view students.'}), 403 

        # Multi-Institute Scoping: Fetch only students belonging to requester's institute
        inst_id = get_auth_institute_id()
        if not inst_id and request_id:
            cur.execute("SELECT institute_id FROM user WHERE id = %s", (request_id,))
            r = cur.fetchone()
            if r and r[0]:
                inst_id = r[0]

        filter_status = request.args.get('status')
        filter_batch = request.args.get('batch')
        query_conditions = []
        query_params = []

        if inst_id:
            query_conditions.append("institute_id = %s")
            query_params.append(inst_id)

        if filter_status and filter_status.upper() != 'ALL':
            query_conditions.append("UPPER(COALESCE(status, 'ACTIVE')) = %s")
            query_params.append(filter_status.upper())

        if filter_batch and filter_batch.upper() != 'ALL':
            query_conditions.append("batch = %s")
            query_params.append(filter_batch)

        where_clause = f"WHERE {' AND '.join(query_conditions)}" if query_conditions else ""
        cur.execute(f"""
            SELECT id, name, class, email, phone, COALESCE(status, 'ACTIVE'), 
                   COALESCE(course, ''), COALESCE(batch, ''), COALESCE(semester, '')
            FROM student 
            {where_clause}
            ORDER BY name ASC
        """, tuple(query_params))

        students = cur.fetchall()

        if not students:
            return jsonify({'student_count': 0, 'students': []}), 200

        response_data = []
        for row in students:
            response_data.append({
                'id': row[0],
                'name': row[1],
                'class': row[2],
                'email': row[3],
                'phone': row[4],
                'status': row[5] or 'ACTIVE',
                'course': row[6] or '',
                'batch': row[7] or '',
                'semester': row[8] or ''
            })

        return jsonify({'student_count': len(response_data), 'students': response_data}), 200

    except MySQLdb.Error as e:

        app.logger.error(f"Database error in get_students: {e}")

        return jsonify({'message': 'Failed to retrieve students due to a database error.'}), 500

    finally:

        if cur:

            cur.close()



# get student by class 

@app.route('/get_student_by_class', methods=['GET'])

def get_student_by_class():

    class_name = request.args.get('class_name')

    request_id = request.args.get('request_id')

    if not class_name or not request_id:

        return jsonify({'message': 'class_name and request_id parameters are required.'}), 400

    try:

        request_id = int(request_id)

    except ValueError:

        return jsonify({'message': 'request_id must be an integer.'}), 400

    cur = None

    try:

        cur = mysql.connection.cursor()

        # Check if the requesting user is an ADMIN or TEACHER

        cur.execute("SELECT role FROM user WHERE id = %s", (request_id,))

        user_role_result = cur.fetchone()

        if not user_role_result or user_role_result[0] not in ('ADMIN', 'TEACHER'):

            return jsonify({'message': 'User not authorized to view students.'}), 403

        # Fetch students by class

        cur.execute("SELECT id, name, class, email, phone FROM student WHERE class = %s", (class_name,))

        students = cur.fetchall()

        if not students:

            return jsonify({'message': 'No students found for this class.'}), 404

        response_data = []

        for row in students:

            response_data.append({

                'id': row[0],

                'name': row[1],

                'class': row[2],

                'email': row[3],

                'phone': row[4]

            })

        return jsonify({'student_count': len(response_data), 'students': response_data}), 200

    except MySQLdb.Error as e:

        app.logger.error(f"Database error in get_student_by_class: {e}")

        return jsonify({'message': 'Failed to retrieve students due to a database error.'}), 500

    finally:

        if cur:

            cur.close()





# update student

@app.route('/update_student', methods=['PUT'])

def update_student():

    data = request.get_json()

    request_id = data.get('request_id')

    student_id = data['student_id']

    if not request_id or not student_id:

        return jsonify({'message': 'request_id and student_id are required.'}), 400

    cur=None

    try:

        cur=mysql.connection.cursor()

        # Check if the requesting user is an ADMIN or TEACHER

        cur.execute("SELECT role FROM user WHERE id = %s", (request_id,))

        user_role_result = cur.fetchone()

        if not user_role_result or user_role_result[0] not in ('ADMIN', 'TEACHER'):

            return jsonify({'message': 'User not authorized to update students.'}), 403

        # Fetch the student details

        cur.execute("SELECT name, email, class, phone FROM student WHERE id = %s", (student_id,))

        student = cur.fetchone()

        if not student:

            return jsonify({'message': 'Student not found.'}), 404

        # Update the student details

        name = data.get('name', student[0])

        email = data.get('email', student[1])

        class_name = data.get('class', student[2])

        phone = data.get('phone', student[3])

        if not name or not email or not class_name or not phone:

            return jsonify({'message': 'name, email, class, and phone are required.'}), 400

        cur.execute("UPDATE student SET name=%s, email=%s, class=%s, phone=%s WHERE id=%s", (name, email, class_name, phone, student_id))

        mysql.connection.commit()

        return jsonify({'message': 'Student updated successfully!'}), 200

    except MySQLdb.Error as e:

        app.logger.error(f"Database error in update_student: {e}")

        mysql.connection.rollback()

        return jsonify({'message': 'Failed to update student due to a database error.'}), 500

    finally:

        if cur:

            cur.close()



# delete attendance for delete student (by student id )

@app.route('/delete_attendance_by_student_id', methods=['DELETE'])

def delete_attendance_by_student_id():

    data = request.get_json()

    student_id = data.get('student_id')

    request_id = data.get('request_id')

    if not student_id or not request_id:

        return jsonify({'message': 'student_id and request_id are required.'}), 400

    cur = None

    try:

        cur = mysql.connection.cursor()

        # Check if the requesting user is an ADMIN or TEACHER

        cur.execute("SELECT role FROM user WHERE id = %s", (request_id,))

        user_role_result = cur.fetchone()

        if user_role_result is None or user_role_result[0] not in ('ADMIN', 'TEACHER'):

            return jsonify({'message': 'User not authorized to delete attendance records.'}), 403

        # Check if the student exists

        cur.execute("SELECT id FROM student WHERE id = %s", (student_id,))

        student = cur.fetchone()

        if not student:

            return jsonify({'message': 'Student not found.'}), 404

        # Check if attendance records exist

        cur.execute("SELECT id FROM attendance WHERE student_id = %s", (student_id,))

        attendance_records = cur.fetchall()

        if not attendance_records:

            return jsonify({'message': 'No attendance records found for this student.'}), 404

        # Delete attendance records

        cur.execute("DELETE FROM attendance WHERE student_id = %s", (student_id,))

        mysql.connection.commit()

        return jsonify({'message': 'Attendance records deleted successfully!'}), 200

    except MySQLdb.Error as e:

        app.logger.error(f"Database error in delete_attendance_by_student_id: {e}")

        mysql.connection.rollback()

        return jsonify({'message': 'Failed to delete attendance records due to a database error.'}), 500

    finally:

        if cur:

            cur.close()



# delete student

@app.route('/delete_student', methods=['DELETE'])

def delete_student():

    data = request.get_json()

    student_id = data['student_id']

    request_id = data['request_id']

    if not student_id or not request_id:

        return jsonify({'message': 'student_id and request_id are required.'}), 400

    cur = None

    try:

        cur=mysql.connection.cursor()

        # Check if the requesting user is an ADMIN or TEACHER

        cur.execute("SELECT role FROM user WHERE id = %s", (request_id,))

        user_role_result = cur.fetchone()

        if not user_role_result or user_role_result[0] not in ('ADMIN', 'TEACHER'):

            return jsonify({'message': 'User not authorized to delete students.'}), 403

        # Check if the student exists

        cur.execute("SELECT id FROM student WHERE id = %s", (student_id,))

        student = cur.fetchone()

        if not student:

            return jsonify({'message': 'Student not found.'}), 404

        id = student[0]

        # Check if the student has any attendance records

        cur.execute("SELECT id FROM attendance WHERE student_id = %s", (id,))

        attendance = cur.fetchone()

        if attendance:

            return jsonify({'message': 'Cannot delete student with existing attendance records.'}), 400

        # Delete the student

        cur.execute("DELETE FROM student WHERE id = %s", (id,))

        mysql.connection.commit()

        return jsonify({'message': 'Student deleted successfully!'}), 200

    except MySQLdb.Error as e:

        app.logger.error(f"Database error in delete_student: {e}")

        mysql.connection.rollback()

        return jsonify({'message': 'Failed to delete student due to a database error.'}), 500

    finally:

        if cur:

            cur.close()  



# delete attendance_by_session

@app.route('/delete_attendance_by_session', methods=['DELETE'])

def delete_attendance_by_session():

    data=request.get_json()

    request_id=data['request_id'] #user id 

    id=data['id'] #session id

    if not request_id or not id :

        return jsonify({'message': 'request_id and id are required!'}),400

    cur = None

    try:

        cur=mysql.connection.cursor()

        # Check if the requesting user is an ADMIN or TEACHER

        cur.execute("SELECT role FROM user WHERE id = %s", (request_id,))

        user_role_result = cur.fetchone()

        if not user_role_result or user_role_result[0] not in ('ADMIN', 'TEACHER'):

            return jsonify({'message': 'User not authorized to delete attendance records.'}), 403

        # check if the session is exist or not 

        cur.execute("SELECT id FROM session WHERE id = %s", (id,))

        session = cur.fetchone()

        if not session:

            return jsonify({'message' : 'session not found'}), 404

        # check attendance record 

        cur.execute("SELECT id FROM attendance WHERE session_id = %s", (id,))

        attendance = cur.fetchone()

        if not attendance:

            return jsonify({'message': 'No attendance records found for this session.'}), 404

        # Delete attendance records for the session

        cur.execute("DELETE FROM attendance WHERE session_id = %s", (id,))

        mysql.connection.commit()

        return jsonify({'message': 'Attendance records deleted successfully!'}), 200

    except MySQLdb.Error as e:

        app.logger.error(f"Database error in delete_attendance_by_session: {e}")

        mysql.connection.rollback()

        return jsonify({'message': 'Failed to delete attendance records due to a database error.'}), 500

    finally:

        if cur:

            cur.close()



# delete session

@app.route('/delete_session', methods=['DELETE'])

def delete_session():

    data = request.get_json()

    request_id=data['request_id']

    id = data['id']

    if not request_id or not id :

        return jsonify({'message':'request_id and id are required'}), 400

    cur = None

    try:

        cur = mysql.connection.cursor()

        # check the requesting user is an ADMIN or a TEACHER

        cur.execute("SELECT role FROM user WHERE id = %s ",(request_id,))

        user_role_result=cur.fetchone()

        if not user_role_result or user_role_result[0] not in ('ADMIN', 'TEACHER'):

            return jsonify({'message': 'User not authorized to delete attendance records.'}), 403

        # check if session is exist or not 

        cur.execute("SELECT id FROM session WHERE id = %s",(id,))

        session = cur.fetchone()

        if not session:

            return jsonify({'message' : 'session not found'}), 404

        cur.execute("DELETE FROM session WHERE id = %s",(id,))

        mysql.connection.commit()

        return jsonify({'message': 'Session deleted successfully!'}), 200

    except MySQLdb.Error as e:

        app.logger.error(f"Database error in delete_session: {e}")

        mysql.connection.rollback()

        return jsonify({'message': 'Failed to delete session due to a database error.'}), 500

    finally:

        if cur:

            cur.close()

    



# get all the sessions

@app.route('/get_sessions', methods=['GET'])

def get_sessions():

    user_id, token_role = get_auth_user_from_request()

    id = user_id or request.args.get('id') or request.args.get('request_id')

    cur = None

    try:

        cur = mysql.connection.cursor()

        user_role = token_role

        if not user_role and id:

            cur.execute("SELECT role FROM user WHERE id = %s", (id,))

            user_role_result = cur.fetchone()

            if user_role_result:

                user_role = user_role_result[0]

        if not user_role or user_role not in ('ADMIN', 'TEACHER', 'SUPERADMIN'):

            return jsonify({'message': 'User not authorized to view sessions.'}), 403

        # Multi-Institute Scoping: Fetch only sessions belonging to requester's institute
        inst_id = get_auth_institute_id()
        if not inst_id and id:
            cur.execute("SELECT institute_id FROM user WHERE id = %s", (id,))
            r = cur.fetchone()
            if r and r[0]:
                inst_id = r[0]

        if inst_id:
            cur.execute("SELECT id, session_name, session_code, expiry_time, created_by, class, latitude, longitude FROM session WHERE institute_id = %s", (inst_id,))
        else:
            cur.execute("SELECT id, session_name, session_code, expiry_time, created_by, class, latitude, longitude FROM session")

        sessions = cur.fetchall()

        if not sessions:

            return jsonify({'session_count': 0, 'sessions': []}), 200

        # Format the session data

        result = []

        for row in sessions:

            # get creater name for more clarity

            create=row[4]

            cur.execute("SELECT name FROM user WHERE id = %s", (create,))

            created_by = cur.fetchone()

            creator_name = created_by[0] if created_by else "Unknown"

            result.append({

                'id': row[0],

                'session_name': row[1],

                'session_code': row[2],

                'expiry_time': str(row[3]),

                'created_by': row[4],

                'created_by_name': creator_name,

                'class': row[5],

            })

        return jsonify({'session_count': len(result), 'sessions': result}), 200

    except MySQLdb.Error as e:

        app.logger.error(f"Database error in get_sessions: {e}")

        return jsonify({'message': 'Failed to retrieve sessions due to a database error.'}), 500

    finally:

        if cur:

            cur.close()

            

# get specific session's attendance

@app.route('/get_session_attendance', methods=['GET'])

def get_session_attendance():
    session_id = request.args.get('session_id')
    user_id, token_role = get_auth_user_from_request()
    raw_request_id = user_id or request.args.get('request_id') or request.args.get('id')
    if not session_id or not raw_request_id:
        return jsonify({'message': 'session_id and request_id are required.'}), 400
    cur = None
    try:
        session_id = int(session_id)
        request_id = int(raw_request_id)
        cur = mysql.connection.cursor()
        user_role = token_role
        if not user_role:
            cur.execute("SELECT role FROM user WHERE id = %s", (request_id,))
            user_role_result = cur.fetchone()
            if user_role_result:
                user_role = user_role_result[0]
        if not user_role or user_role not in ('ADMIN', 'TEACHER', 'SUPERADMIN'):
            return jsonify({'message': 'User not authorized to view attendance.'}), 403

        # check if session exists

        cur.execute("SELECT id FROM session WHERE id = %s", (session_id,))

        session_result = cur.fetchone()

        if not session_result:

            return jsonify({'message': 'Session not found.'}), 404

        # fetch the session name 

        cur.execute("SELECT session_name FROM session WHERE id = %s", (session_id,))

        session_name_result = cur.fetchone()

        session_name = session_name_result[0] if session_name_result else "Unknown"

        # check if attendance records exist for the session

        cur.execute("SELECT id FROM attendance WHERE session_id = %s", (session_id,))

        attendance_result = cur.fetchone()

        if not attendance_result:

            return jsonify({'message': 'No attendance records found for this session.'}), 404

        # Fetch attendance records

        cur.execute("SELECT * FROM attendance WHERE session_id = %s", (session_id,))

        records = cur.fetchall()

        if not records:

            return jsonify({'message': 'No attendance records found for this session'}), 404

        result = []

        for row in records:

            cur.execute("SELECT name FROM student WHERE id = %s", (row[1],))

            student_name = cur.fetchone()

            student_name = student_name[0] if student_name else "Unknown"

            result.append({

                'student_id': row[1],

                'student_name': student_name,

                'status': row[3],

                'timestamp': str(row[4]) if row[4] else None

            })

        cur.close()

        return jsonify({'session_name': session_name, 'attendance_records': result, 'record_count': len(result)}), 200

    except ValueError:

        return jsonify({'message': 'session_id and request_id must be integers.'}), 400

    except MySQLdb.Error as e:

        app.logger.error(f"Database error in get_session_attendance: {e}")

        mysql.connection.rollback()

        return jsonify({'message': 'Failed to retrieve session attendance due to a database error.'}), 500

    finally:

        if cur:

            cur.close()



# bulk student import from excel sheet 



# allow file upload 

UPLOAD_FOLDER = 'uploads'

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

app.config['MAX_CONTENT_LENGTH'] = 16*1024*1024 #16mb

allowed_extensions = {'xlsx', 'xls'}

def allowed_file(filename):

    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions

# import students from excel sheet

@app.route('/import_students', methods=['POST'])

def import_students():

    request_id = request.form.get('request_id')

    if not request_id:

        return jsonify({'message': 'request_id is required.'}), 400

    try:

        request_id = int(request_id)

    except ValueError:

        return jsonify({'message': 'request_id must be an integer.'}), 400

        

    cur = None

    try:

        cur = mysql.connection.cursor()

        # Check if the requesting user is an ADMIN or TEACHER

        cur.execute("SELECT role FROM user WHERE id = %s", (request_id,))

        user_role_result = cur.fetchone()

        if not user_role_result or user_role_result[0] not in ('ADMIN', 'TEACHER'):

            return jsonify({'message': 'User not authorized to import students.'}), 403

            

        if 'file' not in request.files:

            return jsonify({'message': 'No file part'}), 400

            

        file = request.files['file']

        if file.filename == '':

            return jsonify({'message': 'No selected file'}), 400

            

        if not allowed_file(file.filename):

            return jsonify({'message': 'Invalid file type. Only .xlsx and .xls files are allowed.'}), 400

            

        filename = secure_filename(file.filename)

        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)

        file.save(filepath)

        

        # FIX: Catch corrupted or unreadable Excel files safely

        try:

            df = pd.read_excel(filepath)

        except Exception as e:

            os.remove(filepath)

            app.logger.error(f"Pandas failed to read excel file: {e}")

            return jsonify({'message': 'Failed to read the Excel file. It may be corrupted or empty.'}), 400

            

        expected_columns = {'id', 'name', 'class', 'email', 'phone'}

        if not expected_columns.issubset(df.columns):

            os.remove(filepath)

            return jsonify({'message': f'Excel file must contain the following columns: {", ".join(expected_columns)}'}), 400

            

        student_count = 0

        for index, row in df.iterrows():

            id = row['id']

            name = row['name']

            class_name = row['class']

            email = row['email']

            phone = str(row['phone']).split('.')[0] 

            

            cur.execute("SELECT id FROM student WHERE id = %s", (id,))

            student = cur.fetchone()

            if student:

                continue 

                

            default_password = phone

            hashed_password = generate_password_hash(default_password)

            

            cur.execute("""

                INSERT INTO student (id, name, class, email, phone, password) 

                VALUES (%s, %s, %s, %s, %s, %s)

            """, (id, name, class_name, email, phone, hashed_password))

            

            student_count += 1

            

        mysql.connection.commit()

        os.remove(filepath)

        

        return jsonify({

            'message': 'Students imported successfully! Their default password is their phone number.', 

            'student_count': student_count

        }), 201

        

    except MySQLdb.Error as e:

        app.logger.error(f"Database error in import_students: {e}")

        mysql.connection.rollback()

        return jsonify({'message': 'Failed to import students due to a database error.'}), 500

    except Exception as e:

        app.logger.error(f"Unexpected error in import_students: {e}")

        return jsonify({'message': 'An unexpected error occurred while importing students.'}), 500

    finally:

        if cur:

            cur.close()



            

# register user

@app.route('/register_user', methods=['POST'])
def register_user():
    """
    User registration endpoint with strict Role-Based Access Control (RBAC):
    - ADMIN accounts can ONLY be created by the SUPERADMIN (Platform Master Owner).
    - TEACHER accounts can ONLY be created by an authenticated ADMIN of that institute.
    - Public self-signup is strictly disabled.
    """
    user_id, token_role = get_auth_user_from_request()
    data = request.get_json() or {}
    name = (data.get('name') or '').strip()
    email = (data.get('email') or '').strip().lower()
    phone = (data.get('phone') or '').strip()
    password = (data.get('password') or '').strip()
    role = (data.get('role') or '').strip().upper()

    if not all([name, email, phone, password, role]):
        return jsonify({'message': 'All fields (name, email, phone, password, role) are required!'}), 400

    cur = None
    try:
        cur = mysql.connection.cursor()

        # Resolve requester role
        requester_role = token_role
        requester_inst_id = get_auth_institute_id()
        if not requester_role and user_id:
            cur.execute("SELECT role, institute_id FROM user WHERE id = %s", (user_id,))
            r = cur.fetchone()
            if r:
                requester_role = r[0]
                if not requester_inst_id:
                    requester_inst_id = r[1]

        # Enforce Permissions
        if role == 'ADMIN':
            return jsonify({
                'message': 'Campus Admins must register their institute to sign up. Please use the institute registration portal.'
            }), 400
        elif role == 'TEACHER':
            if requester_role not in ('ADMIN', 'SUPERADMIN'):
                return jsonify({
                    'message': 'Forbidden: Teachers cannot self-signup. They must be enrolled by their Campus Admin.'
                }), 403
        else:
            return jsonify({
                'message': 'Forbidden: Public registration is disabled. Users and students must be enrolled by their institute administrator.'
            }), 403

        # Check if email already exists
        cur.execute("SELECT id FROM user WHERE email = %s", (email,))
        if cur.fetchone():
            return jsonify({'message': 'User already exists with this email!'}), 409

        # Target institute_id
        target_inst_id = data.get('institute_id') or requester_inst_id or 1

        hashed_password = generate_password_hash(password)
        cur.execute("""
            INSERT INTO user (name, email, phone, password, role, institute_id)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (name, email, phone, hashed_password, role, target_inst_id))
        mysql.connection.commit()

        new_id = cur.lastrowid
        return jsonify({
            'message': f'{role} registered successfully!',
            'user_id': new_id,
            'role': role,
            'institute_id': target_inst_id
        }), 201

    except Exception as e:
        app.logger.error(f"Error in register_user: {e}")
        mysql.connection.rollback()
        return jsonify({'message': 'Failed to register user due to a server error.'}), 500
    finally:
        if cur:
            cur.close()


@app.route('/login_user' , methods=['POST'])

def login_user():

    data = request.get_json()

    email = data.get('email')

    password = data.get('password')



    if not email or not password:

        return jsonify({'message': 'Email and password are required!'}), 400



    cur = None

    try: 

        cur = mysql.connection.cursor()

        # Fetch the stored hash, id, and role based on email

        cur.execute("""
            SELECT u.id, u.role, u.password, u.name, u.institute_id, i.name, i.code 
            FROM user u
            LEFT JOIN institute i ON i.id = u.institute_id
            WHERE u.email=%s
        """, (email,))

        user = cur.fetchone()

        if user and check_password_hash(user[2], password):
            user_id = user[0]
            role = user[1]
            user_name = user[3]
            institute_id = user[4] or 1
            institute_name = user[5] or "Greenwood International School"
            institute_code = user[6] or "GW-001"

            if role not in ('ADMIN', 'TEACHER', 'SUPERADMIN'):
                return jsonify({'message': 'Unauthorized login role!'}), 403

            token = generate_auth_token(user_id, role, name=user_name, institute_id=institute_id)
            return jsonify({
                'message': 'Login successful!',
                'user_id': user_id,
                'name': user_name,
                'role': role,
                'institute_id': institute_id,
                'institute_name': institute_name,
                'institute_code': institute_code,
                'token': token
            }), 200

        else:

            return jsonify({'message': 'Invalid credentials! Please use valid information or signup'}), 401



    except MySQLdb.Error as e:

        app.logger.error(f"Database error in login_user: {e}")

        return jsonify({'message': 'Failed to login due to a database error.'}), 500

    except Exception as e:

        app.logger.error(f"Unexpected error in login_user: {e}")

        return jsonify({'message': 'An unexpected error occurred while logging in.'}), 500

    finally:

        if cur:

            cur.close()







# delete teacher

@app.route('/delete_teacher', methods=['DELETE'])

def delete_teacher():

    data = request.get_json()

    id = data.get('id')

    request_id = data.get('request_id')

    if not id or not request_id:

        return jsonify({'message': 'id and request_id are required!'}), 400

    try:

        id = int(id)

        request_id = int(request_id)

    except ValueError:

        return jsonify({'message': 'id and request_id must be integers!'}), 400

    cur = None

    try:

        cur = mysql.connection.cursor()

        # Check if the requesting user is an ADMIN or not 

        cur.execute("SELECT role FROM user WHERE id = %s", (request_id,))

        user_role_result = cur.fetchone()

        if not user_role_result or user_role_result[0] != 'ADMIN':

            return jsonify({'message': 'Only admin can delete teacher!'}), 403

        cur.execute("SELECT role FROM user WHERE id = %s", (id,))

        role = cur.fetchone()

        if not role or role[0] != 'TEACHER':

            return jsonify({'message': 'Teacher not found!'}), 404

        # delete teacher info 

        cur.execute("SELECT name,email,phone FROM user WHERE id = %s", (id,))

        result = cur.fetchone()

        teacher={"name": result[0], "email": result[1], "phone": result[2]}

        # delete teacher

        cur.execute("DELETE FROM user WHERE id = %s", (id,))

        mysql.connection.commit()

        return jsonify({'message': 'Teacher deleted successfully!', 'teacher': teacher}), 200

    except MySQLdb.Error as e:

        app.logger.error(f"Database error in delete_teacher: {e}")

        mysql.connection.rollback()

        return jsonify({'message': 'Failed to delete teacher due to a database error.'}), 500

    except Exception as e:

        app.logger.error(f"Unexpected error in delete_teacher: {e}")

        return jsonify({'message': 'An unexpected error occurred while deleting teacher.'}), 500

    finally:

        if cur:

            cur.close()

    

# get all the teachers

@app.route('/get_teachers', methods=['GET'])

def get_teachers():

    user_id, token_role = get_auth_user_from_request()

    raw_id = user_id or request.args.get('request_id') or request.args.get('id')

    if not raw_id:

        return jsonify({'message': 'request_id is required!'}), 400

    try:

        request_id = int(raw_id)

    except ValueError:

        return jsonify({'message': 'request_id must be an integer!'}), 400

    cur = None

    try:

        cur=mysql.connection.cursor()

        user_role = token_role

        if not user_role and request_id:

            cur.execute("SELECT role FROM user WHERE id = %s", (request_id,))

            user_role_result = cur.fetchone()

            if user_role_result:

                user_role = user_role_result[0]

        if not user_role or user_role != 'ADMIN':

            return jsonify({'message': 'Only admin can view teachers!'}), 403

        # Multi-Institute Scoping: Fetch only teachers belonging to requester's institute
        inst_id = get_auth_institute_id()
        if not inst_id and request_id:
            cur.execute("SELECT institute_id FROM user WHERE id = %s", (request_id,))
            r = cur.fetchone()
            if r and r[0]:
                inst_id = r[0]

        if inst_id:
            cur.execute("SELECT id, name, email, phone, password, role FROM user WHERE role='TEACHER' AND institute_id = %s", (inst_id,))
        else:
            cur.execute("SELECT id, name, email, phone, password, role FROM user WHERE role='TEACHER'")

        teachers=cur.fetchall()

        if not teachers:

            return jsonify({'teacher_count': 0, 'teachers': []}), 200

        result = [{'id': row[0], 'name': row[1], 'email': row[2], 'phone' : row[3], 'role': row[5]} for row in teachers]

        return jsonify({'teacher_count': len(result), 'teachers': result}), 200

    except MySQLdb.Error as e:

        app.logger.error(f"Database error in get_teachers: {e}")

        return jsonify({'message': 'Failed to retrieve teachers due to a database error.'}), 500

    except Exception as e:

        app.logger.error(f"Unexpected error in get_teachers: {e}")

        return jsonify({'message': 'An unexpected error occurred while retrieving teachers.'}), 500

    finally:

        if cur:

            cur.close()



# add teacher

@app.route('/add_teacher', methods=['POST'])

def add_teacher():

    data = request.get_json() or {}

    user_id, _ = get_auth_user_from_request()

    request_id = data.get('request_id') or data.get('requesting_user_id') or user_id

    name = data.get('name')

    email = data.get('email')

    phone = data.get('phone')

    password = data.get('password')

    

    if not all([request_id, name, email, phone, password]):

        return jsonify({'message': 'All fields are required!'}), 400

        

    # FIX: Hash the password securely before saving

    hashed_password = generate_password_hash(password)

    

    cur = None

    try:

        cur = mysql.connection.cursor()

        # Check if the requesting user is an ADMIN

        cur.execute("SELECT role FROM user WHERE id = %s", (request_id,))

        user_role_result = cur.fetchone()

        if not user_role_result or user_role_result[0] != 'ADMIN':

            return jsonify({'message': 'Only admin can add teacher!'}), 403

            

        # Check if the teacher already exists

        cur.execute("SELECT email FROM user WHERE email = %s", (email,))

        existing_teacher = cur.fetchone()

        if existing_teacher:

            return jsonify({'message': 'Teacher already exists with this email!'}), 400

            

        # Check if the phone number is already in use

        cur.execute("SELECT phone FROM user WHERE phone = %s", (phone,))

        existing_phone = cur.fetchone()

        if existing_phone:

            return jsonify({'message': 'Phone number already in use!'}), 400

            

        # FIX: Insert the new teacher with the hashed_password

        inst_id = data.get('institute_id') or get_auth_institute_id()
        if not inst_id and request_id:
            cur.execute("SELECT institute_id FROM user WHERE id = %s", (request_id,))
            r = cur.fetchone()
            if r and r[0]:
                inst_id = r[0]
        if not inst_id:
            inst_id = 1

        cur.execute("INSERT INTO user (name, email, phone, password, role, institute_id) VALUES (%s, %s, %s, %s, %s, %s)",
                    (name, email, phone, hashed_password, 'TEACHER', inst_id))

        mysql.connection.commit()

        

        new_teacher_id = cur.lastrowid

        return jsonify({'message': 'Teacher added successfully!', 'teacher_id': new_teacher_id}), 201

        

    except MySQLdb.Error as e:

        app.logger.error(f"Database error in add_teacher: {e}")

        mysql.connection.rollback()

        return jsonify({'message': 'Failed to add teacher due to a database error.'}), 500

    except Exception as e:

        app.logger.error(f"Unexpected error in add_teacher: {e}")

        return jsonify({'message': 'An unexpected error occurred while adding teacher.'}), 500

    finally:

        if cur:

            cur.close()



# update teacher

@app.route('/update_teacher', methods=['PUT'])

def update_teacher():

    data = request.get_json()

    request_id = data['request_id']

    id = data['id']

    try:

        request_id=int(request_id)

        id=int(id)

    except ValueError as e:

        return jsonify({'message': 'ids must be integers'})

    cur = None

    try:

        cur = mysql.connection.cursor()

        # check the request id is admin or teacher

        cur.execute("SELECT role FROM user WHERE id = %s", (request_id,))

        user_role = cur.fetchone()

        if not user_role or user_role[0] not in ('ADMIN', 'TEACHER'):

            return jsonify({'message': 'User not authorized to update teacher.'}), 403

        # CHECK teacher is exit or not 

        cur.execute("SELECT role FROM user WHERE id = %s", (id,))

        teacher = cur.fetchone()

        if not teacher:

            return jsonify({'message': 'Teacher not found.'}), 404

        if teacher[0] != 'TEACHER':

            return jsonify({'message': 'User is not a teacher.'}), 400

        # extract the old data

        cur.execute("SELECT * FROM user where id = %s",(id,))

        old_data = cur.fetchall()

        # update teacher info

        name = data.get('name')

        email = data.get('email')

        phone = data.get('phone')

        # if new data is not provide then use the previous data 

        if not name:

            name = old_data[0][1]

        if not email:

            email = old_data[0][2]

        if not phone:

            phone = old_data[0][3]

        cur.execute("UPDATE user SET name=%s, email=%s, phone=%s WHERE id=%s ",(name,email,phone,id))

        mysql.connection.commit()

        return jsonify({'message': 'teacher details update sucessfully'}),200

    except MySQLdb.Error as e:

        app.logger.error(f"Database error in update_teacher: {e}")

        mysql.connection.rollback()

        return jsonify({'message': 'Failed to update teacher due to a database error.'}), 500

    except Exception as e:

        app.logger.error(f"Unexpected error in update_teacher: {e}")

        return jsonify({'message': 'An unexpected error occurred while updating teacher.'}), 500

    finally:

        if cur:

            cur.close()



# student login

@app.route('/update_student_status', methods=['POST'])
def update_student_status():
    """
    Update a student's status (e.g. 'ACTIVE', 'LEFT', 'GRADUATED').
    Preserves all historical attendance records, logs, and stats for institute compliance.
    Restricted to Campus Admin, Teacher, or Superadmin of that student's institute.
    """
    user_id, token_role = get_auth_user_from_request()
    data = request.get_json() or {}
    student_id = data.get('student_id')
    new_status = (data.get('status') or 'ACTIVE').strip().upper()

    if not student_id or new_status not in ('ACTIVE', 'LEFT', 'GRADUATED'):
        return jsonify({'message': 'student_id and a valid status (ACTIVE, LEFT, GRADUATED) are required.'}), 400

    cur = None
    try:
        cur = mysql.connection.cursor()
        requester_role = token_role
        requester_inst_id = get_auth_institute_id()
        if not requester_role and user_id:
            cur.execute("SELECT role, institute_id FROM user WHERE id = %s", (user_id,))
            r = cur.fetchone()
            if r:
                requester_role = r[0]
                if not requester_inst_id:
                    requester_inst_id = r[1]

        if requester_role not in ('ADMIN', 'TEACHER', 'SUPERADMIN'):
            return jsonify({'message': 'Forbidden: Only administrators and teachers can update student status.'}), 403

        # Verify student exists and belongs to requester's institute
        cur.execute("SELECT id, name, institute_id, COALESCE(status, 'ACTIVE') FROM student WHERE id = %s", (student_id,))
        student_row = cur.fetchone()
        if not student_row:
            return jsonify({'message': f'Student with ID {student_id} not found.'}), 404

        stud_inst_id = student_row[2]
        if requester_role != 'SUPERADMIN' and requester_inst_id and stud_inst_id and requester_inst_id != stud_inst_id:
            return jsonify({'message': 'Forbidden: You cannot modify students from another institute.'}), 403

        # Update status
        cur.execute("UPDATE student SET status = %s WHERE id = %s", (new_status, student_id))
        mysql.connection.commit()

        action_word = "marked as left" if new_status == 'LEFT' else "reactivated"
        return jsonify({
            'message': f"Student {student_row[1]} (ID: {student_id}) successfully {action_word}. Historical attendance data is fully preserved.",
            'student_id': student_id,
            'status': new_status
        }), 200

    except Exception as e:
        app.logger.error(f"Error in update_student_status: {e}")
        mysql.connection.rollback()
        return jsonify({'message': f'Failed to update student status: {str(e)}'}), 500
    finally:
        if cur:
            cur.close()


@app.route('/promote_batch', methods=['POST'])
def promote_batch():
    """
    Batch promotion of a cohort/batch from one semester to the next.
    Example: '2026-2030 CSE Batch' moving from 'Sem 1' to 'Sem 2'.
    
    Security & Multi-Tenant Rules:
    - Only Campus Admin or Teacher of that institute can promote.
    - Previous semester record is marked as COMPLETED in student_class_history.
    - All past attendance records from Sem 1 are 100% frozen and preserved.
    - New active semester record created in student_class_history.
    - Student's active class updated to '{batch} - {to_semester}'.
    """
    user_id, token_role = get_auth_user_from_request()
    data = request.get_json() or {}
    student_ids = data.get('student_ids') or []
    batch = (data.get('batch') or '').strip()
    course = (data.get('course') or '').strip()
    from_semester = (data.get('from_semester') or '').strip()
    to_semester = (data.get('to_semester') or '').strip()
    academic_year = (data.get('academic_year') or '2026-2027').strip()

    if not student_ids or not to_semester:
        return jsonify({'message': 'student_ids and to_semester are required for batch promotion!'}), 400

    cur = None
    try:
        cur = mysql.connection.cursor()
        requester_role = token_role
        requester_inst_id = get_auth_institute_id()
        if not requester_role and user_id:
            cur.execute("SELECT role, institute_id FROM user WHERE id = %s", (user_id,))
            r = cur.fetchone()
            if r:
                requester_role = r[0]
                if not requester_inst_id:
                    requester_inst_id = r[1]

        if requester_role not in ('ADMIN', 'TEACHER', 'SUPERADMIN'):
            return jsonify({'message': 'Forbidden: Only administrators and teachers can promote batches.'}), 403

        target_class_name = (data.get('target_class') or (f"{batch} - {to_semester}" if batch else to_semester)).strip()
        promoted_count = 0

        for sid in student_ids:
            cur.execute("SELECT id, name, institute_id, class, COALESCE(course, ''), COALESCE(batch, ''), COALESCE(semester, '') FROM student WHERE id = %s", (sid,))
            st = cur.fetchone()
            if not st:
                continue

            st_inst = st[2]
            if requester_role != 'SUPERADMIN' and requester_inst_id and st_inst and requester_inst_id != st_inst:
                continue

            current_course = course or st[4]
            current_batch = batch or st[5] or st[3]
            old_semester = from_semester or st[6] or 'Sem 1'

            # 1. Archive previous semester history as COMPLETED
            cur.execute("""
                UPDATE student_class_history 
                SET status = 'COMPLETED' 
                WHERE student_id = %s AND status = 'ACTIVE'
            """, (sid,))

            # 2. Insert new semester history as ACTIVE
            cur.execute("""
                INSERT INTO student_class_history 
                (student_id, institute_id, course, batch, semester, class_name, academic_year, status, promoted_by)
                VALUES (%s, %s, %s, %s, %s, %s, %s, 'ACTIVE', %s)
            """, (sid, st_inst, current_course, current_batch, to_semester, target_class_name, academic_year, user_id or 1))

            # 3. Update student table active class, course, batch, and semester
            cur.execute("""
                UPDATE student 
                SET class = %s, course = %s, batch = %s, semester = %s
                WHERE id = %s
            """, (target_class_name, current_course, current_batch, to_semester, sid))

            promoted_count += 1

        mysql.connection.commit()

        return jsonify({
            'message': f'Successfully promoted {promoted_count} students to {to_semester} ({target_class_name})! All past semester attendance records are permanently preserved.',
            'promoted_count': promoted_count,
            'batch': batch,
            'to_semester': to_semester,
            'target_class': target_class_name
        }), 200

    except Exception as e:
        app.logger.error(f"Error in promote_batch: {e}")
        mysql.connection.rollback()
        return jsonify({'message': f'Failed to promote batch: {str(e)}'}), 500
    finally:
        if cur:
            cur.close()


@app.route('/student_history', methods=['GET'])
def get_student_history():
    """
    Get full semester progression timeline and historical attendance for a student.
    """
    student_id = request.args.get('student_id')
    if not student_id:
        return jsonify({'message': 'student_id is required!'}), 400

    cur = None
    try:
        cur = mysql.connection.cursor()
        cur.execute("""
            SELECT id, course, batch, semester, class_name, academic_year, status, promoted_at
            FROM student_class_history
            WHERE student_id = %s
            ORDER BY id ASC
        """, (int(student_id),))
        rows = cur.fetchall()

        history = []
        for r in rows:
            cls_name = r[4]
            sem_name = r[3] or ''

            cur.execute("""
                SELECT COUNT(a.id)
                FROM attendance a
                JOIN session s ON a.session_id = s.id
                WHERE a.student_id = %s AND (s.class = %s OR s.class LIKE %s)
            """, (int(student_id), cls_name, f"%{sem_name}%"))
            attended = cur.fetchone()[0] or 0

            cur.execute("""
                SELECT COUNT(id)
                FROM session
                WHERE class = %s OR class LIKE %s
            """, (cls_name, f"%{sem_name}%"))
            total_sessions = cur.fetchone()[0] or 0

            att_pct = round((attended / total_sessions * 100), 1) if total_sessions > 0 else 100.0

            history.append({
                'history_id': r[0],
                'course': r[1] or '',
                'batch': r[2] or '',
                'semester': sem_name,
                'class_name': cls_name,
                'academic_year': r[5] or '',
                'status': r[6] or 'ACTIVE',
                'promoted_at': str(r[7]) if r[7] else '',
                'attended_sessions': attended,
                'total_sessions': total_sessions,
                'attendance_percentage': att_pct
            })

        return jsonify({'student_id': int(student_id), 'history': history}), 200

    except Exception as e:
        app.logger.error(f"Error in get_student_history: {e}")
        return jsonify({'message': f'Failed to get student history: {str(e)}'}), 500
    finally:
        if cur:
            cur.close()


@app.route('/get_batches', methods=['GET'])
def get_batches():
    """
    Returns unique courses and batches for the institute (e.g. '2026-2030 CSE Batch').
    """
    inst_id = get_auth_institute_id()
    cur = None
    try:
        cur = mysql.connection.cursor()
        if inst_id:
            cur.execute("""
                SELECT DISTINCT batch, course 
                FROM student 
                WHERE institute_id = %s AND batch IS NOT NULL AND batch != ''
                ORDER BY batch ASC
            """, (inst_id,))
        else:
            cur.execute("""
                SELECT DISTINCT batch, course 
                FROM student 
                WHERE batch IS NOT NULL AND batch != ''
                ORDER BY batch ASC
            """)
        rows = cur.fetchall()
        batches = [{'batch': r[0], 'course': r[1] or ''} for r in rows]
        return jsonify({'batches': batches}), 200
    except Exception as e:
        app.logger.error(f"Error in get_batches: {e}")
        return jsonify({'message': f'Failed to get batches: {str(e)}'}), 500
    finally:
        if cur:
            cur.close()

@app.route('/student_login', methods=['POST'])

def student_login():

    data = request.get_json() or {}

    ident = str(data.get('id') or data.get('email') or '').strip()

    password = data.get('password')



    if not ident or not password:

        return jsonify({'message': 'Student ID or Email, and password are required!'}), 400



    cur = None

    try:

        cur = mysql.connection.cursor()

        if ident.isdigit():

            cur.execute("SELECT * FROM student WHERE id = %s", (int(ident),))

        else:

            cur.execute("SELECT * FROM student WHERE email = %s", (ident,))

        student = cur.fetchone()

        

        if not student:

            return jsonify({'message': 'Student not found!'}), 404

            

        # FIX: Validate using check_password_hash 

        # (Assuming password is the 6th column, index 5)

        if not check_password_hash(student[5], password):

            return jsonify({'message': 'Invalid credentials!'}), 401

            

        inst_id = student[6] if len(student) > 6 and student[6] else 1
        cur.execute("SELECT name, code FROM institute WHERE id = %s", (inst_id,))
        inst_row = cur.fetchone()
        inst_name = inst_row[0] if inst_row else "Greenwood International School"
        inst_code = inst_row[1] if inst_row else "GW-001"

        result = {
            'id': student[0],
            'name': student[1],
            'class': student[2],
            'email': student[3],
            'phone': student[4],
            'institute_id': inst_id,
            'institute_name': inst_name,
            'institute_code': inst_code
        }

        token = generate_auth_token(student[0], 'STUDENT', name=student[1], institute_id=inst_id)

        return jsonify({
            'message': 'Login successful!',
            'student': result,
            'student_id': student[0],
            'name': student[1],
            'class': student[2],
            'institute_id': inst_id,
            'institute_name': inst_name,
            'institute_code': inst_code,
            'token': token
        }), 200

        

    except MySQLdb.Error as e:

        app.logger.error(f"Database error in student_login: {e}")

        return jsonify({'message': 'Failed to login due to a database error.'}), 500

    except Exception as e:

        app.logger.error(f"Unexpected error in student_login: {e}")

        return jsonify({'message': 'An unexpected error occurred while logging in.'}), 500

    finally:

        if cur:

            cur.close()  





# ================================

# Run the App

# ================================

if __name__ == '__main__':

    app.run(debug=True)



# ==========================================
# Multi-Institute Management Routes
# ==========================================

@app.route('/get_institutes', methods=['GET'])
def get_institutes():
    """Returns all registered institutes for selection or directory."""
    cur = None
    try:
        cur = mysql.connection.cursor()
        cur.execute("SELECT id, name, code, address, created_at FROM institute ORDER BY name ASC")
        rows = cur.fetchall()
        result = [
            {
                'id': r[0],
                'name': r[1],
                'code': r[2],
                'address': r[3],
                'created_at': str(r[4]) if r[4] else None
            }
            for r in rows
        ]
        return jsonify({'institutes': result, 'count': len(result)}), 200
    except Exception as e:
        app.logger.error(f"Error in get_institutes: {e}")
        return jsonify({'message': 'Failed to retrieve institutes.'}), 500
    finally:
        if cur:
            cur.close()


@app.route('/register_institute', methods=['POST'])
def register_institute():
    """
    Onboard a brand new Institute and its Founding Campus Administrator.
    Can be called by:
    1. A new Admin registering their institute (Admin must register an institute to signup).
    2. Platform Master Owner (SUPERADMIN) to onboard institutes from the master console.
    
    Security & Multi-Tenant Rules:
    - Admin signup MUST register an institute. Admin cannot exist without their institute.
    - Institute Code is strictly unique. No other admin can register or overwrite an existing institute.
    - Institute Name is strictly unique.
    - Admin Email must be unique across all users and students.
    """
    user_id, token_role = get_auth_user_from_request()
    cur = None
    try:
        cur = mysql.connection.cursor()
        requester_role = token_role
        if not requester_role and user_id:
            cur.execute("SELECT role FROM user WHERE id = %s", (user_id,))
            r = cur.fetchone()
            if r:
                requester_role = r[0]

        # If an existing session is passed, only SUPERADMIN or ADMIN can onboard
        if requester_role and requester_role not in ('SUPERADMIN', 'ADMIN'):
            return jsonify({
                'message': 'Forbidden: Only administrators can register an institute.'
            }), 403
    except Exception as e:
        if cur:
            cur.close()
        return jsonify({'message': f'Authorization check failed: {str(e)}'}), 500
    finally:
        if cur:
            cur.close()

    data = request.get_json() or {}
    name = (data.get('name') or '').strip()
    code = (data.get('code') or '').strip().upper()
    address = (data.get('address') or '').strip()
    admin_name = (data.get('admin_name') or '').strip()
    admin_email = (data.get('admin_email') or '').strip().lower()
    admin_password = (data.get('admin_password') or '').strip()
    admin_phone = (data.get('admin_phone') or '+91 0000000000').strip()

    if not name or not code or not admin_email or not admin_password:
        return jsonify({'message': 'Institute name, code, admin email, and admin password are all required!'}), 400

    cur = None
    try:
        cur = mysql.connection.cursor()

        # 1. Enforce unique Institute Code (No other admin can register an existing institute)
        cur.execute("SELECT id, name FROM institute WHERE UPPER(code) = %s", (code,))
        existing_code = cur.fetchone()
        if existing_code:
            return jsonify({
                'message': f'Institute code "{code}" is already registered by another admin! You cannot register another admin\'s institute.'
            }), 409

        # 2. Enforce unique Institute Name
        cur.execute("SELECT id, code FROM institute WHERE LOWER(name) = LOWER(%s)", (name,))
        existing_name = cur.fetchone()
        if existing_name:
            return jsonify({
                'message': f'Institute "{name}" is already registered by another admin! You cannot register another admin\'s institute.'
            }), 409

        # 3. Enforce unique Admin Email in user table
        cur.execute("SELECT id FROM user WHERE email = %s", (admin_email,))
        if cur.fetchone():
            return jsonify({'message': f'Email "{admin_email}" is already registered! Please sign in with your password.'}), 409

        # 4. Enforce unique Admin Email in student table
        cur.execute("SELECT id FROM student WHERE email = %s", (admin_email,))
        if cur.fetchone():
            return jsonify({'message': f'Email "{admin_email}" is already registered as a student!'}), 409

        # Insert Institute
        cur.execute("""
            INSERT INTO institute (name, code, address)
            VALUES (%s, %s, %s)
        """, (name, code, address or f"Campus of {name}"))
        mysql.connection.commit()

        # Retrieve new institute id
        cur.execute("SELECT id FROM institute WHERE code = %s", (code,))
        inst_row = cur.fetchone()
        inst_id = inst_row[0]

        # Insert Admin User
        hashed_pw = generate_password_hash(admin_password)
        cur.execute("""
            INSERT INTO user (name, email, phone, password, role, institute_id)
            VALUES (%s, %s, %s, %s, 'ADMIN', %s)
        """, (admin_name or f"{name} Admin", admin_email, admin_phone, hashed_pw, inst_id))
        mysql.connection.commit()

        admin_id = cur.lastrowid or 1
        token = generate_auth_token(admin_id, 'ADMIN', name=admin_name or f"{name} Admin", institute_id=inst_id)

        return jsonify({
            'message': f'Institute "{name}" registered successfully! Welcome to your admin dashboard.',
            'institute': {
                'id': inst_id,
                'name': name,
                'code': code,
                'address': address
            },
            'admin': {
                'id': admin_id,
                'name': admin_name or f"{name} Admin",
                'email': admin_email,
                'role': 'ADMIN'
            },
            'user_id': admin_id,
            'token': token,
            'role': 'ADMIN',
            'name': admin_name or f"{name} Admin",
            'email': admin_email,
            'institute_id': inst_id,
            'institute_name': name,
            'institute_code': code
        }), 201

    except Exception as e:
        app.logger.error(f"Error in register_institute: {e}")
        mysql.connection.rollback()
        return jsonify({'message': f'Failed to register institute: {str(e)}'}), 500
    finally:
        if cur:
            cur.close()


# ==========================================
# Platform Master Admin (Owner) Routes
# ==========================================

@app.route('/master/overview', methods=['GET'])
def master_overview():
    """
    Returns platform-wide metrics and multi-institute breakdown.
    Restricted to SUPERADMIN (Platform Owner).
    """
    user_id, token_role = get_auth_user_from_request()
    cur = None
    try:
        cur = mysql.connection.cursor()
        
        # Verify role is SUPERADMIN
        role = token_role
        if not role and user_id:
            cur.execute("SELECT role FROM user WHERE id = %s", (user_id,))
            r = cur.fetchone()
            if r:
                role = r[0]

        if role != 'SUPERADMIN':
            return jsonify({'message': 'Forbidden: Master Admin privileges required.'}), 403

        # 1. Global KPIs
        cur.execute("SELECT COUNT(*) FROM institute")
        total_institutes = cur.fetchone()[0]

        cur.execute("SELECT COUNT(*) FROM user WHERE role = 'ADMIN'")
        total_admins = cur.fetchone()[0]

        cur.execute("SELECT COUNT(*) FROM user WHERE role = 'TEACHER'")
        total_teachers = cur.fetchone()[0]

        cur.execute("SELECT COUNT(*) FROM student")
        total_students = cur.fetchone()[0]

        cur.execute("SELECT COUNT(*) FROM session")
        total_sessions = cur.fetchone()[0]

        cur.execute("SELECT COUNT(*) FROM attendance")
        total_attendance = cur.fetchone()[0]

        # 2. Institute Breakdown
        cur.execute("""
            SELECT i.id, i.name, i.code, i.address, i.created_at,
                   COUNT(DISTINCT CASE WHEN u.role = 'ADMIN' THEN u.id END) as admin_count,
                   COUNT(DISTINCT CASE WHEN u.role = 'TEACHER' THEN u.id END) as teacher_count,
                   COUNT(DISTINCT s.id) as student_count,
                   COUNT(DISTINCT sess.id) as session_count
            FROM institute i
            LEFT JOIN user u ON u.institute_id = i.id
            LEFT JOIN student s ON s.institute_id = i.id
            LEFT JOIN session sess ON sess.institute_id = i.id
            GROUP BY i.id, i.name, i.code, i.address, i.created_at
            ORDER BY i.id ASC
        """)
        breakdown_rows = cur.fetchall()

        institutes_data = []
        for row in breakdown_rows:
            # Also fetch primary admin email
            cur.execute("SELECT email, name, phone FROM user WHERE institute_id = %s AND role = 'ADMIN' LIMIT 1", (row[0],))
            admin_row = cur.fetchone()
            institutes_data.append({
                'id': row[0],
                'name': row[1],
                'code': row[2],
                'address': row[3],
                'created_at': str(row[4]) if row[4] else None,
                'admin_count': row[5],
                'teacher_count': row[6],
                'student_count': row[7],
                'session_count': row[8],
                'admin_email': admin_row[0] if admin_row else 'None',
                'admin_name': admin_row[1] if admin_row else 'None',
                'admin_phone': admin_row[2] if admin_row else 'None'
            })

        return jsonify({
            'kpis': {
                'total_institutes': total_institutes,
                'total_admins': total_admins,
                'total_teachers': total_teachers,
                'total_students': total_students,
                'total_sessions': total_sessions,
                'total_attendance': total_attendance
            },
            'institutes': institutes_data
        }), 200

    except Exception as e:
        app.logger.error(f"Error in master_overview: {e}")
        return jsonify({'message': f'Failed to load master overview: {str(e)}'}), 500
    finally:
        if cur:
            cur.close()


@app.route('/master/all_users', methods=['GET'])
def master_all_users():
    """
    Returns complete global directory of users (Admins, Teachers, Students)
    tagged by their respective institute.
    """
    user_id, token_role = get_auth_user_from_request()
    cur = None
    try:
        cur = mysql.connection.cursor()
        role = token_role
        if not role and user_id:
            cur.execute("SELECT role FROM user WHERE id = %s", (user_id,))
            r = cur.fetchone()
            if r:
                role = r[0]

        if role != 'SUPERADMIN':
            return jsonify({'message': 'Forbidden: Master Admin privileges required.'}), 403

        # Users table (Admins, Teachers)
        cur.execute("""
            SELECT u.id, u.name, u.email, u.phone, u.role, u.institute_id, i.name as institute_name, i.code as institute_code
            FROM user u
            LEFT JOIN institute i ON i.id = u.institute_id
            WHERE u.role != 'SUPERADMIN'
            ORDER BY u.institute_id ASC, u.id ASC
        """)
        staff_rows = cur.fetchall()
        staff = [
            {
                'id': r[0],
                'name': r[1],
                'email': r[2],
                'phone': r[3],
                'role': r[4],
                'institute_id': r[5],
                'institute_name': r[6] or 'Unassigned',
                'institute_code': r[7] or 'N/A'
            }
            for r in staff_rows
        ]

        # Students table
        cur.execute("""
            SELECT s.id, s.name, s.class, s.email, s.phone, s.institute_id, i.name as institute_name, i.code as institute_code
            FROM student s
            LEFT JOIN institute i ON i.id = s.institute_id
            ORDER BY s.institute_id ASC, s.id ASC
        """)
        student_rows = cur.fetchall()
        students = [
            {
                'id': r[0],
                'name': r[1],
                'class': r[2],
                'email': r[3],
                'phone': r[4],
                'role': 'STUDENT',
                'institute_id': r[5],
                'institute_name': r[6] or 'Unassigned',
                'institute_code': r[7] or 'N/A'
            }
            for r in student_rows
        ]

        return jsonify({
            'staff': staff,
            'students': students,
            'total_count': len(staff) + len(students)
        }), 200

    except Exception as e:
        app.logger.error(f"Error in master_all_users: {e}")
        return jsonify({'message': f'Failed to load all users: {str(e)}'}), 500
    finally:
        if cur:
            cur.close()
