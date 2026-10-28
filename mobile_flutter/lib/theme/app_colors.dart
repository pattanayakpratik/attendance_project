import 'package:flutter/material.dart';

class AppColors {
  // Brand Teal Colors (exact match to design mockup)
  static const Color primary = Color(0xFF2D8885);
  static const Color primaryDark = Color(0xFF1F6664);
  static const Color primaryLight = Color(0xFFE7F3F2);
  static const Color primarySoft = Color(0xFFBCE0DD);
  
  // Backgrounds & Surfaces (Light)
  static const Color background = Color(0xFFF5F7F8);
  static const Color card = Colors.white;
  static const Color surface = Color(0xFFFAFCFC);
  
  // Dark Theme Palette (matching Mockup Screen 5 QR Scanner)
  static const Color darkBackground = Color(0xFF0B1619);
  static const Color darkCard = Color(0xFF132429);
  static const Color darkSurface = Color(0xFF162B31);
  static const Color darkBorder = Color(0xFF1E373E);
  
  // Dark QR Scanner View
  static const Color darkScanner = Color(0xFF0F2228);
  static const Color scannerTeal = Color(0xFF38B2AC);
  
  // Accents & Statuses
  static const Color absentCoral = Color(0xFFE06D53);
  static const Color presentGreen = Color(0xFF10B981);
  static const Color warningOrange = Color(0xFFF59E0B);
  static const Color classPurple = Color(0xFF6366F1);
  static const Color classBlue = Color(0xFF3B82F6);
  
  // Typography
  static const Color textPrimary = Color(0xFF1E293B);
  static const Color textSecondary = Color(0xFF64748B);
  static const Color textMuted = Color(0xFF94A3B8);
  
  // Dark Typography
  static const Color textDarkPrimary = Color(0xFFF1F5F9);
  static const Color textDarkSecondary = Color(0xFF94A3B8);
  static const Color textDarkMuted = Color(0xFF64748B);
  
  // Borders & Dividers
  static const Color border = Color(0xFFE2E8F0);
  static const Color borderLight = Color(0xFFF1F5F9);

  // Contextual Dynamic Helpers
  static bool isDark(BuildContext context) =>
      Theme.of(context).brightness == Brightness.dark;

  static Color cardBg(BuildContext context) =>
      isDark(context) ? darkCard : card;

  static Color scaffoldBg(BuildContext context) =>
      isDark(context) ? darkBackground : background;

  static Color textMain(BuildContext context) =>
      isDark(context) ? textDarkPrimary : textPrimary;

  static Color textSub(BuildContext context) =>
      isDark(context) ? textDarkSecondary : textSecondary;

  static Color borderStroke(BuildContext context) =>
      isDark(context) ? darkBorder : border;

  static Color primaryColor(BuildContext context) =>
      isDark(context) ? scannerTeal : primary;
}
