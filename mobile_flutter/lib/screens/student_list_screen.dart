import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../services/api_service.dart';

class StudentListScreen extends StatefulWidget {
  const StudentListScreen({super.key});

  @override
  State<StudentListScreen> createState() => _StudentListScreenState();
}

class _StudentListScreenState extends State<StudentListScreen> {
  final TextEditingController _searchController = TextEditingController();
  List<Map<String, dynamic>> _students = [];
  List<Map<String, dynamic>> _filteredStudents = [];
  bool _isLoading = true;

  // Mock Students matching Screen 3 of Design Mockup
  final List<Map<String, dynamic>> _mockStudents = [
    {
      'id': 101,
      'name': 'Emma Johnson',
      'class': 'Class 10',
      'phone': '+91 9381075071',
      'email': 'emma@school.com',
      'avatar': 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    },
    {
      'id': 102,
      'name': 'Robert Brown',
      'class': 'Class 10',
      'phone': '+91 9088552381',
      'email': 'robert@school.com',
      'avatar': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    },
    {
      'id': 103,
      'name': 'David Wilson',
      'class': 'Class 10',
      'phone': '+91 7334872502',
      'email': 'david@school.com',
      'avatar': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    },
    {
      'id': 104,
      'name': 'Sarah Taylor',
      'class': 'Class 10',
      'phone': '+91 9811097016',
      'email': 'sarah@school.com',
      'avatar': 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
    },
  ];

  @override
  void initState() {
    super.initState();
    _fetchStudents();
    _searchController.addListener(_onSearchChanged);
  }

  Future<void> _fetchStudents() async {
    setState(() => _isLoading = true);
    final apiStudents = await ApiService.getStudents();
    if (mounted) {
      setState(() {
        if (apiStudents.isNotEmpty) {
          _students = apiStudents;
        } else {
          _students = _mockStudents;
        }
        _filteredStudents = _students;
        _isLoading = false;
      });
    }
  }

  void _onSearchChanged() {
    final query = _searchController.text.toLowerCase();
    setState(() {
      _filteredStudents = _students.where((s) {
        final name = (s['name'] ?? '').toString().toLowerCase();
        final sClass = (s['class'] ?? '').toString().toLowerCase();
        final phone = (s['phone'] ?? '').toString().toLowerCase();
        return name.contains(query) || sClass.contains(query) || phone.contains(query);
      }).toList();
    });
  }

  @override
  Widget build(BuildContext context) {
    final isDark = AppColors.isDark(context);

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
          'Student List',
          style: TextStyle(
            color: AppColors.textMain(context),
            fontSize: 22,
            fontWeight: FontWeight.bold,
          ),
        ),
        centerTitle: false,
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
          child: Column(
            children: [
              // Search input matching design
              Container(
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF132429) : Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: isDark ? Border.all(color: const Color(0xFF1E373E)) : null,
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: isDark ? 0.3 : 0.04),
                      blurRadius: 10,
                      offset: const Offset(0, 3),
                    ),
                  ],
                ),
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: TextField(
                  controller: _searchController,
                  style: TextStyle(color: AppColors.textMain(context)),
                  decoration: InputDecoration(
                    icon: Icon(Icons.search, color: isDark ? const Color(0xFF38B2AC) : AppColors.textMuted),
                    hintText: 'Search',
                    hintStyle: TextStyle(
                      color: isDark ? const Color(0xFF64748B) : AppColors.textMuted,
                      fontSize: 14,
                    ),
                    border: InputBorder.none,
                  ),
                ),
              ),
              const SizedBox(height: 20),

              // Student List
              Expanded(
                child: _isLoading
                    ? Center(child: CircularProgressIndicator(color: isDark ? const Color(0xFF38B2AC) : AppColors.primary))
                    : _filteredStudents.isEmpty
                        ? Center(
                            child: Text(
                              'No students found',
                              style: TextStyle(color: AppColors.textSub(context)),
                            ),
                          )
                        : ListView.separated(
                            itemCount: _filteredStudents.length,
                            separatorBuilder: (context, index) => const SizedBox(height: 12),
                            itemBuilder: (context, index) {
                              final student = _filteredStudents[index];
                              return _buildStudentCard(student);
                            },
                          ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStudentCard(Map<String, dynamic> student) {
    final name = student['name'] ?? 'Student';
    final sClass = student['class'] ?? 'Class 10';
    final phone = student['phone'] ?? '';
    final avatarUrl = student['avatar'];
    final isDark = AppColors.isDark(context);

    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF132429) : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: isDark ? Border.all(color: const Color(0xFF1E373E)) : null,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.3 : 0.03),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      child: Row(
        children: [
          CircleAvatar(
            radius: 24,
            backgroundColor: isDark ? const Color(0xFF1A343B) : AppColors.primaryLight,
            backgroundImage: avatarUrl != null ? NetworkImage(avatarUrl) : null,
            child: avatarUrl == null
                ? Text(
                    name.isNotEmpty ? name[0].toUpperCase() : 'S',
                    style: TextStyle(
                      color: isDark ? const Color(0xFF38B2AC) : AppColors.primary,
                      fontWeight: FontWeight.bold,
                      fontSize: 18,
                    ),
                  )
                : null,
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textMain(context),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  sClass,
                  style: TextStyle(
                    fontSize: 13,
                    color: isDark ? const Color(0xFF38B2AC) : AppColors.textSecondary,
                  ),
                ),
                if (phone.isNotEmpty) ...[
                  const SizedBox(height: 2),
                  Text(
                    phone,
                    style: TextStyle(
                      fontSize: 12,
                      color: AppColors.textSub(context),
                    ),
                  ),
                ],
              ],
            ),
          ),
          IconButton(
            icon: Icon(Icons.chevron_right, color: AppColors.textSub(context)),
            onPressed: () {},
          ),
        ],
      ),
    );
  }
}
