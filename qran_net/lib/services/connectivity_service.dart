import 'dart:io';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/foundation.dart';

class ConnectivityService {
  static final ConnectivityService _instance = ConnectivityService._internal();
  factory ConnectivityService() => _instance;
  ConnectivityService._internal();

  final Connectivity _connectivity = Connectivity();

  Stream<bool> get onConnectivityChanged {
    return _connectivity.onConnectivityChanged.asyncMap((results) async {
       return await hasGoodConnection();
    });
  }

  Future<bool> hasGoodConnection() async {
    try {
      final List<ConnectivityResult> results = await _connectivity.checkConnectivity();
      
      // If we are on mobile or wifi, we might have internet.
      // But let's do a real check (DNS or Ping) to be sure there is ACTUAL internet access.
      if (results.contains(ConnectivityResult.mobile) || 
          results.contains(ConnectivityResult.wifi) || 
          results.contains(ConnectivityResult.ethernet)) {
        
        if (kIsWeb) return true; // On web, we assume if browser says online, we are good or let Dio fail

        try {
          // Try to lookup google.com to verify actual internet access
          final result = await InternetAddress.lookup('google.com').timeout(const Duration(seconds: 3));
          return result.isNotEmpty && result[0].rawAddress.isNotEmpty;
        } on SocketException catch (_) {
          return false;
        } catch (_) {
          return false;
        }
      }
      return false;
    } catch (e) {
      debugPrint("Error checking connectivity: $e");
      return false;
    }
  }
}
