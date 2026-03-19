import 'package:flutter/foundation.dart';
import 'dart:io';
import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:path_provider/path_provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/downloaded_item.dart';

class DownloadService {
  final Dio _dio = Dio();
  static const String _key = 'downloaded_items';

  Future<String> get _localPath async {
    final directory = await getApplicationDocumentsDirectory();
    return directory.path;
  }

  Future<bool> isFileExists(String fileName) async {
    final path = await _localPath;
    final file = File('$path/$fileName');
    return await file.exists();
  }

  Future<String> getFilePath(String fileName) async {
    final path = await _localPath;
    return '$path/$fileName';
  }

  Future<void> downloadFile(
    String url,
    String fileName,
    Function(double) onProgress, {
    required String title,
    required DownloadCategory category,
    String? artistName,
    String? id,
  }) async {
    try {
      final path = await _localPath;
      final savePath = '$path/$fileName';

      await _dio.download(
        url,
        savePath,
        onReceiveProgress: (received, total) {
          if (total != -1) {
            onProgress(received / total);
          }
        },
      );

      // Save metadata
      final items = await getDownloadedItems();
      final newItem = DownloadedItem(
        id: id ?? fileName,
        title: title,
        localPath: fileName,
        url: url,
        category: category,
        artistName: artistName,
      );
      
      // Remove existing if same id (update)
      items.removeWhere((element) => element.id == newItem.id);
      items.add(newItem);
      
      await _saveItems(items);
    } catch (e) {
      debugPrint("Download error: $e");
      rethrow;
    }
  }

  Future<List<DownloadedItem>> getDownloadedItems() async {
    final prefs = await SharedPreferences.getInstance();
    final String? itemsJson = prefs.getString(_key);
    if (itemsJson == null) return [];

    final List<dynamic> decoded = jsonDecode(itemsJson);
    return decoded.map((json) => DownloadedItem.fromJson(json)).toList();
  }

  Future<void> _saveItems(List<DownloadedItem> items) async {
    final prefs = await SharedPreferences.getInstance();
    final String encoded = jsonEncode(items.map((e) => e.toJson()).toList());
    await prefs.setString(_key, encoded);
  }

  Future<void> deleteDownload(String id) async {
    final items = await getDownloadedItems();
    final index = items.indexWhere((element) => element.id == id);
    
    if (index != -1) {
      final item = items[index];
      final path = await _localPath;
      final file = File('$path/${item.localPath}');
      if (await file.exists()) {
        await file.delete();
      }
      items.removeAt(index);
      await _saveItems(items);
    }
  }
}
