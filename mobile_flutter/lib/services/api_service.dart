import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/user_model.dart';
import '../models/session_model.dart';
import 'storage_service.dart';

class ApiService {
  static Future<Map<String, String>> _getHeaders() async {
    final user = await StorageService.getUser();
    final headers = {'Content-Type': 'application/json'};
    if (user?.token != null && user!.token!.isNotEmpty) {
      headers['Authorization'] = 'Bearer ${user.token}';
    }
    return headers;
  }

  static Future<Map<String, dynamic>> login({
    required String email,
    required String password,
    required UserRole role,
  }) async {
    final baseUrl = await StorageService.getBaseUrl();
    final endpoint = role == UserRole.student ? '/student_login' : '/login_user';
    final url = Uri.parse('$baseUrl$endpoint');

    try {
      final response = await http
          .post(
            url,
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({
              'email': email.trim(),
              'id': email.trim(),
              'password': password.trim(),
            }),
          )
          .timeout(const Duration(seconds: 12));

      final data = jsonDecode(response.body);
      if (response.statusCode == 200) {
        UserModel user;
        final token = data['token'] as String?;

        if (role == UserRole.student) {
          user = UserModel(
            id: data['student_id'] is int ? data['student_id'] : int.tryParse(data['student_id'].toString()) ?? 1,
            name: data['name'] ?? email.split('@')[0],
            email: email,
            phone: data['phone'] ?? '',
            role: UserRole.student,
            studentClass: data['class'] ?? 'Class 10',
            token: token,
          );
        } else {
          user = UserModel(
            id: data['user_id'] is int ? data['user_id'] : int.tryParse(data['user_id'].toString()) ?? 1,
            name: data['name'] ?? email.split('@')[0],
            email: email,
            phone: data['phone'] ?? '',
            role: role,
            token: token,
          );
        }
        await StorageService.saveUser(user);
        return {'success': true, 'user': user, 'message': data['message'] ?? 'Logged in successfully'};
      } else {
        return {'success': false, 'message': data['message'] ?? 'Authentication failed'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Cannot connect to server at $baseUrl: $e'};
    }
  }

  static Future<Map<String, dynamic>> markAttendance({
    required int studentId,
    required int sessionId,
    required double latitude,
    required double longitude,
  }) async {
    final baseUrl = await StorageService.getBaseUrl();
    final url = Uri.parse('$baseUrl/mark_attendance');
    final headers = await _getHeaders();

    try {
      final response = await http
          .post(
            url,
            headers: headers,
            body: jsonEncode({
              'student_id': studentId,
              'session_id': sessionId,
              'latitude': latitude,
              'longitude': longitude,
            }),
          )
          .timeout(const Duration(seconds: 15));

      final data = jsonDecode(response.body);
      return {
        'statusCode': response.statusCode,
        'status': data['status'] ?? (response.statusCode == 200 ? 'PRESENT' : 'FAILED'),
        'message': data['message'] ?? 'Attendance marked',
      };
    } catch (e) {
      return {'statusCode': 500, 'status': 'ERROR', 'message': 'Network error: $e'};
    }
  }

  static Future<List<SessionModel>> getSessions() async {
    final baseUrl = await StorageService.getBaseUrl();
    final url = Uri.parse('$baseUrl/get_sessions');
    final headers = await _getHeaders();

    try {
      final response = await http.get(url, headers: headers).timeout(const Duration(seconds: 10));
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final List list = data['sessions'] ?? (data is List ? data : []);
        return list.map((item) => SessionModel.fromJson(item)).toList();
      }
      return [];
    } catch (_) {
      return [];
    }
  }

  static Future<List<Map<String, dynamic>>> getStudents() async {
    final baseUrl = await StorageService.getBaseUrl();
    final url = Uri.parse('$baseUrl/get_all_student');
    final headers = await _getHeaders();

    try {
      final response = await http.get(url, headers: headers).timeout(const Duration(seconds: 10));
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final List list = data['students'] ?? (data is List ? data : []);
        return List<Map<String, dynamic>>.from(list);
      }
      return [];
    } catch (_) {
      return [];
    }
  }

  static Future<List<Map<String, dynamic>>> getTeachers() async {
    final baseUrl = await StorageService.getBaseUrl();
    final url = Uri.parse('$baseUrl/get_teachers');
    final headers = await _getHeaders();

    try {
      final response = await http.get(url, headers: headers).timeout(const Duration(seconds: 10));
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final List list = data['teachers'] ?? (data is List ? data : []);
        return List<Map<String, dynamic>>.from(list);
      }
      return [];
    } catch (_) {
      return [];
    }
  }

  static Future<Map<String, dynamic>> addTeacher({
    required String name,
    required String email,
    required String phone,
    required String password,
    required int requestingUserId,
  }) async {
    final baseUrl = await StorageService.getBaseUrl();
    final url = Uri.parse('$baseUrl/add_teacher');
    final headers = await _getHeaders();

    try {
      final response = await http
          .post(
            url,
            headers: headers,
            body: jsonEncode({
              'name': name,
              'email': email,
              'phone': phone,
              'password': password,
              'requesting_user_id': requestingUserId,
            }),
          )
          .timeout(const Duration(seconds: 10));

      final data = jsonDecode(response.body);
      return {'success': response.statusCode == 201 || response.statusCode == 200, 'message': data['message'] ?? 'Done'};
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
  }

  static Future<Map<String, dynamic>> addStudent({
    required int id,
    required String name,
    required String className,
    required String email,
    required String phone,
    required String password,
    required int requestingUserId,
  }) async {
    final baseUrl = await StorageService.getBaseUrl();
    final url = Uri.parse('$baseUrl/add_student');
    final headers = await _getHeaders();

    try {
      final response = await http
          .post(
            url,
            headers: headers,
            body: jsonEncode({
              'id': id,
              'name': name,
              'class': className,
              'email': email,
              'phone': phone,
              'password': password,
              'request_id': requestingUserId,
            }),
          )
          .timeout(const Duration(seconds: 10));

      final data = jsonDecode(response.body);
      return {'success': response.statusCode == 201 || response.statusCode == 200, 'message': data['message'] ?? 'Done'};
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
  }
}
