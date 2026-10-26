import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../models/user_model.dart';
import 'student_list_screen.dart';
import 'sessions_screen.dart';
import 'attendance_stats_screen.dart';
import 'add_teacher_screen.dart';
import 'profile_screen.dart';
import 'qr_scanner_screen.dart';

class DashboardScreen extends StatelessWidget {
  final UserModel user;

  const DashboardScreen({super.key, required this.user});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.primary,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: const Text(
          'Dashboard',
          style: TextStyle(
            color: Colors.white,
            fontSize: 24,
            fontWeight: FontWeight.bold,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.qr_code_scanner, color: Colors.white),
            tooltip: 'Scan QR',
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const QrScannerScreen()),
              );
            },
          ),
          IconButton(
            icon: CircleAvatar(
              radius: 16,
              backgroundColor: Colors.white.withOpacity(0.2),
              child: const Icon(Icons.person, color: Colors.white, size: 20),
            ),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => ProfileScreen(user: user)),
              );
            },
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 10),
              Text(
                'Welcome, ${user.name}',
                style: TextStyle(
                  color: Colors.white.withOpacity(0.9),
                  fontSize: 16,
                  fontWeight: FontWeight.w400,
                ),
              ),
              const SizedBox(height: 24),

              // 2x2 Grid of Cards matching the uploaded design
              Expanded(
                child: GridView.count(
                  crossAxisCount: 2,
                  crossAxisSpacing: 16,
                  mainAxisSpacing: 16,
                  childAspectRatio: 1.05,
                  children: [
                    _buildGridCard(
                      context,
                      title: 'Admin',
                      icon: Icons.person_outline,
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => const SessionsScreen()),
                        );
                      },
                    ),
                    _buildGridCard(
                      context,
                      title: 'Teacher',
                      icon: Icons.lightbulb_outline,
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => AddTeacherScreen(requestingUser: user),
                          ),
                        );
                      },
                    ),
                    _buildGridCard(
                      context,
                      title: 'Attendance\nreport',
                      icon: Icons.assignment_outlined,
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => const AttendanceStatsScreen(),
                          ),
                        );
                      },
                    ),
                    _buildGridCard(
                      context,
                      title: 'Teachers\nList',
                      icon: Icons.bar_chart_rounded,
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => const StudentListScreen(),
                          ),
                        );
                      },
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: Colors.white,
        elevation: 4,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        onPressed: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => AddTeacherScreen(requestingUser: user),
            ),
          );
        },
        child: const Icon(Icons.add, color: AppColors.primary, size: 30),
      ),
    );
  }

  Widget _buildGridCard(
    BuildContext context, {
    required String title,
    required IconData icon,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.92),
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.06),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 52,
              height: 52,
              decoration: BoxDecoration(
                color: AppColors.primaryLight,
                shape: BoxShape.circle,
              ),
              child: Icon(icon, size: 28, color: AppColors.primary),
            ),
            const SizedBox(height: 14),
            Text(
              title,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: AppColors.textPrimary,
                fontSize: 14,
                fontWeight: FontWeight.w600,
                height: 1.2,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
