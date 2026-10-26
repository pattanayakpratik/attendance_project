import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import '../theme/app_colors.dart';
import '../models/user_model.dart';
import '../services/api_service.dart';
import '../services/location_service.dart';
import '../services/storage_service.dart';

class QrScannerScreen extends StatefulWidget {
  const QrScannerScreen({super.key});

  @override
  State<QrScannerScreen> createState() => _QrScannerScreenState();
}

class _QrScannerScreenState extends State<QrScannerScreen> {
  final MobileScannerController _scannerController = MobileScannerController(
    detectionSpeed: DetectionSpeed.noDuplicates,
  );
  bool _isProcessing = false;
  String? _statusMessage;
  UserModel? _currentUser;

  @override
  void initState() {
    super.initState();
    _loadUser();
  }

  Future<void> _loadUser() async {
    final user = await StorageService.getUser();
    setState(() => _currentUser = user);
  }

  @override
  void dispose() {
    _scannerController.dispose();
    super.dispose();
  }

  void _onDetect(BarcodeCapture capture) async {
    if (_isProcessing) return;
    final List<Barcode> barcodes = capture.barcodes;
    if (barcodes.isEmpty) return;

    final rawValue = barcodes.first.rawValue;
    if (rawValue == null || rawValue.isEmpty) return;

    setState(() {
      _isProcessing = true;
      _statusMessage = 'Reading QR & verifying GPS location...';
    });

    try {
      int sessionId = 1;

      // The QR code contains JSON or plain session ID
      try {
        final decoded = jsonDecode(rawValue.replaceAll("'", '"'));
        if (decoded is Map && decoded.containsKey('session_id')) {
          sessionId = int.parse(decoded['session_id'].toString());
        } else {
          sessionId = int.tryParse(rawValue) ?? 1;
        }
      } catch (_) {
        sessionId = int.tryParse(rawValue) ?? 1;
      }

      // Step 2: Capture Device GPS Geolocation
      final position = await LocationService.getCurrentLocation();
      if (position == null) {
        _showResultDialog(
          title: 'Location Required',
          message: 'Please enable GPS/Location services on your device to mark attendance.',
          isSuccess: false,
        );
        setState(() => _isProcessing = false);
        return;
      }

      // Step 3: Get student ID
      final studentId = _currentUser?.id ?? 101;

      // Step 4: Submit to Backend
      final result = await ApiService.markAttendance(
        studentId: studentId,
        sessionId: sessionId,
        latitude: position.latitude,
        longitude: position.longitude,
      );

      final status = result['status'] ?? '';
      final message = result['message'] ?? '';

      if (result['statusCode'] == 200 && status == 'PRESENT') {
        _showResultDialog(
          title: 'Attendance Marked! 🎉',
          message: 'Status: PRESENT\nSession #$sessionId\nGPS Verified: (${position.latitude.toStringAsFixed(4)}, ${position.longitude.toStringAsFixed(4)})',
          isSuccess: true,
        );
      } else if (result['statusCode'] == 409) {
        _showResultDialog(
          title: 'Already Marked',
          message: 'You have already marked attendance for this session.',
          isSuccess: false,
          isWarning: true,
        );
      } else {
        _showResultDialog(
          title: 'Verification Failed',
          message: '$message\n(Status: $status)',
          isSuccess: false,
        );
      }
    } catch (e) {
      _showResultDialog(
        title: 'Error',
        message: 'Could not process attendance: $e',
        isSuccess: false,
      );
    } finally {
      if (mounted) {
        setState(() => _isProcessing = false);
      }
    }
  }

