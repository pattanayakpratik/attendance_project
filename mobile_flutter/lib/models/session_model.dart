import 'package:intl/intl.dart';

class SessionModel {
  final int id;
  final String sessionName;
  final String sessionCode;
  final DateTime expiryTime;
  final String className;
  final double? latitude;
  final double? longitude;
  final int? createdBy;

  SessionModel({
    required this.id,
    required this.sessionName,
    required this.sessionCode,
    required this.expiryTime,
    required this.className,
    this.latitude,
    this.longitude,
    this.createdBy,
  });

  bool get isOpen => DateTime.now().isBefore(expiryTime);

  String get formattedExpiry {
    return DateFormat('d MMMM, yyyy, h:mm a').format(expiryTime);
  }

  factory SessionModel.fromJson(Map<String, dynamic> json) {
    DateTime parsedExpiry;
    try {
      parsedExpiry = DateTime.parse(json['expiry_time']);
    } catch (_) {
      parsedExpiry = DateTime.now().add(const Duration(hours: 1));
    }

    return SessionModel(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id'].toString()) ?? 0,
      sessionName: json['session_name'] ?? 'Class Session',
      sessionCode: json['session_code'] ?? '',
      expiryTime: parsedExpiry,
      className: json['class'] ?? 'General',
      latitude: json['latitude'] != null ? double.tryParse(json['latitude'].toString()) : null,
      longitude: json['longitude'] != null ? double.tryParse(json['longitude'].toString()) : null,
      createdBy: json['created_by'] != null ? int.tryParse(json['created_by'].toString()) : null,
    );
  }
}
