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

  // Mock initial demo sessions matching the mockup design
  final List<SessionModel> _mockSessions = [
    SessionModel(
      id: 1,
      sessionName: 'Mathematics',
      sessionCode: 'MATH-101-2026',
      className: 'Class 10',
      expiryTime: DateTime.now().add(const Duration(hours: 2)),
      latitude: 20.2961,
      longitude: 85.8245,
    ),
    SessionModel(
      id: 2,
      sessionName: 'Physics',
      sessionCode: 'PHY-102-2026',
      className: 'Class 10',
      expiryTime: DateTime.now().subtract(const Duration(days: 2)),
      latitude: 20.2961,
      longitude: 85.8245,
    ),
    SessionModel(
      id: 3,
      sessionName: 'Chemistry Lab',
      sessionCode: 'CHEM-203-2026',
      className: 'Class 11',
      expiryTime: DateTime.now().add(const Duration(minutes: 45)),
      latitude: 20.2961,
      longitude: 85.8245,
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
          'Sessions',
          style: TextStyle(
            color: AppColors.textPrimary,
            fontSize: 22,
            fontWeight: FontWeight.bold,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.more_vert, color: AppColors.textPrimary),
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
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.04),
                      blurRadius: 10,
                      offset: const Offset(0, 3),
                    ),
                  ],
                ),
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: TextField(
                  controller: _filterController,
                  decoration: const InputDecoration(
                    icon: Icon(Icons.filter_list, color: AppColors.textMuted),
                    hintText: 'Filter',
                    hintStyle: TextStyle(color: AppColors.textMuted, fontSize: 14),
                    border: InputBorder.none,
                  ),
                ),
              ),
              const SizedBox(height: 20),

              // Sessions list
              Expanded(
                child: _isLoading
                    ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
                    : _filteredSessions.isEmpty
                        ? const Center(
                            child: Text(
                              'No sessions found',
                              style: TextStyle(color: AppColors.textSecondary),
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
        backgroundColor: AppColors.primary,
        elevation: 4,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        onPressed: () {
          // Quick action to scan QR or create session
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

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
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
                style: const TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
              ),
              // Status pill badge matching mockup
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                decoration: BoxDecoration(
                  color: isOpen
                      ? AppColors.primaryLight
                      : Colors.grey.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  isOpen ? 'Open' : 'Finished',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: isOpen ? AppColors.primary : AppColors.textSecondary,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            session.className,
            style: const TextStyle(
              fontSize: 14,
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: 4),
          Row(
            children: [
              const Icon(Icons.access_time, size: 14, color: AppColors.textMuted),
              const SizedBox(width: 6),
              Text(
                session.formattedExpiry,
                style: const TextStyle(
                  fontSize: 12,
                  color: AppColors.textMuted,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
