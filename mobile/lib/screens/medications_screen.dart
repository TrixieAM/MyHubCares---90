import 'package:flutter/material.dart';
import '../services/api_service.dart';

class MedicationsScreen extends StatefulWidget {
  const MedicationsScreen({Key? key}) : super(key: key);

  @override
  State<MedicationsScreen> createState() => _MedicationsScreenState();
}

class _MedicationsScreenState extends State<MedicationsScreen> {
  List<dynamic> _reminders = [];
  List<dynamic> _adherenceRecords = [];
  bool _isLoading = true;
  double _adherenceRate = 0.0;
  String? _patientId;
  Map<String, dynamic> _adherenceSummary = {};
  bool _isMarking = false;
  List<dynamic> _prescriptions = [];
  List<dynamic> _prescribedMedications = [];
  
  // Form controllers
  final _formKey = GlobalKey<FormState>();
  final _medicationNameController = TextEditingController();
  final _dosageController = TextEditingController();
  final _specialInstructionsController = TextEditingController();
  String _selectedFrequency = 'daily';
  TimeOfDay _selectedTime = const TimeOfDay(hour: 9, minute: 0);
  String _selectedSoundPreference = 'default';
  bool _isActive = true;
  bool _browserNotifications = true;
  String? _selectedPrescriptionId;

  @override
  void initState() {
    super.initState();
    _initializeData();
  }

  Future<void> _initializeData() async {
    await _loadUserInfo();
    await _loadReminders();
    await _loadAdherenceData();
  }
  
  Future<void> _loadPrescriptions() async {
    if (_patientId == null) return;
    
    try {
      final result = await ApiService.getPrescriptions(patientId: _patientId);
      if (result['success'] == true) {
        setState(() {
          _prescriptions = result['data'] ?? [];
          _extractPrescribedMedications();
        });
      }
    } catch (e) {
      print('Error loading prescriptions: $e');
    }
  }
  
  void _extractPrescribedMedications() {
    final medications = <Map<String, dynamic>>[];
    final seen = <String>{};
    
    for (var prescription in _prescriptions) {
      if (prescription['items'] != null) {
        for (var item in prescription['items']) {
          final key = '${item['medication_name']}-${item['dosage'] ?? ''}-${item['frequency'] ?? ''}';
          if (!seen.contains(key) && item['medication_name'] != null) {
            seen.add(key);
            medications.add({
              'medication_name': item['medication_name'],
              'dosage': item['dosage'],
              'frequency': item['frequency'],
              'prescription_id': prescription['prescription_id'],
              'prescription_item_id': item['prescription_item_id'],
            });
          }
        }
      }
    }
    
    setState(() {
      _prescribedMedications = medications;
    });
  }

  Future<void> _loadUserInfo() async {
    try {
      final userResult = await ApiService.getCurrentUser();
      if (userResult['success'] == true && userResult['user'] != null) {
        setState(() {
          _patientId = userResult['user']['patient_id'] ?? userResult['user']['user_id'];
        });
        // Load prescriptions after patient ID is set
        await _loadPrescriptions();
      }
    } catch (e) {
      print('Error loading user info: $e');
    }
  }

