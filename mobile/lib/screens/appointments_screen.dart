import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import '../services/api_service.dart';
import '../services/socket_service.dart';
import '../widgets/appointment_reminder_card.dart';

// Optional: Uncomment to enable sound notifications (requires audioplayers package)
// import 'package:audioplayers/audioplayers.dart';

class AppointmentsScreen extends StatefulWidget {
  const AppointmentsScreen({Key? key}) : super(key: key);

  @override
  State<AppointmentsScreen> createState() => _AppointmentsScreenState();
}

class _AppointmentsScreenState extends State<AppointmentsScreen> {
  List<dynamic> _appointments = [];
  bool _isLoading = true;
  List<dynamic> _patients = [];
  List<dynamic> _facilities = [];
  List<dynamic> _providers = [];
  String? _currentUserId;
  String? _currentPatientId;
  String? _currentUserRole;

  @override
  void initState() {
    super.initState();
    _initializeSocket();
    _loadCurrentUser();
    _loadAppointments();
    _loadFormData();
    _startPeriodicRefresh();
  }

  @override
  void dispose() {
    // Audio player cleanup handled by static variable
    super.dispose();
  }

  // Start periodic refresh every 30 seconds (like web version)
  void _startPeriodicRefresh() {
    Future.delayed(Duration(seconds: 30), () {
      if (mounted) {
        _loadAppointments();
        _startPeriodicRefresh(); // Schedule next refresh
      }
    });
  }

