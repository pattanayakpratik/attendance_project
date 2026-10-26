import os
from functools import wraps
from flask import request, jsonify
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired

SECRET_KEY = os.getenv('SECRET_KEY', 'attendance_secure_token_secret_key_2026_xyz')
serializer = URLSafeTimedSerializer(SECRET_KEY, salt='attendance-auth-salt')

# Token validity: 7 days
TOKEN_MAX_AGE = 86400 * 7

def generate_auth_token(user_id, role, name=None):
    """Generate a tamper-proof cryptographic token."""
    payload = {
        'user_id': user_id,
        'role': role,
        'name': name
    }
    return serializer.dumps(payload)

def verify_auth_token(token):
    """Verify and decode cryptographic token."""
    try:
        return serializer.loads(token, max_age=TOKEN_MAX_AGE)
    except (BadSignature, SignatureExpired):
        return None

def require_auth(roles=None):
    """
    Decorator that verifies authentication token from Authorization: Bearer <token>
    and checks user role permissions.
    """
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            auth_header = request.headers.get('Authorization')
            token = None

            if auth_header and auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]
            elif request.args.get('token'):
                token = request.args.get('token')

            if token:
                payload = verify_auth_token(token)
                if not payload:
                    return jsonify({'message': 'Invalid or expired session token. Please log in again.'}), 401
                
                request.user_id = payload.get('user_id')
                request.user_role = payload.get('role')
            else:
                # Fallback support for request_id during transition
                req_id = None
                if request.is_json and request.get_json():
                    req_id = request.get_json().get('request_id') or request.get_json().get('requesting_user_id')
                if not req_id:
                    req_id = request.args.get('request_id')

                if req_id:
                    try:
                        request.user_id = int(req_id)
                        request.user_role = None
                    except ValueError:
                        return jsonify({'message': 'Authentication token or valid user ID required.'}), 401
                else:
                    return jsonify({'message': 'Authorization header (Bearer <token>) is required.'}), 401

            # Role check if specified
            if roles:
                allowed_roles = [r.upper() for r in roles]
                if request.user_role and request.user_role.upper() not in allowed_roles:
                    return jsonify({'message': f'Forbidden: Requires one of {allowed_roles} roles.'}), 403

            return f(*args, **kwargs)
        return wrapper
    return decorator


def get_auth_user_from_request():
    """
    Extract user_id and role from Authorization Bearer token, token param,
    query parameters (request_id, id), or JSON payload.
    """
    # 1. Check Authorization Bearer header
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header.split(' ')[1]
        payload = verify_auth_token(token)
        if payload:
            return payload.get('user_id'), payload.get('role')

    # 2. Check token in query
    token = request.args.get('token')
    if token:
        payload = verify_auth_token(token)
        if payload:
            return payload.get('user_id'), payload.get('role')

    # 3. Check query parameters
    raw_id = request.args.get('request_id') or request.args.get('id') or request.args.get('requesting_user_id')
    if raw_id is not None:
        try:
            return int(raw_id), None
        except (ValueError, TypeError):
            pass

    # 4. Check JSON payload if present
    if request.is_json:
        try:
            body = request.get_json(silent=True) or {}
            raw_id = body.get('request_id') or body.get('requesting_user_id') or body.get('created_by') or body.get('id')
            if raw_id is not None:
                return int(raw_id), None
        except Exception:
            pass

    return None, None
