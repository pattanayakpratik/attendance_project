import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

class AttendanceStatsScreen extends StatefulWidget {
  const AttendanceStatsScreen({super.key});

  @override
  State<AttendanceStatsScreen> createState() => _AttendanceStatsScreenState();
}

class _AttendanceStatsScreenState extends State<AttendanceStatsScreen> {
  int _selectedTabIndex = 0;

  // Mock data matching Screen 6 of the Design Mockup
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
      backgroundColor: AppColors.scaffoldBg(context),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new, color: AppColors.textMain(context), size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'Attendance Stats',
          style: TextStyle(
            color: AppColors.textMain(context),
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
    final isDark = AppColors.isDark(context);

    return GestureDetector(
      onTap: () => setState(() => _selectedTabIndex = index),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
        decoration: BoxDecoration(
          color: isSelected
              ? (isDark ? const Color(0xFF38B2AC) : AppColors.primary)
              : (isDark ? const Color(0xFF132429) : Colors.white),
          borderRadius: BorderRadius.circular(20),
          border: isDark && !isSelected ? Border.all(color: const Color(0xFF1E373E)) : null,
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: (isDark ? const Color(0xFF38B2AC) : AppColors.primary).withOpacity(0.3),
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
            color: isSelected ? (isDark ? const Color(0xFF0B1619) : Colors.white) : AppColors.textSub(context),
          ),
        ),
      ),
    );
  }

  Widget _buildStatCard(Map<String, dynamic> item) {
    final double percent = (item['percentage'] as int) / 100.0;
    final Color barColor = item['color'] as Color;
    final isDark = AppColors.isDark(context);

    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF132429) : Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: isDark ? Border.all(color: const Color(0xFF1E373E)) : null,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(isDark ? 0.3 : 0.03),
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
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textMain(context),
                ),
              ),
              Text(
                '${item['percentage']} %',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textMain(context),
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
              backgroundColor: barColor.withOpacity(isDark ? 0.25 : 0.15),
              valueColor: AlwaysStoppedAnimation<Color>(barColor),
            ),
          ),
          const SizedBox(height: 14),

          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                item['className'],
                style: TextStyle(
                  fontSize: 13,
                  color: AppColors.textSub(context),
                  fontWeight: FontWeight.w500,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: barColor.withOpacity(isDark ? 0.25 : 0.12),
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
