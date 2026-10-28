import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/theme_controller.dart';
import '../models/user_model.dart';
import '../services/api_service.dart';
import '../services/storage_service.dart';
import 'dashboard_screen.dart';
import 'qr_scanner_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  UserRole _selectedRole = UserRole.admin;
  final _emailController = TextEditingController(text: 'admin@school.com');
  final _passwordController = TextEditingController(text: '123456');
  bool _isLoading = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _checkSavedUser();
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _checkSavedUser() async {
    final user = await StorageService.getUser();
    if (user != null && mounted) {
      _navigateToNextScreen(user);
    }
  }

  void _navigateToNextScreen(UserModel user) {
    if (user.role == UserRole.student) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => const QrScannerScreen()),
      );
    } else {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => DashboardScreen(user: user)),
      );
    }
  }

  void _selectRole(UserRole role) {
    setState(() {
      _selectedRole = role;
      if (role == UserRole.admin) {
        _emailController.text = 'admin@school.com';
      } else if (role == UserRole.teacher) {
        _emailController.text = 'teacher@school.com';
      } else {
        _emailController.text = 'student@school.com';
      }
    });
  }

  Future<void> _handleLogin() async {
    final email = _emailController.text.trim();
    final password = _passwordController.text.trim();

    if (email.isEmpty || password.isEmpty) {
      setState(() => _errorMessage = 'Please enter both email and password');
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final res = await ApiService.login(
      email: email,
      password: password,
      role: _selectedRole,
    );

    if (!mounted) return;

    setState(() => _isLoading = false);

    if (res['success']) {
      final user = res['user'] as UserModel;
      _navigateToNextScreen(user);
    } else {
      setState(() {
        _errorMessage = res['message'] ?? 'Authentication failed';
      });
    }
  }

  void _showServerConfig() async {
    final currentUrl = await StorageService.getBaseUrl();
    final urlController = TextEditingController(text: currentUrl);

    if (!mounted) return;

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Backend API URL'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Enter your local machine IP, tunnel URL, or production domain:',
              style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: urlController,
              decoration: InputDecoration(
                filled: true,
                fillColor: AppColors.scaffoldBg(ctx),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primaryColor(ctx),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            onPressed: () async {
              final newUrl = urlController.text.trim();
              await StorageService.setBaseUrl(newUrl);
              if (ctx.mounted) Navigator.pop(ctx);
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Server URL updated')),
                );
              }
            },
            child: const Text('Save', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = AppColors.isDark(context);

    return Scaffold(
      backgroundColor: AppColors.scaffoldBg(context),
      body: SafeArea(
        child: Stack(
          children: [
            // Decorative background circles from design
            Positioned(
              top: -60,
              right: -60,
              child: Container(
                width: 180,
                height: 180,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: (isDark ? const Color(0xFF132E33) : AppColors.primaryLight).withValues(alpha: 0.5),
                ),
              ),
            ),
            Positioned(
              top: 20,
              left: -40,
              child: Container(
                width: 140,
                height: 140,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: (isDark ? const Color(0xFF163238) : AppColors.primaryLight).withValues(alpha: 0.4),
                ),
              ),
            ),
            Positioned(
              bottom: -40,
              right: 20,
              child: Container(
                width: 150,
                height: 150,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: (isDark ? const Color(0xFF132E33) : AppColors.primaryLight).withValues(alpha: 0.3),
                ),
              ),
            ),

            // Content
            SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      IconButton(
                        icon: Icon(
                          isDark ? Icons.light_mode : Icons.dark_mode,
                          color: isDark ? const Color(0xFF38B2AC) : AppColors.textSecondary,
                        ),
                        onPressed: () => ThemeController.toggleTheme(!isDark),
                        tooltip: isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode',
                      ),
                      IconButton(
                        icon: Icon(
                          Icons.settings_outlined,
                          color: isDark ? const Color(0xFF94A3B8) : AppColors.textSecondary,
                        ),
                        onPressed: _showServerConfig,
                        tooltip: 'Configure Server URL',
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Text(
                    'Login',
                    style: TextStyle(
                      fontSize: 32,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textMain(context),
                    ),
                  ),
                  const SizedBox(height: 30),

                  // 3 Role selector tabs from design
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      _buildRoleTab(UserRole.admin, Icons.person_outline),
                      const SizedBox(width: 12),
                      _buildRoleTab(UserRole.teacher, Icons.school_outlined),
                      const SizedBox(width: 12),
                      _buildRoleTab(UserRole.student, Icons.badge_outlined),
                    ],
                  ),
                  const SizedBox(height: 36),

                  if (_errorMessage != null)
                    Container(
                      margin: const EdgeInsets.only(bottom: 20),
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      decoration: BoxDecoration(
                        color: AppColors.absentCoral.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: AppColors.absentCoral.withValues(alpha: 0.3)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.error_outline, color: AppColors.absentCoral, size: 20),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              _errorMessage!,
                              style: const TextStyle(color: AppColors.absentCoral, fontSize: 13),
                            ),
                          ),
                        ],
                      ),
                    ),

                  // Inputs matching design
                  _buildInputField(
                    label: 'Email',
                    controller: _emailController,
                    keyboardType: TextInputType.emailAddress,
                  ),
                  const SizedBox(height: 16),
                  _buildInputField(
                    label: 'Password',
                    controller: _passwordController,
                    isPassword: true,
                  ),
                  const SizedBox(height: 28),

                  // Teal LOGIN button matching design
                  SizedBox(
                    width: double.infinity,
                    height: 56,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: isDark ? const Color(0xFF38B2AC) : AppColors.primary,
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(28),
                        ),
                      ),
                      onPressed: _isLoading ? null : _handleLogin,
                      child: _isLoading
                          ? const SizedBox(
                              width: 24,
                              height: 24,
                              child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                            )
                          : Text(
                              'LOGIN',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: isDark ? const Color(0xFF0B1619) : Colors.white,
                                letterSpacing: 1.2,
                              ),
                            ),
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Continue as a guest text button
                  TextButton(
                    onPressed: () {
                      final guestUser = UserModel(
                        id: 1,
                        name: 'Guest ${_selectedRole.name}',
                        email: 'guest@school.com',
                        phone: '1234567890',
                        role: _selectedRole,
                        studentClass: 'Class 10',
                      );
                      _navigateToNextScreen(guestUser);
                    },
                    child: Text(
                      'Continue as a guest',
                      style: TextStyle(
                        fontSize: 14,
                        color: isDark ? const Color(0xFF94A3B8) : AppColors.textSecondary,
                        fontWeight: FontWeight.w500,
                      ),
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

  Widget _buildRoleTab(UserRole role, IconData icon) {
    final isSelected = _selectedRole == role;
    final isDark = AppColors.isDark(context);

    return GestureDetector(
      onTap: () => _selectRole(role),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        width: 90,
        height: 80,
        decoration: BoxDecoration(
          color: isSelected
              ? (isDark ? const Color(0xFF1A343B) : Colors.white)
              : (isDark ? const Color(0xFF132429) : AppColors.card.withValues(alpha: 0.7)),
          borderRadius: BorderRadius.circular(18),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: (isDark ? const Color(0xFF38B2AC) : AppColors.primary).withValues(alpha: 0.2),
                    blurRadius: 15,
                    offset: const Offset(0, 6),
                  ),
                ]
              : [],
          border: Border.all(
            color: isSelected
                ? (isDark ? const Color(0xFF38B2AC) : AppColors.primary)
                : (isDark ? const Color(0xFF1E373E) : Colors.transparent),
            width: 1.5,
          ),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 28,
              color: isSelected
                  ? (isDark ? const Color(0xFF38B2AC) : AppColors.primary)
                  : (isDark ? const Color(0xFF64748B) : AppColors.textMuted),
            ),
            const SizedBox(height: 6),
            Text(
              role.name,
              style: TextStyle(
                fontSize: 13,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                color: isSelected
                    ? (isDark ? const Color(0xFF38B2AC) : AppColors.primary)
                    : (isDark ? const Color(0xFF94A3B8) : AppColors.textSecondary),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInputField({
    required String label,
    required TextEditingController controller,
    bool isPassword = false,
    TextInputType keyboardType = TextInputType.text,
  }) {
    final isDark = AppColors.isDark(context);

    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF132429) : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: isDark ? Border.all(color: const Color(0xFF1E373E)) : null,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.3 : 0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 6),
      child: TextField(
        controller: controller,
        obscureText: isPassword,
        keyboardType: keyboardType,
        style: TextStyle(fontSize: 15, color: AppColors.textMain(context)),
        decoration: InputDecoration(
          border: InputBorder.none,
          labelText: label,
          labelStyle: TextStyle(
            color: isDark ? const Color(0xFF94A3B8) : AppColors.textMuted,
            fontSize: 14,
          ),
          floatingLabelBehavior: FloatingLabelBehavior.auto,
        ),
      ),
    );
  }
}
