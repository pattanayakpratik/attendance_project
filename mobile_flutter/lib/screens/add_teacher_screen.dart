import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../models/user_model.dart';
import '../services/api_service.dart';

class AddTeacherScreen extends StatefulWidget {
  final UserModel requestingUser;

  const AddTeacherScreen({super.key, required this.requestingUser});

  @override
  State<AddTeacherScreen> createState() => _AddTeacherScreenState();
}

class _AddTeacherScreenState extends State<AddTeacherScreen> {
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleSubmit() async {
    final name = _nameController.text.trim();
    final email = _emailController.text.trim();
    final phone = _phoneController.text.trim();
    final password = _passwordController.text.trim();

    if (name.isEmpty || email.isEmpty || phone.isEmpty || password.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please fill all fields')),
      );
      return;
    }

    setState(() => _isLoading = true);

    final res = await ApiService.addTeacher(
      name: name,
      email: email,
      phone: phone,
      password: password,
      requestingUserId: widget.requestingUser.id,
    );

    if (!mounted) return;
    setState(() => _isLoading = false);

    if (res['success'] == true) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          backgroundColor: AppColors.primary,
          content: Text('Teacher added successfully!'),
        ),
      );
      Navigator.pop(context);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: AppColors.absentCoral,
          content: Text(res['message'] ?? 'Failed to add teacher'),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, color: AppColors.textPrimary, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Add Teacher',
          style: TextStyle(
            color: AppColors.textPrimary,
            fontSize: 22,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
          child: Column(
            children: [
              const SizedBox(height: 10),

              // Form Cards matching design
              _buildInputContainer('Name', _nameController),
              const SizedBox(height: 16),
              _buildInputContainer('Email', _emailController, keyboardType: TextInputType.emailAddress),
              const SizedBox(height: 16),
              _buildInputContainer('Phone', _phoneController, keyboardType: TextInputType.phone),
              const SizedBox(height: 16),
              _buildInputContainer('Password', _passwordController, isPassword: true),
              const SizedBox(height: 36),

              // Teal full-width ADD button matching design
              SizedBox(
                width: double.infinity,
                height: 54,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(27),
                    ),
                  ),
                  onPressed: _isLoading ? null : _handleSubmit,
                  child: _isLoading
                      ? const CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5)
                      : const Text(
                          'ADD',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                            letterSpacing: 1.2,
                          ),
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInputContainer(
    String label,
    TextEditingController controller, {
    bool isPassword = false,
    TextInputType keyboardType = TextInputType.text,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 6),
      child: TextField(
        controller: controller,
        obscureText: isPassword,
        keyboardType: keyboardType,
        style: const TextStyle(fontSize: 15, color: AppColors.textPrimary),
        decoration: InputDecoration(
          labelText: label,
          labelStyle: const TextStyle(color: AppColors.textMuted, fontSize: 14),
          border: InputBorder.none,
          floatingLabelBehavior: FloatingLabelBehavior.auto,
        ),
      ),
    );
  }
}
