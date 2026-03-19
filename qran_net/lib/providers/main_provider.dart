import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/reciter.dart';
import '../models/surah.dart';

class MainProvider extends ChangeNotifier {
  final ApiService _apiService = ApiService();

  List<Reciter> _reciters = [];
  bool _isLoading = false;
  String _searchQuery = "";

  List<Reciter> get reciters {
    if (_searchQuery.isEmpty) {
      return _reciters;
    }
    final normalizedQuery = _normalize(_searchQuery);
    return _reciters.where((r) {
      final normalizedName = _normalize(r.name);
      return normalizedName.contains(normalizedQuery);
    }).toList();
  }

  String _normalize(String text) {
    return text
        .replaceAll(RegExp(r'[أإآ]'), 'ا')
        .replaceAll('ة', 'ه')
        .replaceAll('ى', 'ي')
        .replaceAll(RegExp(r'[\u064B-\u065F]'), ''); // Remove Tashkeel
  }

  bool get isLoading => _isLoading;

  Future<void> fetchRecitersState({bool isMujawwad = false}) async {
    _isLoading = true;
    notifyListeners();

    _reciters = await _apiService.fetchReciters(isMujawwad: isMujawwad);

    _isLoading = false;
    notifyListeners();
  }

  void searchReciter(String query) {
    _searchQuery = query;
    notifyListeners();
  }

  List<Surah> getSurahs(Moshaf moshaf) {
    List<Surah> surahs = [];
    List<String> surahIds = moshaf.surahList.split(',');

    for (var idStr in surahIds) {
      int id = int.tryParse(idStr) ?? 0;
      if (id > 0) {
        String paddedId = id.toString().padLeft(3, '0');

        // Ensure server URL ends with /
        String tempServer = moshaf.server;
        if (!tempServer.endsWith('/')) tempServer += '/';

        String url = "$tempServer$paddedId.mp3";

        surahs.add(Surah(id: id, name: Surah.getName(id), url: url));
      }
    }
    return surahs;
  }
}
