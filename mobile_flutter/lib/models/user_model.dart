enum UserRole { admin, teacher, student }

extension UserRoleExtension on UserRole {
  String get name {
    switch (this) {
      case UserRole.admin:
        return 'Admin';
      case UserRole.teacher:
        return 'Teacher';
      case UserRole.student:
        return 'Student';
    }
  }

  String get apiValue {
    switch (this) {
      case UserRole.admin:
        return 'ADMIN';
      case UserRole.teacher:
        return 'TEACHER';
      case UserRole.student:
        return 'STUDENT';
    }
  }

  static UserRole fromString(String role) {
    switch (role.toUpperCase()) {
      case 'ADMIN':
        return UserRole.admin;
      case 'TEACHER':
        return UserRole.teacher;
      case 'STUDENT':
      default:
        return UserRole.student;
    }
  }
}

class UserModel {
  final int id;
  final String name;
  final String email;
  final String phone;
  final UserRole role;
  final String? studentClass;
  final String? token;

  UserModel({
    required this.id,
    required this.name,
    required this.email,
    required this.phone,
    required this.role,
    this.studentClass,
    this.token,
  });

  factory UserModel.fromJson(Map<String, dynamic> json, {UserRole? defaultRole}) {
    return UserModel(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id'].toString()) ?? 0,
      name: json['name'] ?? '',
      email: json['email'] ?? '',
      phone: json['phone'] ?? '',
      role: json['role'] != null 
          ? UserRoleExtension.fromString(json['role']) 
          : (defaultRole ?? UserRole.student),
      studentClass: json['class'],
      token: json['token'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'phone': phone,
      'role': role.apiValue,
      'class': studentClass,
      'token': token,
    };
  }
}
