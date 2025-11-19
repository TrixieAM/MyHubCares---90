import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:flutter/foundation.dart' show kIsWeb;
import 'api_service.dart';

class SocketService {
  static IO.Socket? _socket;
  static bool _isConnected = false;

  // Get socket server URL (same base as API but without /api)
  static String get socketUrl {
    // Use the same base URL logic as ApiService
    final apiUrl = ApiService.baseUrl;
    // Remove /api from the end if present
    if (apiUrl.endsWith('/api')) {
      return apiUrl.substring(0, apiUrl.length - 4);
    }
    return apiUrl.replaceAll('/api', '');
  }

  // Initialize socket connection
  static Future<void> initialize() async {
    if (_socket != null && _isConnected) {
      return; // Already connected
    }

    try {
      final token = await ApiService.getToken();
      
      _socket = IO.io(
        socketUrl,
        IO.OptionBuilder()
            .setTransports(['websocket'])
            .enableAutoConnect()
            .enableReconnection()
            .setReconnectionDelay(1000)
            .setReconnectionDelayMax(5000)
            .setReconnectionAttempts(5)
            .setExtraHeaders({
              if (token != null) 'Authorization': 'Bearer $token',
            })
            .build(),
      );

      _socket!.onConnect((_) {
        _isConnected = true;
        print('✅ Socket connected: ${_socket!.id}');
      });

      _socket!.onDisconnect((_) {
        _isConnected = false;
        print('❌ Socket disconnected');
      });

      _socket!.onConnectError((error) {
        _isConnected = false;
        print('❌ Socket connection error: $error');
      });

      _socket!.onError((error) {
        print('❌ Socket error: $error');
      });
    } catch (e) {
      print('❌ Error initializing socket: $e');
      _isConnected = false;
    }
  }

  // Join user room
  static void joinUserRoom(String userId) {
    if (_socket != null && _isConnected) {
      _socket!.emit('joinRoom', userId);
      print('👤 Joined user room: $userId');
    }
  }

  // Join patient room
  static void joinPatientRoom(String patientId) {
    if (_socket != null && _isConnected) {
      _socket!.emit('joinPatientRoom', patientId);
      print('👤 Joined patient room: $patientId');
    }
  }

  // Listen for new notifications
  static void onNotification(Function(dynamic) callback) {
    if (_socket != null) {
      _socket!.on('newNotification', (data) {
        print('📢 New notification received: $data');
        callback(data);
      });
    }
  }

  // Listen for new appointments
  static void onNewAppointment(Function(dynamic) callback) {
    if (_socket != null) {
      _socket!.on('newAppointment', (data) {
        print('📅 New appointment notification: $data');
        callback(data);
      });
    }
  }

  // Listen for appointment notifications
  static void onAppointmentNotification(Function(dynamic) callback) {
    if (_socket != null) {
      _socket!.on('appointmentNotification', (data) {
        print('📅 Appointment notification: $data');
        callback(data);
      });
    }
  }

  // Remove all listeners
  static void removeAllListeners() {
    if (_socket != null) {
      _socket!.clearListeners();
    }
  }

  // Disconnect socket
  static void disconnect() {
    if (_socket != null) {
      _socket!.disconnect();
      _socket!.dispose();
      _socket = null;
      _isConnected = false;
      print('🔌 Socket disconnected and disposed');
    }
  }

  // Check if connected
  static bool get isConnected => _isConnected;

  // Get socket instance
  static IO.Socket? get socket => _socket;
}

