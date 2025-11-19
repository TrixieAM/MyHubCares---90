import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'dart:convert';
import '../services/api_service.dart';

class CounselingScreen extends StatefulWidget {
  const CounselingScreen({Key? key}) : super(key: key);

  @override
  State<CounselingScreen> createState() => _CounselingScreenState();
}

class _CounselingScreenState extends State<CounselingScreen> {
  List<dynamic> _sessions = [];
  bool _isLoading = true;
  String _searchTerm = '';
  String _typeFilter = 'all';

  // Map display names to database enum values
  final Map<String, String> _sessionTypeMap = {
    'Adherence Counseling': 'adherence',
    'Mental Health Support': 'mental_health',
    'Pre-ART Counseling': 'pre_test',
    'Disclosure Support': 'support',
    'Family Counseling': 'support',
    'Substance Abuse': 'other',
  };

  // Reverse map for display
  final Map<String, String> _sessionTypeDisplayMap = {
    'adherence': 'Adherence Counseling',
    'mental_health': 'Mental Health Support',
    'pre_test': 'Pre-ART Counseling',
    'post_test': 'Post-Test Counseling',
    'support': 'Support',
    'other': 'Other',
  };

  @override
  void initState() {
    super.initState();
    _loadSessions();
  }

  Future<void> _loadSessions() async {
    setState(() => _isLoading = true);
    try {
      final result = await ApiService.getCounselingSessions();
      if (result['success'] == true) {
        setState(() {
          _sessions = result['sessions'] ?? [];
          _isLoading = false;
        });
      } else {
        setState(() => _isLoading = false);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(result['message'] ?? 'Failed to load counseling sessions'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error loading sessions: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  List<dynamic> get _filteredSessions {
    var filtered = List<dynamic>.from(_sessions);

    // Filter by search term
    if (_searchTerm.isNotEmpty) {
      filtered = filtered.where((session) {
        final patientName = (session['patient_name'] ?? '').toLowerCase();
        final sessionTypeDisplay = (_sessionTypeDisplayMap[session['session_type']] ?? 
            session['session_type'] ?? '').toLowerCase();
        return patientName.contains(_searchTerm.toLowerCase()) ||
               sessionTypeDisplay.contains(_searchTerm.toLowerCase());
      }).toList();
    }

    // Filter by type
    if (_typeFilter != 'all') {
      filtered = filtered.where((session) {
        return session['session_type'] == _sessionTypeMap[_typeFilter] ||
               _sessionTypeDisplayMap[session['session_type']] == _typeFilter;
      }).toList();
    }

    return filtered;
  }

  List<String> _getSessionTopics(dynamic session) {
    try {
      final notesData = session['session_notes'] != null 
          ? (session['session_notes'] is String 
              ? jsonDecode(session['session_notes']) 
              : session['session_notes'])
          : {};
      return (notesData['topics'] as List?)?.map((t) => t.toString()).toList() ?? [];
    } catch (e) {
      return [];
    }
  }

  int _getSessionDuration(dynamic session) {
    try {
      final notesData = session['session_notes'] != null 
          ? (session['session_notes'] is String 
              ? jsonDecode(session['session_notes']) 
              : session['session_notes'])
          : {};
      return notesData['duration'] ?? session['duration'] ?? 0;
    } catch (e) {
      return 0;
    }
  }

  bool _isFollowUpDue(dynamic session) {
    return session['follow_up_required'] == true &&
           session['follow_up_date'] != null &&
           DateTime.parse(session['follow_up_date']).isBefore(DateTime.now().add(Duration(days: 1)));
  }

  @override
  Widget build(BuildContext context) {
    final followUpNeeded = _sessions.where((s) => _isFollowUpDue(s)).length;
    final totalSessions = _sessions.length;
    final avgDuration = _sessions.isEmpty 
        ? 0 
        : (_sessions.map((s) => _getSessionDuration(s)).where((d) => d > 0).fold(0, (a, b) => a + b) / 
           _sessions.where((s) => _getSessionDuration(s) > 0).length).round();

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: Text(
          'Counseling',
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.w600,
            color: Color(0xFF1A1A1A),
            letterSpacing: -0.5,
          ),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        bottom: PreferredSize(
          preferredSize: Size.fromHeight(1),
          child: Container(
            height: 1,
            color: Colors.grey[200],
          ),
        ),
        iconTheme: IconThemeData(color: Color(0xFF1A1A1A)),
      ),
      body: _isLoading
          ? Center(
              child: CircularProgressIndicator(
                valueColor: AlwaysStoppedAnimation<Color>(Color(0xFFA31D1D)),
              ),
            )
          : Column(
              children: [
                // Statistics Cards
                if (totalSessions > 0 || followUpNeeded > 0)
                  Container(
                    padding: EdgeInsets.all(20),
                    child: Row(
                      children: [
                        Expanded(
                          child: _buildStatCard(
                            'Total Sessions',
                            '$totalSessions',
                            Icons.chat_bubble_outline,
                            Color(0xFFA31D1D),
                          ),
                        ),
                        SizedBox(width: 12),
                        Expanded(
                          child: _buildStatCard(
                            'Follow-ups Due',
                            '$followUpNeeded',
                            Icons.notifications_active,
                            Color(0xFFD84040),
                          ),
                        ),
                        SizedBox(width: 12),
                        Expanded(
                          child: _buildStatCard(
                            'Avg. Duration',
                            '$avgDuration min',
                            Icons.access_time,
                            Color(0xFFA31D1D),
                          ),
                        ),
                      ],
                    ),
                  ),

                // Follow-up Alert
                if (followUpNeeded > 0)
                  Container(
                    margin: EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                    padding: EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Color(0xFFFFF3CD),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Color(0xFFFFEBA0)),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.warning_amber_rounded, color: Color(0xFF856404)),
                        SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            '$followUpNeeded patient(s) require follow-up counseling',
                            style: TextStyle(
                              color: Color(0xFF856404),
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                // Filter Bar
                Container(
                  padding: EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                  child: Row(
                    children: [
                      Expanded(
                        child: TextField(
                          decoration: InputDecoration(
                            hintText: 'Search sessions...',
                            prefixIcon: Icon(Icons.search, color: Colors.grey[600]),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(8),
                              borderSide: BorderSide(color: Colors.grey[300]!),
                            ),
                            enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(8),
                              borderSide: BorderSide(color: Colors.grey[300]!),
                            ),
                            filled: true,
                            fillColor: Colors.grey[50],
                            contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                          ),
                          onChanged: (value) {
                            setState(() => _searchTerm = value);
                          },
                        ),
                      ),
                      SizedBox(width: 12),
                      Container(
                        width: 150,
                        child: DropdownButtonFormField<String>(
                          value: _typeFilter,
                          decoration: InputDecoration(
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(8),
                              borderSide: BorderSide(color: Colors.grey[300]!),
                            ),
                            enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(8),
                              borderSide: BorderSide(color: Colors.grey[300]!),
                            ),
                            filled: true,
                            fillColor: Colors.grey[50],
                            contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                          ),
                          items: [
                            DropdownMenuItem(value: 'all', child: Text('All Types')),
                            DropdownMenuItem(value: 'Adherence Counseling', child: Text('Adherence')),
                            DropdownMenuItem(value: 'Mental Health Support', child: Text('Mental Health')),
                            DropdownMenuItem(value: 'Pre-ART Counseling', child: Text('Pre-ART')),
                            DropdownMenuItem(value: 'Disclosure Support', child: Text('Disclosure')),
                          ],
                          onChanged: (value) {
                            setState(() => _typeFilter = value ?? 'all');
                          },
                        ),
                      ),
                    ],
                  ),
                ),

                // Sessions List
                Expanded(
                  child: _filteredSessions.isEmpty
                      ? _buildEmptyState()
                      : RefreshIndicator(
                          onRefresh: _loadSessions,
                          color: Color(0xFFA31D1D),
                          child: ListView.builder(
                            padding: EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                            itemCount: _filteredSessions.length,
                            itemBuilder: (context, index) {
                              final session = _filteredSessions[index];
                              return _buildSessionCard(session);
                            },
                          ),
                        ),
                ),
              ],
            ),
      floatingActionButton: FloatingActionButton(
        heroTag: "counseling_fab",
        onPressed: () => _showRecordSessionModal(),
        backgroundColor: Color(0xFFA31D1D),
        elevation: 2,
        child: Icon(Icons.add, color: Colors.white),
      ),
    );
  }

  Widget _buildStatCard(String label, String value, IconData icon, Color color) {
    return Container(
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 24),
          SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: Color(0xFF1A1A1A),
            ),
          ),
          SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey[600],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: EdgeInsets.all(40),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                color: Color(0xFFF5F5F5),
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.chat_bubble_outline,
                size: 56,
                color: Colors.grey[400],
              ),
            ),
            SizedBox(height: 32),
            Text(
              'No Counseling Sessions',
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w600,
                color: Color(0xFF1A1A1A),
                letterSpacing: -0.5,
              ),
            ),
            SizedBox(height: 8),
            Text(
              'Record your first counseling session to get started',
              style: TextStyle(
                fontSize: 15,
                color: Colors.grey[600],
                height: 1.4,
              ),
              textAlign: TextAlign.center,
            ),
            SizedBox(height: 32),
            ElevatedButton(
              onPressed: () => _showRecordSessionModal(),
              style: ElevatedButton.styleFrom(
                padding: EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                backgroundColor: Color(0xFFA31D1D),
                foregroundColor: Colors.white,
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.add, size: 20),
                  SizedBox(width: 8),
                  Text(
                    'Record Session',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
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

  Widget _buildSessionCard(dynamic session) {
    final date = session['session_date'] != null
        ? DateTime.parse(session['session_date'])
        : null;
    final isFollowUpDue = _isFollowUpDue(session);
    final topics = _getSessionTopics(session);
    final duration = _getSessionDuration(session);
    final sessionId = session['session_id']?.toString() ?? 
                      session['counseling_session_id']?.toString() ?? '';

    return Container(
      key: sessionId.isNotEmpty ? ValueKey(sessionId) : null,
      margin: EdgeInsets.only(bottom: 12),
      child: Material(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        child: InkWell(
          onTap: () => _showSessionDetails(session),
          borderRadius: BorderRadius.circular(12),
          child: Container(
            padding: EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: Colors.grey[200]!,
                width: 1,
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            session['patient_name'] ?? 'N/A',
                            style: TextStyle(
                              fontSize: 17,
                              fontWeight: FontWeight.w600,
                              color: Color(0xFF1A1A1A),
                              letterSpacing: -0.3,
                            ),
                          ),
                          SizedBox(height: 8),
                          Row(
                            children: [
                              Icon(Icons.calendar_today, size: 14, color: Colors.grey[600]),
                              SizedBox(width: 6),
                              Text(
                                date != null ? DateFormat('MMM dd, yyyy').format(date) : 'N/A',
                                style: TextStyle(fontSize: 13, color: Colors.grey[700]),
                              ),
                              SizedBox(width: 16),
                              Icon(Icons.chat_bubble_outline, size: 14, color: Colors.grey[600]),
                              SizedBox(width: 6),
                              Text(
                                _sessionTypeDisplayMap[session['session_type']] ?? 
                                session['session_type'] ?? 'N/A',
                                style: TextStyle(fontSize: 13, color: Colors.grey[700]),
                              ),
                              if (duration > 0) ...[
                                SizedBox(width: 16),
                                Icon(Icons.access_time, size: 14, color: Colors.grey[600]),
                                SizedBox(width: 6),
                                Text(
                                  '$duration min',
                                  style: TextStyle(fontSize: 13, color: Colors.grey[700]),
                                ),
                              ],
                            ],
                          ),
                        ],
                      ),
                    ),
                    if (isFollowUpDue)
                      Container(
                        padding: EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: Color(0xFFFFF3CD),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          'FOLLOW-UP DUE',
                          style: TextStyle(
                            fontSize: 10,
                            color: Color(0xFF856404),
                            fontWeight: FontWeight.w600,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ),
                  ],
                ),
                if (topics.isNotEmpty) ...[
                  SizedBox(height: 12),
                  Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    children: topics.take(3).map((topic) {
                      return Container(
                        padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: Color(0xFFF5F5F5),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          topic,
                          style: TextStyle(
                            fontSize: 11,
                            color: Colors.grey[700],
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _showSessionDetails(dynamic session) {
    showDialog(
      context: context,
      builder: (context) => Dialog(
        child: SingleChildScrollView(
          child: Padding(
            padding: EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Session Details',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF1A1A1A),
                      ),
                    ),
                    IconButton(
                      icon: Icon(Icons.close),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ],
                ),
                SizedBox(height: 20),
                _buildDetailRow('Patient', session['patient_name'] ?? 'N/A'),
                _buildDetailRow('Date', session['session_date'] != null
                    ? DateFormat('MMMM dd, yyyy').format(DateTime.parse(session['session_date']))
                    : 'N/A'),
                _buildDetailRow('Type', _sessionTypeDisplayMap[session['session_type']] ?? 
                    session['session_type'] ?? 'N/A'),
                _buildDetailRow('Duration', '${_getSessionDuration(session)} minutes'),
                if (_getSessionTopics(session).isNotEmpty)
                  _buildDetailRow('Topics', _getSessionTopics(session).join(', ')),
                if (session['session_notes'] != null) ...[
                  SizedBox(height: 16),
                  Text(
                    'Notes',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF1A1A1A),
                    ),
                  ),
                  SizedBox(height: 8),
                  Container(
                    padding: EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Color(0xFFF5F5F5),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      _getSessionNotes(session),
                      style: TextStyle(fontSize: 14, color: Colors.grey[700]),
                    ),
                  ),
                ],
                if (session['follow_up_required'] == true) ...[
                  SizedBox(height: 16),
                  Container(
                    padding: EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Color(0xFFD1ECF1),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Color(0xFFBEE5EB)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Follow-up Required',
                          style: TextStyle(
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF0C5460),
                          ),
                        ),
                        if (session['follow_up_date'] != null)
                          Text(
                            'Date: ${DateFormat('MMMM dd, yyyy').format(DateTime.parse(session['follow_up_date']))}',
                            style: TextStyle(color: Color(0xFF0C5460)),
                          ),
                      ],
                    ),
                  ),
                ],
                SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () => Navigator.pop(context),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Color(0xFFA31D1D),
                      foregroundColor: Colors.white,
                      padding: EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    child: Text('Close'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(
              label,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: Colors.grey[700],
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: TextStyle(
                fontSize: 14,
                color: Color(0xFF1A1A1A),
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _getSessionNotes(dynamic session) {
    try {
      final notesData = session['session_notes'] != null 
          ? (session['session_notes'] is String 
              ? jsonDecode(session['session_notes']) 
              : session['session_notes'])
          : {};
      return notesData['notes'] ?? session['session_notes']?.toString() ?? 'No notes available';
    } catch (e) {
      return session['session_notes']?.toString() ?? 'No notes available';
    }
  }

  void _showRecordSessionModal() {
    // TODO: Implement record session modal
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Record session feature coming soon'),
        backgroundColor: Color(0xFFA31D1D),
      ),
    );
  }
}

