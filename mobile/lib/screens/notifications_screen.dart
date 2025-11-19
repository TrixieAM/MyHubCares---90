import 'package:flutter/material.dart';
import '../services/api_service.dart';
import 'package:intl/intl.dart';
import 'dart:convert';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({Key? key}) : super(key: key);

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  List<dynamic> _notifications = [];
  bool _isLoading = true;
  bool _isRefreshing = false;

  @override
  void initState() {
    super.initState();
    _loadNotifications();
  }

  Future<void> _loadNotifications() async {
    setState(() => _isLoading = true);
    try {
      final result = await ApiService.getNotifications();
      if (result['success'] == true) {
        // Ensure data is a List
        final data = result['data'];
        List<dynamic> notificationsList = [];
        
        if (data is List) {
          notificationsList = data;
        } else if (data is Map) {
          // If it's a map, try to extract arrays
          notificationsList = data['in_app_messages'] ?? data['messages'] ?? [];
        }
        
        setState(() {
          _notifications = notificationsList;
          _isLoading = false;
        });
      } else {
        setState(() => _isLoading = false);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(result['message'] ?? 'Failed to load notifications')),
          );
        }
      }
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading notifications: ${e.toString()}')),
        );
      }
    }
  }

  Future<void> _refreshNotifications() async {
    setState(() => _isRefreshing = true);
    try {
      final result = await ApiService.getNotifications();
      if (result['success'] == true) {
        // Ensure data is a List
        final data = result['data'];
        List<dynamic> notificationsList = [];
        
        if (data is List) {
          notificationsList = data;
        } else if (data is Map) {
          // If it's a map, try to extract arrays
          notificationsList = data['in_app_messages'] ?? data['messages'] ?? [];
        }
        
        setState(() {
          _notifications = notificationsList;
          _isRefreshing = false;
        });
      } else {
        setState(() => _isRefreshing = false);
      }
    } catch (e) {
      setState(() => _isRefreshing = false);
    }
  }

  Future<void> _markAsRead(String messageId) async {
    final result = await ApiService.markNotificationAsRead(messageId);
    if (result['success'] == true) {
      setState(() {
        final index = _notifications.indexWhere((n) => n['message_id'] == messageId);
        if (index != -1) {
          _notifications[index]['read'] = true;
          _notifications[index]['is_read'] = true;
        }
      });
    }
  }

  void _showNotificationDetails(Map<String, dynamic> notification) {
    // Mark as read if unread
    final isRead = notification['read'] == true || notification['is_read'] == true;
    if (!isRead && notification['message_id'] != null) {
      _markAsRead(notification['message_id']);
    }

    // Parse payload to get appointment details
    final payload = _parsePayload(notification['payload']);
    final isAppointmentNotification = payload != null && 
      (payload['type']?.toString().contains('appointment') ?? false);

    // Show dialog with full details
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return Dialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          child: Container(
            constraints: BoxConstraints(maxWidth: 400, maxHeight: 600),
            padding: EdgeInsets.all(20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        notification['subject'] ?? notification['title'] ?? 'Notification',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: Colors.black87,
                        ),
                      ),
                    ),
                    IconButton(
                      onPressed: () => Navigator.of(context).pop(),
                      icon: Icon(Icons.close),
                      color: Colors.grey[600],
                    ),
                  ],
                ),
                SizedBox(height: 16),
                Divider(),
                SizedBox(height: 16),
                // Content
                Expanded(
                  child: SingleChildScrollView(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Message/Body
                        if (notification['body'] != null || notification['message'] != null)
                          Text(
                            notification['body'] ?? notification['message'] ?? '',
                            style: TextStyle(
                              fontSize: 16,
                              color: Colors.black87,
                              height: 1.5,
                            ),
                          ),
                        SizedBox(height: 20),
                        
                        // Appointment Details Section (if it's an appointment notification)
                        if (isAppointmentNotification && payload != null) ...[
                          Container(
                            padding: EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: Color(0xFFF8F2DE),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: Color(0xFFECDCBF), width: 1),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Appointment Details',
                                  style: TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold,
                                    color: Color(0xFFA31D1D),
                                  ),
                                ),
                                SizedBox(height: 16),
                                
                                // Appointment Type
                                if (payload['appointment_type'] != null)
                                  _buildAppointmentDetailRow(
                                    '📋',
                                    'Type',
                                    _formatAppointmentType(payload['appointment_type']),
                                  ),
                                
                                // Scheduled Date & Time
                                if (payload['scheduled_start'] != null) ...[
                                  SizedBox(height: 12),
                                  _buildAppointmentDetailRow(
                                    '📅',
                                    'Scheduled Date & Time',
                                    _formatAppointmentDate(payload['scheduled_start']),
                                  ),
                                ],
                                
                                // Status (Accepted/Rejected) - Make it bold
                                if (payload['type'] != null) ...[
                                  SizedBox(height: 16),
                                  _buildAppointmentStatus(
                                    payload['type'].toString(),
                                    notification['sender_name'],
                                    payload,
                                  ),
                                ],
                                
                                // Decline Reason (if declined)
                                if (payload['decline_reason'] != null && 
                                    payload['decline_reason'].toString().isNotEmpty) ...[
                                  SizedBox(height: 12),
                                  Container(
                                    padding: EdgeInsets.all(12),
                                    decoration: BoxDecoration(
                                      color: Colors.red[50],
                                      borderRadius: BorderRadius.circular(8),
                                      border: Border.all(color: Colors.red[200]!),
                                    ),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          'Decline Reason:',
                                          style: TextStyle(
                                            fontSize: 12,
                                            fontWeight: FontWeight.w600,
                                            color: Colors.red[900],
                                          ),
                                        ),
                                        SizedBox(height: 4),
                                        Text(
                                          payload['decline_reason'].toString(),
                                          style: TextStyle(
                                            fontSize: 14,
                                            color: Colors.red[800],
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ),
                        ] else if (!isAppointmentNotification) ...[
                          // For non-appointment notifications, show sender if available
                          if (notification['sender_name'] != null)
                            Container(
                              padding: EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: Colors.grey[100],
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: _buildDetailRow(
                                '👤',
                                'From',
                                notification['sender_name'],
                              ),
                            ),
                        ],
                      ],
                    ),
                  ),
                ),
                SizedBox(height: 20),
                // Close button
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () => Navigator.of(context).pop(),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Color(0xFFB82132),
                      padding: EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    child: Text(
                      'Close',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildAppointmentDetailRow(String emoji, String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          emoji,
          style: TextStyle(fontSize: 20),
        ),
        SizedBox(width: 8),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey[700],
                  fontWeight: FontWeight.w500,
                ),
              ),
              SizedBox(height: 4),
              Text(
                value,
                style: TextStyle(
                  fontSize: 15,
                  color: Color(0xFFA31D1D),
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildAppointmentStatus(String type, String? senderName, Map<String, dynamic>? payload) {
    String statusText = '';
    Color statusColor = Colors.grey;
    
    if (type.contains('accepted') || type.contains('confirmed')) {
      statusText = 'ACCEPTED';
      statusColor = Colors.green[700]!;
    } else if (type.contains('declined') || type.contains('rejected')) {
      statusText = 'REJECTED';
      statusColor = Colors.red[700]!;
    } else if (type.contains('created')) {
      statusText = 'SCHEDULED';
      statusColor = Color(0xFFA31D1D);
    } else if (type.contains('updated')) {
      statusText = 'UPDATED';
      statusColor = Colors.orange[700]!;
    } else {
      statusText = 'PENDING';
      statusColor = Colors.blue[700]!;
    }

    // Get provider name from payload or sender name
    String? byWhom;
    if (payload != null && payload['provider_name'] != null) {
      byWhom = payload['provider_name'].toString();
    } else if (senderName != null && senderName.isNotEmpty) {
      byWhom = senderName;
    }

    return Container(
      padding: EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: statusColor.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: statusColor, width: 2),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                'Status: ',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey[700],
                  fontWeight: FontWeight.w500,
                ),
              ),
              Text(
                statusText,
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: statusColor,
                  letterSpacing: 0.5,
                ),
              ),
            ],
          ),
          if (byWhom != null && byWhom.isNotEmpty) ...[
            SizedBox(height: 8),
            Row(
              children: [
                Text(
                  'By: ',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey[700],
                    fontWeight: FontWeight.w500,
                  ),
                ),
                Text(
                  byWhom,
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey[800],
                    fontWeight: FontWeight.w600,
                    fontStyle: FontStyle.italic,
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildDetailRow(String emoji, String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          emoji,
          style: TextStyle(fontSize: 20),
        ),
        SizedBox(width: 8),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey[600],
                  fontWeight: FontWeight.w500,
                ),
              ),
              SizedBox(height: 2),
              Text(
                value,
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.black87,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Future<void> _markAllAsRead() async {
    final result = await ApiService.markAllNotificationsAsRead();
    if (result['success'] == true) {
      setState(() {
        for (var notification in _notifications) {
          notification['read'] = true;
          notification['is_read'] = true;
        }
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('All notifications marked as read')),
        );
      }
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(result['message'] ?? 'Failed to mark all as read')),
        );
      }
    }
  }

  String _formatDate(String? dateString) {
    if (dateString == null || dateString.isEmpty) {
      return 'Just now';
    }
    try {
      final date = DateTime.parse(dateString);
      final now = DateTime.now();
      final difference = now.difference(date);

      if (difference.inDays == 0) {
        if (difference.inHours == 0) {
          if (difference.inMinutes == 0) {
            return 'Just now';
          }
          return '${difference.inMinutes} minute${difference.inMinutes == 1 ? '' : 's'} ago';
        }
        return '${difference.inHours} hour${difference.inHours == 1 ? '' : 's'} ago';
      } else if (difference.inDays == 1) {
        return 'Yesterday';
      } else if (difference.inDays < 7) {
        return '${difference.inDays} days ago';
      } else {
        return DateFormat('MMM d, yyyy').format(date);
      }
    } catch (e) {
      // If parsing fails, return a relative time or the original string
      return 'Recently';
    }
  }

  String _formatAppointmentDate(String? dateString) {
    if (dateString == null || dateString.isEmpty) {
      return 'Date not available';
    }
    try {
      final date = DateTime.parse(dateString);
      return DateFormat('EEEE, MMMM d, yyyy \'at\' h:mm a').format(date);
    } catch (e) {
      return dateString;
    }
  }

  String _formatAppointmentType(String? type) {
    if (type == null || type.isEmpty) return 'Appointment';
    return type.split('_').map((word) => 
      word[0].toUpperCase() + word.substring(1)
    ).join(' ');
  }

  Map<String, dynamic>? _parsePayload(dynamic payload) {
    if (payload == null) return null;
    try {
      if (payload is String) {
        return jsonDecode(payload) as Map<String, dynamic>;
      } else if (payload is Map) {
        return payload as Map<String, dynamic>;
      }
    } catch (e) {
      print('Error parsing payload: $e');
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final unreadCount = _notifications.where((n) => 
      n['read'] != true && n['is_read'] != true
    ).length;

    return Scaffold(
      appBar: AppBar(
        title: Text('Notifications'),
        backgroundColor: Color(0xFFB82132),
        foregroundColor: Colors.white,
        actions: [
          if (unreadCount > 0)
            TextButton(
              onPressed: _markAllAsRead,
              child: Text(
                'Mark all read',
                style: TextStyle(color: Colors.white),
              ),
            ),
        ],
      ),
      body: _isLoading
          ? Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _refreshNotifications,
              child: _notifications.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.notifications_none, size: 64, color: Colors.grey[400]),
                          SizedBox(height: 16),
                          Text(
                            'No notifications',
                            style: TextStyle(
                              fontSize: 18,
                              color: Colors.grey[600],
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          SizedBox(height: 8),
                          Text(
                            'You\'re all caught up!',
                            style: TextStyle(
                              fontSize: 14,
                              color: Colors.grey[500],
                            ),
                          ),
                        ],
                      ),
                    )
                  : ListView.builder(
                      itemCount: _notifications.length,
                      itemBuilder: (context, index) {
                        final notification = _notifications[index];
                        final isRead = notification['read'] == true || notification['is_read'] == true;
                        final messageId = notification['message_id'];

                        return InkWell(
                          onTap: () {
                            _showNotificationDetails(notification);
                          },
                          child: Container(
                            padding: EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: isRead ? Colors.white : Color(0xFFEFF6FF),
                              border: Border(
                                bottom: BorderSide(
                                  color: Colors.grey[200]!,
                                  width: 1,
                                ),
                              ),
                            ),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                // Unread indicator
                                if (!isRead)
                                  Container(
                                    width: 8,
                                    height: 8,
                                    margin: EdgeInsets.only(top: 6, right: 12),
                                    decoration: BoxDecoration(
                                      color: Color(0xFF2563EB),
                                      shape: BoxShape.circle,
                                    ),
                                  )
                                else
                                  SizedBox(width: 20),
                                // Notification content
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        notification['subject'] ?? notification['title'] ?? 'Notification',
                                        style: TextStyle(
                                          fontSize: 16,
                                          fontWeight: isRead ? FontWeight.normal : FontWeight.bold,
                                          color: Colors.black87,
                                        ),
                                      ),
                                      SizedBox(height: 4),
                                      Text(
                                        notification['body'] ?? notification['message'] ?? '',
                                        style: TextStyle(
                                          fontSize: 14,
                                          color: Colors.grey[700],
                                          height: 1.4,
                                        ),
                                        maxLines: 3,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                      SizedBox(height: 8),
                                      Text(
                                        _formatDate(notification['created_at'] ?? 
                                                   notification['timestamp'] ?? 
                                                   notification['sent_at']),
                                        style: TextStyle(
                                          fontSize: 12,
                                          color: Colors.grey[500],
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                // Icon
                                Icon(
                                  Icons.chevron_right,
                                  color: Colors.grey[400],
                                  size: 20,
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
            ),
    );
  }
}