  Future<void> _loadReminders() async {
    if (_patientId == null) return;
    
    setState(() => _isLoading = true);
    try {
      // Load reminders from API (same as web)
      final remindersResult = await ApiService.getMedicationReminders(
        patientId: _patientId,
      );
      
      List<dynamic> remindersFromAPI = [];
      if (remindersResult['success'] == true) {
        remindersFromAPI = remindersResult['data'] as List;
      }
      
      // Also load from prescriptions and build reminders (like web does)
      if (_prescriptions.isEmpty) {
        await _loadPrescriptions();
      }
      
      List<dynamic> remindersFromPrescriptions = [];
      for (var prescription in _prescriptions) {
        if (prescription['status'] == 'active' && prescription['items'] != null) {
          for (var item in prescription['items']) {
            remindersFromPrescriptions.add({
              'reminder_id': 'reminder-${prescription['prescription_id']}-${item['prescription_item_id']}',
              'prescription_id': prescription['prescription_id'],
              'patient_id': _patientId,
              'medication_name': item['medication_name'],
              'dosage': item['dosage'],
              'frequency': item['frequency'],
              'reminder_time': '09:00:00', // Default reminder time
              'active': prescription['status'] == 'active',
              'missed_doses': 0,
              'browser_notifications': true,
            });
          }
        }
      }
      
      // Combine both sources, prioritizing API reminders
      final allReminders = <dynamic>[];
      final seenIds = <String>{};
      
      // Add API reminders first
      for (var reminder in remindersFromAPI) {
        final id = reminder['reminder_id']?.toString() ?? reminder['id']?.toString();
        if (id != null && !seenIds.contains(id)) {
          allReminders.add(reminder);
          seenIds.add(id);
        }
      }
      
      // Add prescription reminders that aren't already in the list
      for (var reminder in remindersFromPrescriptions) {
        final id = reminder['reminder_id']?.toString();
        if (id != null && !seenIds.contains(id)) {
          allReminders.add(reminder);
          seenIds.add(id);
        }
      }
      
      setState(() {
        _reminders = allReminders;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error loading reminders: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _loadAdherenceData() async {
    if (_patientId == null) return;

    try {
      final result = await ApiService.getPatientAdherence(patientId: _patientId!);
      if (result['success'] == true) {
        setState(() {
          _adherenceRecords = result['data'] ?? [];
          _adherenceSummary = result['summary'] ?? {};
          _adherenceRate = _adherenceSummary['overall_adherence_percentage']?.toDouble() ?? 0.0;
        });
      }
    } catch (e) {
      print('Error loading adherence data: $e');
    }
  }

  Future<void> _markAsTaken(Map<String, dynamic> reminder, bool taken) async {
    if (_patientId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Patient ID not found. Please login again.'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    final prescriptionId = reminder['prescription_id']?.toString();
    if (prescriptionId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Prescription ID not found in reminder'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    setState(() => _isMarking = true);

    try {
      final now = DateTime.now();
      final today = '${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}';
      final result = await ApiService.recordMedicationAdherence(
        prescriptionId: prescriptionId,
        patientId: _patientId!,
        adherenceDate: today,
        taken: taken,
        missedReason: taken ? null : 'Not taken',
      );

      if (result['success'] == true) {
        // Reload data to reflect changes
        await _loadReminders();
        await _loadAdherenceData();

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(taken ? '✅ Medication marked as taken!' : '⚠️ Medication marked as missed'),
              backgroundColor: taken ? const Color(0xFF10B981) : Colors.orange,
              duration: const Duration(seconds: 2),
            ),
          );
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(result['message'] ?? 'Failed to record adherence'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      setState(() => _isMarking = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: Text(
          'Medication Adherence',
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
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              _loadReminders();
              _loadAdherenceData();
            },
            tooltip: 'Refresh',
          ),
        ],
      ),
      body: _isLoading
          ? Center(
              child: CircularProgressIndicator(
                valueColor: AlwaysStoppedAnimation<Color>(Color(0xFFA31D1D)),
              ),
            )
          : _reminders.isEmpty
              ? _buildEmptyState()
              : RefreshIndicator(
                  onRefresh: () async {
                    await _loadReminders();
                    await _loadAdherenceData();
                  },
                  color: Color(0xFFA31D1D),
                  child: ListView(
                    padding: EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                    children: [
                      _buildAdherenceCard(),
                      SizedBox(height: 20),
                      ..._reminders
                          .where((r) => r['active'] != false)
                          .map<Widget>((reminder) => _buildMedicationCard(reminder)),
                    ],
                  ),
                ),
      floatingActionButton: FloatingActionButton(
        heroTag: "medications_fab",
        onPressed: () => _showAddReminderModal(),
        backgroundColor: Color(0xFFA31D1D),
        elevation: 2,
        child: Icon(Icons.add, color: Colors.white),
      ),
    );
  }

  Widget _buildAdherenceCard() {
    final activeReminders = _reminders.where((r) => r['active'] != false).length;
    final overallAdherence = _adherenceRate;
    
    final adherenceClass = overallAdherence >= 95 
        ? 'success' 
        : overallAdherence >= 80 
            ? 'warning' 
            : 'danger';

    return Container(
      margin: EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: Colors.grey[200]!,
          width: 1,
        ),
      ),
      child: Padding(
        padding: EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Adherence Overview',
              style: TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.w600,
                color: Color(0xFF1A1A1A),
                letterSpacing: -0.3,
              ),
            ),
            SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: _buildStatCard(
                    'Active Reminders',
                    '$activeReminders',
                    Icons.notifications_outlined,
                    Color(0xFF2563EB),
                  ),
                ),
                SizedBox(width: 12),
                Expanded(
                  child: _buildStatCard(
                    'Adherence Rate',
                    '${overallAdherence.toStringAsFixed(1)}%',
                    Icons.trending_up,
                    adherenceClass == 'success' 
                        ? Color(0xFF10B981) 
                        : adherenceClass == 'warning' 
                            ? Colors.orange 
                            : Color(0xFFEF4444),
                  ),
                ),
              ],
            ),
            SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _buildStatCard(
                    'Taken',
                    '${_adherenceSummary['taken_records'] ?? 0}',
                    Icons.check_circle_outline,
                    Color(0xFF10B981),
                  ),
                ),
                SizedBox(width: 12),
                Expanded(
                  child: _buildStatCard(
                    'Missed',
                    '${_adherenceSummary['missed_records'] ?? 0}',
                    Icons.warning_amber_rounded,
                    Colors.orange,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatCard(String label, String value, IconData icon, Color color) {
    return Container(
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 18, color: color),
              SizedBox(width: 8),
              Expanded(
                child: Text(
                  label,
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey[600],
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ],
          ),
          SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: color,
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
                Icons.medication_outlined,
                size: 56,
                color: Colors.grey[400],
              ),
            ),
            SizedBox(height: 32),
            Text(
              'No Medication Reminders',
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w600,
                color: Color(0xFF1A1A1A),
                letterSpacing: -0.5,
              ),
            ),
            SizedBox(height: 8),
            Text(
              'Create your first reminder to get started',
              style: TextStyle(
                fontSize: 15,
                color: Colors.grey[600],
                height: 1.4,
              ),
              textAlign: TextAlign.center,
            ),
            SizedBox(height: 32),
            ElevatedButton(
              onPressed: () => _showAddReminderModal(),
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
                    'Add Reminder',
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

  Widget _buildMedicationCard(Map<String, dynamic> reminder) {
    final reminderTime = reminder['reminder_time'] ?? '09:00:00';
    final timeStr = reminderTime.toString().substring(0, 5); // Get HH:MM
    final medicationName = reminder['medication_name'] ?? 'Medication';
    final dosage = reminder['dosage'] ?? '';
    final frequency = reminder['frequency'] ?? 'daily';
    final prescriptionId = reminder['prescription_id']?.toString();
    final reminderId = reminder['reminder_id']?.toString() ?? 
                       reminder['medication_reminder_id']?.toString() ?? 
                       prescriptionId ?? '';
    
    // Check if today's dose was already recorded
    final today = DateTime.now();
    final todayStr = '${today.year}-${today.month.toString().padLeft(2, '0')}-${today.day.toString().padLeft(2, '0')}';
    final todayRecord = _adherenceRecords.firstWhere(
      (record) => record['prescription_id']?.toString() == prescriptionId && 
                  record['adherence_date'] == todayStr,
      orElse: () => {},
    );
    
    // Get adherence for this reminder
    final reminderAdherence = _getReminderAdherence(reminder);

    return Container(
      key: reminderId.isNotEmpty ? ValueKey(reminderId) : null,
      margin: EdgeInsets.only(bottom: 12),
      child: Material(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        elevation: 0,
        child: InkWell(
          onTap: () => _showMedicationDetails(reminder),
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
                    // Time indicator
                    Container(
                      width: 56,
                      child: Column(
                        children: [
                          Text(
                            timeStr,
                            style: TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.w700,
                              color: Color(0xFF1A1A1A),
                              height: 1,
                            ),
                          ),
                          SizedBox(height: 4),
                          Text(
                            'Time',
                            style: TextStyle(
                              fontSize: 11,
                              color: Colors.grey[600],
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ),
                    SizedBox(width: 20),
                    // Content
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            medicationName,
                            style: TextStyle(
                              fontSize: 17,
                              fontWeight: FontWeight.w600,
                              color: Color(0xFF1A1A1A),
                              letterSpacing: -0.3,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                          SizedBox(height: 16),
                          _buildInfoRow(
                            Icons.schedule,
                            'Take $frequency at $timeStr',
                          ),
                          if (dosage.isNotEmpty) ...[
                            SizedBox(height: 10),
                            _buildInfoRow(
                              Icons.science_outlined,
                              'Dosage: $dosage',
                            ),
                          ],
                          if (reminderAdherence != null) ...[
                            SizedBox(height: 10),
                            _buildInfoRow(
                              Icons.trending_up,
                              'Adherence: ${reminderAdherence['percentage']}% (${reminderAdherence['takenCount']}/${reminderAdherence['totalCount']} doses)',
                            ),
                          ],
                          if (todayRecord.isNotEmpty) ...[
                            SizedBox(height: 10),
                            Container(
                              padding: EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                              decoration: BoxDecoration(
                                color: (todayRecord['taken'] == true ? Color(0xFF10B981) : Colors.orange).withOpacity(0.1),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(
                                    todayRecord['taken'] == true ? Icons.check_circle : Icons.close,
                                    size: 14,
                                    color: todayRecord['taken'] == true ? Color(0xFF10B981) : Colors.orange,
                                  ),
                                  SizedBox(width: 6),
                                  Text(
                                    'Today: ${todayRecord['taken'] == true ? 'Taken' : 'Missed'}',
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: todayRecord['taken'] == true ? Color(0xFF10B981) : Colors.orange,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ],
                ),
                SizedBox(height: 16),
                if (todayRecord.isEmpty)
                  Row(
                    children: [
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: _isMarking
                              ? null
                              : () => _markAsTaken(reminder, true),
                          icon: const Icon(Icons.check_circle, size: 18),
                          label: const Text('Taken'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF10B981),
                            foregroundColor: Colors.white,
                            padding: EdgeInsets.symmetric(vertical: 12),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                            elevation: 0,
                          ),
                        ),
                      ),
                      SizedBox(width: 10),
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: _isMarking
                              ? null
                              : () => _markAsTaken(reminder, false),
                          icon: const Icon(Icons.close, size: 18),
                          label: const Text('Missed'),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: Colors.orange,
                            side: const BorderSide(color: Colors.orange, width: 1.5),
                            padding: EdgeInsets.symmetric(vertical: 12),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String text) {
    return Row(
      children: [
        Icon(
          icon,
          size: 16,
          color: Colors.grey[600],
        ),
        SizedBox(width: 8),
        Expanded(
          child: Text(
            text,
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey[700],
              height: 1.4,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }

  Map<String, dynamic>? _getReminderAdherence(Map<String, dynamic> reminder) {
    final prescriptionId = reminder['prescription_id']?.toString();
    if (prescriptionId == null) return null;
    
    final prescriptionAdherence = _adherenceRecords.where(
      (record) => record['prescription_id']?.toString() == prescriptionId
    ).toList();
    
    if (prescriptionAdherence.isEmpty) return null;
    
    final takenCount = prescriptionAdherence.where((r) => r['taken'] == true).length;
    final totalCount = prescriptionAdherence.length;
    final percentage = totalCount > 0 ? ((takenCount / totalCount) * 100).round() : 0;
    
    return {
      'percentage': percentage,
      'takenCount': takenCount,
      'totalCount': totalCount,
    };
  }


  void _showMedicationDetails(Map<String, dynamic> reminder) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  reminder['medication_name'] ?? 'Medication Details',
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
            const SizedBox(height: 16),
            _buildDetailRow('Frequency', reminder['frequency'] ?? 'N/A'),
            _buildDetailRow('Time', reminder['reminder_time'] ?? 'N/A'),
            if (reminder['dosage'] != null)
              _buildDetailRow('Dosage', reminder['dosage'].toString()),
            if (reminder['missed_doses'] != null && reminder['missed_doses'] > 0)
              _buildDetailRow('Missed Doses', reminder['missed_doses'].toString()),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey[600],
            ),
          ),
          Text(
            value,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  void _showAddReminderModal() {
    
    // Reset form
    _medicationNameController.clear();
    _dosageController.clear();
    _specialInstructionsController.clear();
    _selectedFrequency = 'daily';
    _selectedTime = const TimeOfDay(hour: 9, minute: 0);
    _selectedSoundPreference = 'default';
    _isActive = true;
    _browserNotifications = true;
    _selectedPrescriptionId = null;
    
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        constraints: BoxConstraints(
          maxHeight: MediaQuery.of(context).size.height * 0.9,
        ),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              // Handle bar
              Container(
                margin: const EdgeInsets.only(top: 12),
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              
              // Header
              Padding(
                padding: EdgeInsets.symmetric(horizontal: 20),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Add Medication Reminder',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF1A1A1A),
                        letterSpacing: -0.5,
                      ),
                    ),
                    IconButton(
                      icon: Icon(Icons.close),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ],
                ),
              ),
              Divider(height: 1, color: Colors.grey[200]),
              // Form content
              Expanded(
                child: ListView(
                    padding: EdgeInsets.all(20),
                    children: [
                      // Medication Name
                      _buildMedicationNameField(),
                      SizedBox(height: 16),
                      
                      // Dosage and Frequency Row
                      Row(
                        children: [
                          Expanded(
                            child: _buildDosageField(),
                          ),
                          SizedBox(width: 12),
                          Expanded(
                            child: _buildFrequencyField(),
                          ),
                        ],
                      ),
                      SizedBox(height: 16),
                      
                      // Reminder Time
                      _buildTimeField(),
                      SizedBox(height: 16),
                      
                      // Sound Preference
                      _buildSoundPreferenceField(),
                      SizedBox(height: 16),
                      
                      // Checkboxes
                      _buildCheckboxes(),
                      SizedBox(height: 16),
                      
                      // Special Instructions
                      _buildSpecialInstructionsField(),
                      SizedBox(height: 30),
                      
                      // Submit button
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: _isMarking ? null : _handleAddReminder,
                          style: ElevatedButton.styleFrom(
                            padding: EdgeInsets.symmetric(vertical: 16),
                            backgroundColor: Color(0xFFA31D1D),
                            foregroundColor: Colors.white,
                            elevation: 0,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                          ),
                          child: _isMarking
                              ? SizedBox(
                                  height: 20,
                                  width: 20,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                  ),
                                )
                              : Text(
                                  'Create Reminder',
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
  
  Widget _buildMedicationNameField() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(
              'Medication Name',
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey[700],
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(width: 4),
            const Text(
              '*',
              style: TextStyle(color: Colors.red),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Autocomplete<String>(
          optionsBuilder: (TextEditingValue textEditingValue) {
            if (textEditingValue.text.isEmpty) {
              return _prescribedMedications
                  .map((m) => m['medication_name'] as String)
                  .toList();
            }
            return _prescribedMedications
                .map((m) => m['medication_name'] as String)
                .where((name) => name.toLowerCase().contains(
                      textEditingValue.text.toLowerCase(),
                    ))
                .toList();
          },
          onSelected: (String selection) {
            _medicationNameController.text = selection;
            final medication = _prescribedMedications.firstWhere(
              (m) => m['medication_name'] == selection,
              orElse: () => {},
            );
            if (medication.isNotEmpty) {
              _dosageController.text = medication['dosage'] ?? '';
              _selectedFrequency = medication['frequency'] ?? 'daily';
              _selectedPrescriptionId = medication['prescription_id']?.toString();
            }
          },
          fieldViewBuilder: (
            BuildContext context,
            TextEditingController textEditingController,
            FocusNode focusNode,
            VoidCallback onFieldSubmitted,
          ) {
            return TextFormField(
              controller: textEditingController,
              focusNode: focusNode,
              decoration: InputDecoration(
                labelText: 'Medication Name *',
                hintText: 'Select or type medication name',
              ),
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Please enter medication name';
                }
                return null;
              },
            );
          },
        ),
        if (_prescribedMedications.isEmpty)
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Text(
              'No prescriptions found. You can type a medication name manually.',
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey[600],
              ),
            ),
          )
        else
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Text(
              'Select from your prescribed medications or type manually',
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey[600],
              ),
            ),
          ),
      ],
    );
  }
  
  Widget _buildDosageField() {
    return TextFormField(
      controller: _dosageController,
      decoration: InputDecoration(
        labelText: 'Dosage',
        hintText: 'e.g., 500mg',
      ),
    );
  }
  
  Widget _buildFrequencyField() {
    return DropdownButtonFormField<String>(
      decoration: InputDecoration(labelText: 'Frequency *'),
      value: _selectedFrequency,
      items: const [
        DropdownMenuItem(value: 'daily', child: Text('Daily')),
        DropdownMenuItem(value: 'twice daily', child: Text('Twice Daily')),
        DropdownMenuItem(value: 'three times daily', child: Text('Three Times Daily')),
        DropdownMenuItem(value: 'weekly', child: Text('Weekly')),
      ],
      onChanged: (value) {
        setState(() {
          _selectedFrequency = value ?? 'daily';
        });
      },
      validator: (value) => value == null ? 'Please select frequency' : null,
    );
  }
  
  Widget _buildTimeField() {
    return ListTile(
      title: Text('Reminder Time *'),
      subtitle: Text(_selectedTime.format(context)),
      trailing: Icon(Icons.access_time),
      onTap: () async {
        final TimeOfDay? picked = await showTimePicker(
          context: context,
          initialTime: _selectedTime,
        );
        if (picked != null) {
          setState(() {
            _selectedTime = picked;
          });
        }
      },
    );
  }
  
  Widget _buildSoundPreferenceField() {
    return DropdownButtonFormField<String>(
      decoration: InputDecoration(labelText: 'Sound Preference'),
      value: _selectedSoundPreference,
      items: const [
        DropdownMenuItem(value: 'default', child: Text('Default')),
        DropdownMenuItem(value: 'gentle', child: Text('Gentle')),
        DropdownMenuItem(value: 'urgent', child: Text('Urgent')),
      ],
      onChanged: (value) {
        setState(() {
          _selectedSoundPreference = value ?? 'default';
        });
      },
    );
  }
  
  Widget _buildCheckboxes() {
    return Column(
      children: [
        CheckboxListTile(
          title: Text('Enable browser notifications'),
          value: _browserNotifications,
          onChanged: (value) {
            setState(() {
              _browserNotifications = value ?? true;
            });
          },
          activeColor: Color(0xFFA31D1D),
          contentPadding: EdgeInsets.zero,
        ),
        CheckboxListTile(
          title: Text('Active'),
          value: _isActive,
          onChanged: (value) {
            setState(() {
              _isActive = value ?? true;
            });
          },
          activeColor: Color(0xFFA31D1D),
          contentPadding: EdgeInsets.zero,
        ),
      ],
    );
  }
  
  Widget _buildSpecialInstructionsField() {
    return TextFormField(
      controller: _specialInstructionsController,
      decoration: InputDecoration(
        labelText: 'Special Instructions (Optional)',
        hintText: 'Enter any special instructions...',
      ),
      maxLines: 3,
    );
  }
  
  Future<void> _handleAddReminder() async {
    if (!_formKey.currentState!.validate()) return;
    
    if (_medicationNameController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Please enter a medication name')),
      );
      return;
    }
    
    if (_patientId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Patient ID not found. Please login again.')),
      );
      return;
    }
    
    setState(() => _isMarking = true);
    
    // Format time
    final timeStr = '${_selectedTime.hour.toString().padLeft(2, '0')}:${_selectedTime.minute.toString().padLeft(2, '0')}:00';
    
    final reminderData = {
      'medication_name': _medicationNameController.text.trim(),
      'dosage': _dosageController.text.trim(),
      'frequency': _selectedFrequency,
      'reminder_time': timeStr,
      'active': _isActive,
      'browser_notifications': _browserNotifications,
      'sound_preference': _selectedSoundPreference,
      'special_instructions': _specialInstructionsController.text.trim(),
      'patient_id': _patientId,
      if (_selectedPrescriptionId != null) 'prescription_id': _selectedPrescriptionId,
    };
    
    try {
      final result = await ApiService.createMedicationReminder(reminderData);
      
      if (!mounted) return;
      
      if (result['success'] == true) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                Icon(Icons.check_circle, color: Colors.white),
                SizedBox(width: 8),
                Text('Reminder created successfully!'),
              ],
            ),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.pop(context);
        await _loadReminders();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result['message'] ?? 'Failed to create reminder'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error: ${e.toString()}'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      if (mounted) {
        setState(() => _isMarking = false);
      }
    }
  }
  
  @override
  void dispose() {
    _medicationNameController.dispose();
    _dosageController.dispose();
    _specialInstructionsController.dispose();
    super.dispose();
  }
}