  Future<void> _initializeSocket() async {
    try {
      await SocketService.initialize();
      
      // Wait a bit for connection
      await Future.delayed(Duration(milliseconds: 500));
      
      // Set up listeners
      SocketService.onNotification((data) {
        _playNotificationSound();
        _loadAppointments(); // Refresh appointments
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(data['message'] ?? 'New notification'),
              backgroundColor: Colors.green,
              duration: Duration(seconds: 3),
            ),
          );
        }
      });

      SocketService.onNewAppointment((data) {
        _playNotificationSound();
        _loadAppointments(); // Refresh appointments
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(data['message'] ?? 'New appointment notification'),
              backgroundColor: Colors.green,
              duration: Duration(seconds: 3),
            ),
          );
        }
      });

      SocketService.onAppointmentNotification((data) {
        _playNotificationSound();
        _loadAppointments(); // Refresh appointments
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(data['message'] ?? 'Appointment notification'),
              backgroundColor: Colors.green,
              duration: Duration(seconds: 3),
            ),
          );
        }
      });
    } catch (e) {
      print('Error initializing socket: $e');
    }
  }

  void _playNotificationSound() {
    // Sound notifications are optional
    // To enable: 
    // 1. Uncomment the audioplayers import at the top
    // 2. Add: final AudioPlayer _audioPlayer = AudioPlayer(); to state variables
    // 3. Uncomment the code below
    // 4. Run: flutter pub get
    
    // Uncomment when audioplayers is installed:
    /*
    try {
      _audioPlayer.play(AssetSource('notification.mp3')).catchError((e) {
        print('Could not play notification sound: $e');
      });
    } catch (e) {
      print('Audio player error: $e');
    }
    */
    
    // For now, just log that notification sound would play
    print('📢 Notification sound (enable by installing audioplayers package)');
  }

  Future<void> _loadCurrentUser() async {
    try {
      final result = await ApiService.getCurrentUser();
      if (result['success'] == true && result['user'] != null) {
        final user = result['user'];
        setState(() {
          _currentUserId = user['user_id']?.toString();
          _currentUserRole = user['role']?.toLowerCase();
        });

        // If user is a patient, get their patient_id
        if (_currentUserRole == 'patient') {
          String? patientId = user['patient']?['patient_id']?.toString() ?? 
                              user['patient_id']?.toString();
          
          if (patientId == null) {
            // Try to fetch from profile
            final profileResult = await ApiService.getPatientProfile();
            if (profileResult['success'] == true && profileResult['patient'] != null) {
              patientId = profileResult['patient']['patient_id']?.toString();
            }
          }

          if (patientId != null) {
            setState(() => _currentPatientId = patientId);
            // Join patient room for real-time notifications
            SocketService.joinPatientRoom(patientId);
          }
        }

        // Join user room for real-time notifications
        if (_currentUserId != null) {
          SocketService.joinUserRoom(_currentUserId!);
        }
      }
    } catch (e) {
      print('Error loading current user: $e');
    }
  }

  Future<void> _loadFormData() async {
    try {
      // Load patients
      final patientsResult = await ApiService.getPatients();
      if (patientsResult['success'] == true) {
        setState(() => _patients = patientsResult['data'] ?? []);
      } else {
        print('Failed to load patients: ${patientsResult['message']}');
      }

      // Load facilities with better error handling
      final facilitiesResult = await ApiService.getFacilities();
      if (facilitiesResult['success'] == true) {
        final facilitiesData = facilitiesResult['data'];
        if (facilitiesData is List) {
          setState(() => _facilities = facilitiesData);
          print('Loaded ${facilitiesData.length} facilities');
        } else {
          print('Facilities data is not a list: $facilitiesData');
          setState(() => _facilities = []);
        }
      } else {
        print('Failed to load facilities: ${facilitiesResult['message']}');
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Failed to load facilities: ${facilitiesResult['message'] ?? 'Unknown error'}'),
              backgroundColor: Colors.orange,
              duration: Duration(seconds: 3),
            ),
          );
        }
      }

      // Load providers
      final providersResult = await ApiService.getProviders();
      if (providersResult['success'] == true) {
        setState(() => _providers = providersResult['data'] ?? []);
      } else {
        print('Failed to load providers: ${providersResult['message']}');
      }
    } catch (e) {
      print('Error loading form data: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error loading form data: ${e.toString()}'),
            backgroundColor: Colors.red,
            duration: Duration(seconds: 3),
          ),
        );
      }
    }
  }

  Future<void> _loadAppointments() async {
    setState(() => _isLoading = true);
    try {
      final result = await ApiService.getAppointments();
      if (result['success'] == true) {
        setState(() {
          _appointments = result['data'] as List;
          _isLoading = false;
        });
      } else {
        setState(() => _isLoading = false);
        // Show error message with more details
        final errorMessage = result['message'] ?? 'Failed to load appointments';
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(errorMessage),
            backgroundColor: Colors.red,
            duration: Duration(seconds: 4),
          ),
        );
      }
    } catch (e) {
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error loading appointments: ${e.toString()}'),
          backgroundColor: Colors.red,
          duration: Duration(seconds: 4),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: Text(
          'Appointments',
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
          : _appointments.isEmpty
              ? _buildEmptyState()
              : RefreshIndicator(
                  onRefresh: _loadAppointments,
                  color: Color(0xFFA31D1D),
                  child: ListView.builder(
                    padding: EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                    itemCount: _appointments.length,
                    itemBuilder: (context, index) {
                      final appointment = _appointments[index];
                      final appointmentId = appointment['appointment_id']?.toString() ?? 'appt_$index';
                      return _buildAppointmentCard(appointment);
                    },
                  ),
                ),
      floatingActionButton: FloatingActionButton(
        heroTag: "appointments_fab",
        onPressed: () => _showBookAppointmentModal(),
        backgroundColor: Color(0xFFA31D1D),
        elevation: 2,
        child: Icon(Icons.add, color: Colors.white),
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
                Icons.calendar_today_outlined,
                size: 56,
                color: Colors.grey[400],
              ),
            ),
            SizedBox(height: 32),
            Text(
              'No Appointments',
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w600,
                color: Color(0xFF1A1A1A),
                letterSpacing: -0.5,
              ),
            ),
            SizedBox(height: 8),
            Text(
              'Schedule your first appointment to get started',
              style: TextStyle(
                fontSize: 15,
                color: Colors.grey[600],
                height: 1.4,
              ),
              textAlign: TextAlign.center,
            ),
            SizedBox(height: 32),
            ElevatedButton(
              onPressed: () => _showBookAppointmentModal(),
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
                    'Book Appointment',
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

  Widget _buildAppointmentCard(Map<String, dynamic> apt) {
    final date = DateTime.parse(apt['scheduled_start']);
    final endDate = DateTime.parse(apt['scheduled_end']);
    final status = (apt['status'] ?? 'scheduled').toLowerCase();
    final appointmentId = apt['appointment_id']?.toString() ?? '';

    return Container(
      key: appointmentId.isNotEmpty ? ValueKey(appointmentId) : null,
      margin: EdgeInsets.only(bottom: 12),
      child: Material(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        elevation: 0,
        child: InkWell(
          onTap: () => _showAppointmentDetails(apt),
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
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Date indicator
                Container(
                  width: 56,
                  child: Column(
                    children: [
                      Text(
                        DateFormat('MMM').format(date).toUpperCase(),
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFFA31D1D),
                          letterSpacing: 0.5,
                        ),
                      ),
                      SizedBox(height: 4),
                      Text(
                        '${date.day}',
                        style: TextStyle(
                          fontSize: 32,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFF1A1A1A),
                          height: 1,
                        ),
                      ),
                      SizedBox(height: 4),
                      Text(
                        DateFormat('EEE').format(date),
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
                      // Title and status
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: Text(
                              _formatAppointmentType(apt['appointment_type'] ?? ''),
                              style: TextStyle(
                                fontSize: 17,
                                fontWeight: FontWeight.w600,
                                color: Color(0xFF1A1A1A),
                                letterSpacing: -0.3,
                              ),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          SizedBox(width: 12),
                          _buildStatusChip(status),
                        ],
                      ),
                      SizedBox(height: 16),
                      // Time
                      _buildInfoRow(
                        Icons.access_time,
                        '${DateFormat('h:mm a').format(date)} - ${DateFormat('h:mm a').format(endDate)}',
                      ),
                      SizedBox(height: 10),
                      // Facility
                      _buildInfoRow(
                        Icons.local_hospital_outlined,
                        apt['facility_name'] ?? 'N/A',
                      ),
                      if (apt['provider_name'] != null) ...[
                        SizedBox(height: 10),
                        _buildInfoRow(
                          Icons.person_outline,
                          apt['provider_name'],
                        ),
                      ],
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

  Widget _buildStatusChip(String status) {
    Color bgColor;
    Color textColor;
    
    switch (status) {
      case 'scheduled':
      case 'confirmed':
        bgColor = Color(0xFFFEF3F2);
        textColor = Color(0xFFD84040);
        break;
      case 'completed':
        bgColor = Color(0xFFF0FDF4);
        textColor = Color(0xFF10B981);
        break;
      case 'cancelled':
        bgColor = Color(0xFFF5F5F5);
        textColor = Color(0xFF6B7280);
        break;
      default:
        bgColor = Color(0xFFF5F5F5);
        textColor = Color(0xFF6B7280);
    }

    return Container(
      padding: EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        status.toUpperCase(),
        style: TextStyle(
          fontSize: 10,
          color: textColor,
          fontWeight: FontWeight.w600,
          letterSpacing: 0.5,
        ),
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'scheduled':
      case 'confirmed':
        return Color(0xFFD84040);
      case 'completed':
        return Color(0xFF10B981);
      case 'cancelled':
        return Color(0xFFA31D1D);
      default:
        return Colors.grey;
    }
  }

  String _formatAppointmentType(String type) {
    return type.split('_').map((word) => word[0].toUpperCase() + word.substring(1)).join(' ');
  }

  void _showBookAppointmentModal() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _BookAppointmentModal(
        patients: _patients,
        facilities: _facilities,
        providers: _providers,
        onAppointmentBooked: () {
          _loadAppointments();
        },
      ),
    );
  }

  void _showAppointmentDetails(Map<String, dynamic> appointment) {
    showDialog(
      context: context,
      builder: (context) => Dialog(
        child: SingleChildScrollView(
          child: AppointmentReminderCard(appointment: appointment),
        ),
      ),
    );
  }
}

class _BookAppointmentModal extends StatefulWidget {
  final List<dynamic> patients;
  final List<dynamic> facilities;
  final List<dynamic> providers;
  final VoidCallback onAppointmentBooked;

  const _BookAppointmentModal({
    Key? key,
    required this.patients,
    required this.facilities,
    required this.providers,
    required this.onAppointmentBooked,
  }) : super(key: key);

  @override
  State<_BookAppointmentModal> createState() => __BookAppointmentModalState();
}

class __BookAppointmentModalState extends State<_BookAppointmentModal> {
  final _formKey = GlobalKey<FormState>();
  String? _selectedPatientId;
  String? _selectedFacilityId;
  String? _selectedProviderId;
  String? _selectedType;
  DateTime? _selectedDate;
  TimeOfDay? _selectedTime;
  int _durationMinutes = 30;
  final _reasonController = TextEditingController();
  final _notesController = TextEditingController();
  bool _isSubmitting = false;
  bool _isLoadingUser = true;
  String? _currentUserRole;
  String? _patientName;

  @override
  void initState() {
    super.initState();
    _loadCurrentUser();
    // Update patient name when patients list is available
    if (widget.patients.isNotEmpty && _selectedPatientId != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _updatePatientName(_selectedPatientId);
      });
    }
  }

  @override
  void didUpdateWidget(_BookAppointmentModal oldWidget) {
    super.didUpdateWidget(oldWidget);
    // Update patient name when patients list changes
    if (widget.patients.isNotEmpty && _selectedPatientId != null && _patientName == null) {
      _updatePatientName(_selectedPatientId);
    }
  }

  Future<void> _loadCurrentUser() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final userStr = prefs.getString('user');
      String? patientId;
      String? userRole;
      
      if (userStr != null) {
        final user = jsonDecode(userStr);
        userRole = user['role']?.toLowerCase();
        setState(() => _currentUserRole = userRole);
        
        // If user is a patient, get their patient_id
        if (userRole == 'patient') {
          patientId = user['patient_id']?.toString() ?? 
                     user['patient']?['patient_id']?.toString();
        }
      }
      
      // If not found in local storage, try API
      if (patientId == null || userRole == null) {
        final result = await ApiService.getCurrentUser();
        if (result['success'] == true && result['user'] != null) {
          final user = result['user'];
          userRole = user['role']?.toLowerCase();
          setState(() => _currentUserRole = userRole);
          
          if (userRole == 'patient') {
            patientId = user['patient']?['patient_id']?.toString() ?? 
                        user['patient_id']?.toString();
          }
        }
      }
      
      // If still not found and user is a patient, try profile endpoint
      if (userRole == 'patient' && patientId == null) {
        final profileResult = await ApiService.getPatientProfile();
        if (profileResult['success'] == true && profileResult['patient'] != null) {
          patientId = profileResult['patient']['patient_id']?.toString();
        }
      }
      
      // Set patient_id and fetch patient name
      if (userRole == 'patient' && patientId != null) {
        setState(() {
          _selectedPatientId = patientId;
          _isLoadingUser = false;
        });
        // Fetch patient name directly from profile API
        await _fetchPatientNameFromAPI(patientId);
      } else {
        setState(() => _isLoadingUser = false);
      }
    } catch (e) {
      setState(() => _isLoadingUser = false);
    }
  }

  Future<void> _fetchPatientNameFromAPI(String? patientId) async {
    if (patientId == null) return;
    
    try {
      // First try to get from patients list if available
      if (widget.patients.isNotEmpty) {
        try {
          final patient = widget.patients.firstWhere(
            (p) => p['patient_id']?.toString() == patientId,
          );
          setState(() {
            _patientName = '${patient['first_name']} ${patient['last_name']}${patient['uic'] != null ? ' (${patient['uic']})' : ''}';
          });
          return;
        } catch (e) {
          // Patient not in list, continue to API call
        }
      }
      
      // Fetch directly from patient profile API
      final profileResult = await ApiService.getPatientProfile();
      if (profileResult['success'] == true && profileResult['patient'] != null) {
        final patient = profileResult['patient'];
        setState(() {
          _patientName = '${patient['first_name']} ${patient['last_name']}${patient['uic'] != null ? ' (${patient['uic']})' : ''}';
        });
      } else {
        setState(() {
          _patientName = 'Patient ID: $patientId';
        });
      }
    } catch (e) {
      setState(() {
        _patientName = 'Patient ID: $patientId';
      });
    }
  }

  void _updatePatientName(String? patientId) {
    // This method is kept for backward compatibility but now uses API
    _fetchPatientNameFromAPI(patientId);
  }

  @override
  void dispose() {
    _reasonController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _submitAppointment() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedDate == null || _selectedTime == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Please select date and time')),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      final scheduledStart = DateTime(
        _selectedDate!.year,
        _selectedDate!.month,
        _selectedDate!.day,
        _selectedTime!.hour,
        _selectedTime!.minute,
      );
      final scheduledEnd = scheduledStart.add(Duration(minutes: _durationMinutes));

      final scheduledStartStr = scheduledStart.toIso8601String().replaceAll('T', ' ').substring(0, 19);
      final scheduledEndStr = scheduledEnd.toIso8601String().replaceAll('T', ' ').substring(0, 19);

      // Check availability before creating
      final availabilityResult = await ApiService.checkAvailability(
        facilityId: _selectedFacilityId!,
        providerId: _selectedProviderId,
        scheduledStart: scheduledStartStr,
        scheduledEnd: scheduledEndStr,
      );

      if (!mounted) return;

      if (availabilityResult['success'] != true || 
          availabilityResult['data']?['available'] != true) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('The selected time slot is not available. Please choose another time.'),
            backgroundColor: Colors.orange,
          ),
        );
        setState(() => _isSubmitting = false);
        return;
      }

      final appointmentData = {
        'patient_id': _selectedPatientId,
        'facility_id': _selectedFacilityId,
        'provider_id': _selectedProviderId,
        'appointment_type': _selectedType,
        'scheduled_start': scheduledStartStr,
        'scheduled_end': scheduledEndStr,
        'duration_minutes': _durationMinutes,
        'reason': _reasonController.text.isEmpty ? null : _reasonController.text,
        'notes': _notesController.text.isEmpty ? null : _notesController.text,
      };

      final result = await ApiService.createAppointment(appointmentData);

      if (!mounted) return;

      if (result['success'] == true) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                Icon(Icons.check_circle, color: Colors.white),
                SizedBox(width: 8),
                Text('Appointment booked successfully!'),
              ],
            ),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.pop(context);
        widget.onAppointmentBooked();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result['message'] ?? 'Failed to book appointment'),
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
        setState(() => _isSubmitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.9,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        children: [
          // Handle bar
          Container(
            margin: EdgeInsets.symmetric(vertical: 12),
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
                  'Book Appointment',
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
          // Form
          Expanded(
            child: Form(
              key: _formKey,
              child: ListView(
                padding: EdgeInsets.all(20),
                children: [
                  // Patient - Hide dropdown if current user is a patient
                  _isLoadingUser
                      ? Padding(
                          padding: EdgeInsets.symmetric(vertical: 16),
                          child: Row(
                            children: [
                              SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2)),
                              SizedBox(width: 8),
                              Text('Loading patient information...'),
                            ],
                          ),
                        )
                      : _currentUserRole?.toLowerCase() == 'patient'
                          ? Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Patient *',
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: Colors.grey[700],
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                                SizedBox(height: 8),
                                Container(
                                  padding: EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: Colors.grey[200],
                                    borderRadius: BorderRadius.circular(4),
                                    border: Border.all(color: Colors.grey[300]!),
                                  ),
                                  child: Text(
                                    _patientName ?? (_selectedPatientId != null ? 'Patient ID: $_selectedPatientId' : 'Loading...'),
                                    style: TextStyle(
                                      fontSize: 16,
                                      color: Colors.grey[700],
                                    ),
                                  ),
                                ),
                              ],
                            )
                          : DropdownButtonFormField<String>(
                              decoration: InputDecoration(labelText: 'Patient *'),
                              value: _selectedPatientId,
                              items: widget.patients.map<DropdownMenuItem<String>>((p) {
                                return DropdownMenuItem<String>(
                                  value: p['patient_id']?.toString(),
                                  child: Text('${p['first_name']} ${p['last_name']}${p['uic'] != null ? ' (${p['uic']})' : ''}'),
                                );
                              }).toList(),
                              onChanged: (value) => setState(() => _selectedPatientId = value),
                              validator: (value) => value == null ? 'Please select patient' : null,
                            ),
                  SizedBox(height: 16),
                  // Facility
                  DropdownButtonFormField<String>(
                    decoration: InputDecoration(labelText: 'Facility *'),
                    value: _selectedFacilityId,
                    items: widget.facilities.map<DropdownMenuItem<String>>((f) {
                      return DropdownMenuItem<String>(
                        value: f['facility_id']?.toString(),
                        child: Text(f['facility_name'] ?? 'N/A'),
                      );
                    }).toList(),
                    onChanged: (value) => setState(() => _selectedFacilityId = value),
                    validator: (value) => value == null ? 'Please select facility' : null,
                  ),
                  SizedBox(height: 16),
                  // Provider (Optional)
                  DropdownButtonFormField<String>(
                    decoration: InputDecoration(labelText: 'Provider (Optional)'),
                    value: _selectedProviderId,
                    items: [
                      DropdownMenuItem<String>(value: null, child: Text('Select Provider (Optional)')),
                      ...widget.providers.map<DropdownMenuItem<String>>((p) {
                        return DropdownMenuItem<String>(
                          value: p['user_id']?.toString(),
                          child: Text('${p['full_name'] ?? p['username']} (${p['role'] ?? ''})'),
                        );
                      }),
                    ],
                    onChanged: (value) => setState(() => _selectedProviderId = value),
                  ),
                  SizedBox(height: 16),
                  // Appointment Type
                  DropdownButtonFormField<String>(
                    decoration: InputDecoration(labelText: 'Appointment Type *'),
                    value: _selectedType,
                    items: [
                      'initial',
                      'follow_up',
                      'art_pickup',
                      'lab_test',
                      'counseling',
                      'general',
                    ].map((type) {
                      return DropdownMenuItem(
                        value: type,
                        child: Text(_formatAppointmentType(type)),
                      );
                    }).toList(),
                    onChanged: (value) => setState(() => _selectedType = value),
                    validator: (value) => value == null ? 'Please select type' : null,
                  ),
                  SizedBox(height: 16),
                  // Date
                  ListTile(
                    title: Text('Date *'),
                    subtitle: Text(
                      _selectedDate == null
                          ? 'Select date'
                          : DateFormat('MMMM dd, yyyy').format(_selectedDate!),
                    ),
                    trailing: Icon(Icons.calendar_today),
                    onTap: () async {
                      final date = await showDatePicker(
                        context: context,
                        initialDate: DateTime.now().add(Duration(days: 1)),
                        firstDate: DateTime.now(),
                        lastDate: DateTime.now().add(Duration(days: 365)),
                      );
                      if (date != null) {
                        setState(() => _selectedDate = date);
                      }
                    },
                  ),
                  SizedBox(height: 16),
                  // Time
                  ListTile(
                    title: Text('Time *'),
                    subtitle: Text(
                      _selectedTime == null
                          ? 'Select time'
                          : _selectedTime!.format(context),
                    ),
                    trailing: Icon(Icons.access_time),
                    onTap: () async {
                      final time = await showTimePicker(
                        context: context,
                        initialTime: TimeOfDay.now(),
                      );
                      if (time != null) {
                        setState(() => _selectedTime = time);
                      }
                    },
                  ),
                  SizedBox(height: 16),
                  // Duration
                  TextFormField(
                    decoration: InputDecoration(labelText: 'Duration (minutes)'),
                    keyboardType: TextInputType.number,
                    initialValue: '30',
                    onChanged: (value) {
                      _durationMinutes = int.tryParse(value) ?? 30;
                    },
                  ),
                  SizedBox(height: 16),
                  // Reason
                  TextFormField(
                    controller: _reasonController,
                    decoration: InputDecoration(labelText: 'Reason'),
                    maxLines: 2,
                  ),
                  SizedBox(height: 16),
                  // Notes
                  TextFormField(
                    controller: _notesController,
                    decoration: InputDecoration(labelText: 'Notes'),
                    maxLines: 3,
                  ),
                  SizedBox(height: 30),
                  // Submit button
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _isSubmitting ? null : _submitAppointment,
                      style: ElevatedButton.styleFrom(
                        padding: EdgeInsets.symmetric(vertical: 16),
                        backgroundColor: Color(0xFFA31D1D),
                        foregroundColor: Colors.white,
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      child: _isSubmitting
                          ? SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                              ),
                            )
                          : Text(
                              'Book Appointment',
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
          ),
        ],
      ),
    );
  }

  String _formatAppointmentType(String type) {
    return type.split('_').map((word) => word[0].toUpperCase() + word.substring(1)).join(' ');
  }
}
