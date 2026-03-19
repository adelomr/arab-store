import 'package:flutter/material.dart';
import '../models/reciter.dart';
import '../models/surah.dart';
import '../models/downloaded_item.dart';
import '../services/download_service.dart';

class DownloadProvider extends ChangeNotifier {
  final DownloadService _downloadService = DownloadService();
  
  // Maps reciterId to its current download progress (0.0 to 1.0)
  final Map<String, double> _batchProgress = {};
  
  // Maps reciterId to current status message
  final Map<String, String> _batchStatus = {};

  double? getBatchProgress(String reciterId) => _batchProgress[reciterId];
  String? getBatchStatus(String reciterId) => _batchStatus[reciterId];

  bool isDownloading(String reciterId) => _batchProgress.containsKey(reciterId);

  Future<void> downloadReciterBatch(Reciter reciter, List<Surah> surahs) async {
    final String reciterId = reciter.id.toString();
    
    if (isDownloading(reciterId)) return;

    _batchProgress[reciterId] = 0.0;
    _batchStatus[reciterId] = "جاري التحقق من الملفات...";
    notifyListeners();

    int total = surahs.length;
    int completed = 0;

    try {
      for (var surah in surahs) {
        final fileName = "${reciter.id}_${surah.id}.mp3";
        
        bool exists = await _downloadService.isFileExists(fileName);
        if (!exists) {
          _batchStatus[reciterId] = "جاري تحميل: ${surah.name} ($completed/$total)";
          notifyListeners();

          await _downloadService.downloadFile(
            surah.url,
            fileName,
            (progress) {
              // We could track individual progress here if we wanted a super smooth bar
              // but for 114 surahs, per-file increment is usually enough.
            },
            title: surah.name,
            category: DownloadCategory.quran,
            artistName: reciter.name,
            id: fileName,
          );
        }
        
        completed++;
        _batchProgress[reciterId] = completed / total;
        notifyListeners();
      }
      
      _batchStatus[reciterId] = "تم تحميل جميع السور بنجاح";
      notifyListeners();
      
      // Keep the status for a few seconds then clear
      await Future.delayed(const Duration(seconds: 5));
      _batchProgress.remove(reciterId);
      _batchStatus.remove(reciterId);
      notifyListeners();
      
    } catch (e) {
      _batchStatus[reciterId] = "حدث خطأ أثناء التحميل";
      _batchProgress.remove(reciterId);
      notifyListeners();
      debugPrint("Batch download error for reciter ${reciter.name}: $e");
    }
  }
}
