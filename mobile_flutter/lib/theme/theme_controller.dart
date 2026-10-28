import 'package:flutter/material.dart';
import '../services/storage_service.dart';

class ThemeController {
  static final ValueNotifier<ThemeMode> themeModeNotifier =
      ValueNotifier<ThemeMode>(ThemeMode.light);

  static Future<void> init() async {
    final isDark = await StorageService.isDarkMode();
    themeModeNotifier.value = isDark ? ThemeMode.dark : ThemeMode.light;
  }

  static bool get isDarkMode => themeModeNotifier.value == ThemeMode.dark;

  static Future<void> toggleTheme([bool? value]) async {
    final next = value ?? !isDarkMode;
    themeModeNotifier.value = next ? ThemeMode.dark : ThemeMode.light;
    await StorageService.setDarkMode(next);
  }
}
