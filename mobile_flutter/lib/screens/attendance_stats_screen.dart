import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

class AttendanceStatsScreen extends StatefulWidget {
  const AttendanceStatsScreen({super.key});

  @override
  State<AttendanceStatsScreen> createState() => _AttendanceStatsScreenState();
}

class _AttendanceStatsScreenState extends State<AttendanceStatsScreen> {
  int _selectedTabIndex = 0; // 0: Class Wise, 1: Student Wise

  final List<Map<String, dynamic>> _classStats = [
    {
      'title': 'Absent',
      'percentage': 12,
      'className': 'Class 10',
      'code': '0407%',
      'color': AppColors.absentCoral,
    },
    {
      'title': 'Absent',
      'percentage': 9,
      'className': 'Class 11',
      'code': '6001%',
      'color': AppColors.classPurple,
    },
    {
      'title': 'Class 12',
      'percentage': 5,
      'className': 'Class 12',
      'code': '2071%',
      'color': AppColors.classBlue,
    },
  ];

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
          'Attendance Stats',
          style: TextStyle(
            color: AppColors.textPrimary,
            fontSize: 22,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Segmented selector tabs matching design: Class Wise / Student Wise
              Row(
                children: [
                  _buildSegmentTab('Class Wise', 0),
                  const SizedBox(width: 12),
                  _buildSegmentTab('Student Wise', 1),
                ],
              ),
              const SizedBox(height: 24),

              // Progress Stat Cards matching mockup design
              Expanded(
                child: ListView.separated(
                  itemCount: _classStats.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 16),
                  itemBuilder: (context, index) {
                    final item = _classStats[index];
                    return _buildStatCard(item);
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSegmentTab(String title, int index) {
    final isSelected = _selectedTabIndex == index;
    return GestureDetector(
      onTap: () => setState(() => _selectedTabIndex = index),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary : Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: AppColors.primary.withOpacity(0.2),
                    blurRadius: 8,
                    offset: const Offset(0, 3),
                  ),
                ]
              : [],
        ),
        child: Text(
          title,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: isSelected ? Colors.white : AppColors.textSecondary,
          ),
        ),
      ),
    );
  }

  Widget _buildStatCard(Map<String, dynamic> item) {
    final double percent = (item['percentage'] as int) / 100.0;
    final Color barColor = item['color'] as Color;

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                item['title'],
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
              ),
              Text(
                '${item['percentage']} %',
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // Colored Progress Bar
          ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: LinearProgressIndicator(
              value: percent,
              minHeight: 8,
              backgroundColor: barColor.withOpacity(0.15),
              valueColor: AlwaysStoppedAnimation<Color>(barColor),
            ),
          ),
          const SizedBox(height: 14),

          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                item['className'],
                style: const TextStyle(
                  fontSize: 13,
                  color: AppColors.textSecondary,
                  fontWeight: FontWeight.w500,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: barColor.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  item['code'],
                  style: TextStyle(
                    fontSize: 11,
                    color: barColor,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