  void _showResultDialog({
    required String title,
    required String message,
    required bool isSuccess,
    bool isWarning = false,
  }) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        contentPadding: const EdgeInsets.all(24),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 68,
              height: 68,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: isSuccess
                    ? AppColors.primaryLight
                    : (isWarning ? Colors.orange.withOpacity(0.15) : AppColors.absentCoral.withOpacity(0.15)),
              ),
              child: Icon(
                isSuccess
                    ? Icons.check_circle_outline_rounded
                    : (isWarning ? Icons.info_outline : Icons.cancel_outlined),
                size: 40,
                color: isSuccess
                    ? AppColors.primary
                    : (isWarning ? Colors.orange : AppColors.absentCoral),
              ),
            ),
            const SizedBox(height: 18),
            Text(
              title,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 10),
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 14,
                color: AppColors.textSecondary,
                height: 1.4,
              ),
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  elevation: 0,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
                ),
                onPressed: () {
                  Navigator.pop(ctx);
                  // Resumes scanning
                  setState(() => _isProcessing = false);
                },
                child: const Text('OK', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.darkScanner,
      body: SafeArea(
        child: Stack(
          children: [
            // Camera scanner view
            MobileScanner(
              controller: _scannerController,
              onDetect: _onDetect,
            ),

            // Top Bar with back arrow
            Positioned(
              top: 16,
              left: 16,
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.black.withOpacity(0.4),
                  shape: BoxShape.circle,
                ),
                child: IconButton(
                  icon: const Icon(Icons.arrow_back_ios_new, color: Colors.white, size: 20),
                  onPressed: () => Navigator.pop(context),
                ),
              ),
            ),

            // Flash / torch toggle
            Positioned(
              top: 16,
              right: 16,
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.black.withOpacity(0.4),
                  shape: BoxShape.circle,
                ),
                child: IconButton(
                  icon: const Icon(Icons.flash_on, color: Colors.white, size: 20),
                  onPressed: () => _scannerController.toggleTorch(),
                ),
              ),
            ),

            // Center Viewfinder Overlay matching mockup design
            Center(
              child: SizedBox(
                width: 260,
                height: 260,
                child: Stack(
                  children: [
                    // Viewfinder Corners
                    Positioned(
                      top: 0,
                      left: 0,
                      child: _buildCorner(isTop: true, isLeft: true),
                    ),
                    Positioned(
                      top: 0,
                      right: 0,
                      child: _buildCorner(isTop: true, isLeft: false),
                    ),
                    Positioned(
                      bottom: 0,
                      left: 0,
                      child: _buildCorner(isTop: false, isLeft: true),
                    ),
                    Positioned(
                      bottom: 0,
                      right: 0,
                      child: _buildCorner(isTop: false, isLeft: false),
                    ),

                    if (_isProcessing)
                      const Center(
                        child: CircularProgressIndicator(color: AppColors.scannerTeal),
                      ),
                  ],
                ),
              ),
            ),

            // Bottom title "Scan QR Code" matching mockup design
            Positioned(
              bottom: 60,
              left: 0,
              right: 0,
              child: Column(
                children: [
                  const Text(
                    'Scan QR Code',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 0.5,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _statusMessage ?? 'Align QR code inside frame + GPS verified',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: Colors.white.withOpacity(0.7),
                      fontSize: 13,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCorner({required bool isTop, required bool isLeft}) {
    const double size = 36;
    const double thickness = 4;
    const double radius = 12;

    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        border: Border(
          top: isTop ? const BorderSide(color: AppColors.scannerTeal, width: thickness) : BorderSide.none,
          bottom: !isTop ? const BorderSide(color: AppColors.scannerTeal, width: thickness) : BorderSide.none,
          left: isLeft ? const BorderSide(color: AppColors.scannerTeal, width: thickness) : BorderSide.none,
          right: !isLeft ? const BorderSide(color: AppColors.scannerTeal, width: thickness) : BorderSide.none,
        ),
        borderRadius: BorderRadius.only(
          topLeft: isTop && isLeft ? const Radius.circular(radius) : Radius.zero,
          topRight: isTop && !isLeft ? const Radius.circular(radius) : Radius.zero,
          bottomLeft: !isTop && isLeft ? const Radius.circular(radius) : Radius.zero,
          bottomRight: !isTop && !isLeft ? const Radius.circular(radius) : Radius.zero,
        ),
      ),
    );
  }
}
