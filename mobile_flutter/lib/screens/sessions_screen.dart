import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../models/session_model.dart';
import '../services/api_service.dart';
import 'qr_scanner_screen.dart';

class SessionsScreen extends StatefulWidget {
  const SessionsScreen({super.key});

  @override
  State<SessionsScreen> createState() => _SessionsScreenState();
}

class _SessionsScreenState extends State<SessionsScreen> {
  final TextEditingController _filterController = TextEditingController();
  List<SessionModel> _sessions = [];
  List<SessionModel> _filteredSessions = [];
  bool _isLoading = true;

  // Mock sessions matching Screen 4 of Design Mockup
  final List<SessionModel> _mockSessions = [
    SessionModel(
      id: 1,
      sessionName: 'Mathematics',
      sessionCode: 'MATH-10-8801',
      className: 'Class 10',
      expiryTime: DateTime.now().add(const Duration(hours: 1)),
      createdBy: 1,
      createdByName: 'Dr. John Doe',
    ),
    SessionModel(
      id: 2,
      sessionName: 'Physics',
      sessionCode: 'PHYS-10-4492',
      className: 'Class 10',
      expiryTime: DateTime.now().subtract(const Duration(minutes: 40)),
      createdBy: 2,
      createdByName: 'Dr. Katherine Bell',
    ),
    SessionModel(
      id: 3,
      sessionName: 'Chemistry',
      sessionCode: 'CHEM-11-2099',
      className: 'Class 11',
      expiryTime: DateTime.now().add(const Duration(hours: 2)),
      createdBy: 1,
      createdByName: 'Prof. Marcus',
    ),
  ];

  @override
  void initState() {
    super.initState();
    _fetchSessions();
    _filterController.addListener(_onFilterChanged);
  }

  Future<void> _fetchSessions() async {
    setState(() => _isLoading = true);
    final apiSessions = await ApiService.getSessions();
    if (mounted) {
      setState(() {
        if (apiSessions.isNotEmpty) {
          _sessions = apiSessions;
        } else {
          _sessions = _mockSessions;
        }
        _filteredSessions = _sessions;
        _isLoading = false;
      });
    }
  }

  void _onFilterChanged() {
    final query = _filterController.text.toLowerCase();
    setState(() {
      _filteredSessions = _sessions.where((s) {
        return s.sessionName.toLowerCase().contains(query) ||
            s.className.toLowerCase().contains(query) ||
            s.sessionCode.toLowerCase().contains(query);
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
          'Sessions',
          style: TextStyle(
            color: AppColors.textMain(context),
            fontSize: 22,
            fontWeight: FontWeight.bold,
          ),
        ),
        actions: [
          IconButton(
            icon: Icon(Icons.more_vert, color: AppColors.textMain(context)),
            onPressed: () {},
          ),
        ],
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
          child: Column(
            children: [
              // Filter input bar matching mockup
              Container(
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF132429) : Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: isDark ? Border.all(color: const Color(0xFF1E373E)) : null,
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(isDark ? 0.3 : 0.04),
                      blurRadius: 10,
                      offset: const Offset(0, 3),
                    ),
                  ],
                ),
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: TextField(
                  controller: _filterController,
                  style: TextStyle(color: AppColors.textMain(context)),
                  decoration: InputDecoration(
                    icon: Icon(Icons.filter_list, color: isDark ? const Color(0xFF38B2AC) : AppColors.textMuted),
                    hintText: 'Filter',
                    hintStyle: TextStyle(
                      color: isDark ? const Color(0xFF64748B) : AppColors.textMuted,
                      fontSize: 14,
                    ),
                    border: InputBorder.none,
                  ),
                ),
              ),
              const SizedBox(height: 20),

              // Sessions list
              Expanded(
                child: _isLoading
                    ? Center(child: CircularProgressIndicator(color: isDark ? const Color(0xFF38B2AC) : AppColors.primary))
                    : _filteredSessions.isEmpty
                        ? Center(
                            child: Text(
                              'No sessions found',
                              style: TextStyle(color: AppColors.textSub(context)),
                            ),
                          )
                        : ListView.separated(
                            itemCount: _filteredSessions.length,
                            separatorBuilder: (_, __) => const SizedBox(height: 14),
                            itemBuilder: (context, index) {
                              final session = _filteredSessions[index];
                              return _buildSessionCard(session);
                            },
                          ),
              ),
            ],
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: isDark ? const Color(0xFF38B2AC) : AppColors.primary,
        elevation: 4,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        onPressed: () {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const QrScannerScreen()),
          );
        },
        child: const Icon(Icons.add, color: Colors.white, size: 30),
      ),
    );
  }

  Widget _buildSessionCard(SessionModel session) {
    final isOpen = session.isOpen;
    final isDark = AppColors.isDark(context);

    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF132429) : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: isDark ? Border.all(color: const Color(0xFF1E373E)) : null,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(isDark ? 0.3 : 0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                session.sessionName,
                style: TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textMain(context),
                ),
              ),
              // Status pill badge matching mockup
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                decoration: BoxDecoration(
                  color: isOpen
                      ? (isDark ? const Color(0xFF1A343B) : AppColors.primaryLight)
                      : (isDark ? const Color(0xFF1A262A) : Colors.grey.withOpacity(0.15)),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  isOpen ? 'Open' : 'Finished',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: isOpen
                        ? (isDark ? const Color(0xFF38B2AC) : AppColors.primary)
                        : (isDark ? const Color(0xFF94A3B8) : AppColors.textSecondary),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            session.className,
            style: TextStyle(
              fontSize: 14,
              color: isDark ? const Color(0xFF38B2AC) : AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: 4),
          Row(
            children: [
              Icon(Icons.access_time, size: 14, color: AppColors.textSub(context)),
              const SizedBox(width: 6),
              Text(
                session.formattedExpiry,
                style: TextStyle(
                  fontSize: 12,
                  color: AppColors.textSub(context),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
