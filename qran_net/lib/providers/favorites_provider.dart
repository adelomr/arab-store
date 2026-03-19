import 'dart:convert';
import 'package:flutter/foundation.dart' show ChangeNotifier, kIsWeb;
import 'package:shared_preferences/shared_preferences.dart';
import '../services/database_helper.dart';
import '../models/favorite_item.dart';
import '../models/surah.dart';

class FavoritesProvider extends ChangeNotifier {
  List<FavoriteItem> _favoriteItems = [];
  static const String _webFavoritesKey = 'favorites_list';

  List<FavoriteItem> get favoriteItems => _favoriteItems;

  FavoritesProvider() {
    refreshFavorites();
  }

  Future<void> refreshFavorites() async {
    if (kIsWeb) {
      final prefs = await SharedPreferences.getInstance();
      final String? jsonString = prefs.getString(_webFavoritesKey);
      if (jsonString != null) {
        final List<dynamic> decoded = jsonDecode(jsonString);
        _favoriteItems = decoded.map((item) => FavoriteItem.fromMap(item)).toList();
      } else {
        _favoriteItems = [];
      }
      notifyListeners();
      return;
    }
    _favoriteItems = await DatabaseHelper.instance.getFavorites();
    notifyListeners();
  }

  Future<void> _saveWebFavorites() async {
    if (!kIsWeb) return;
    final prefs = await SharedPreferences.getInstance();
    final jsonString = jsonEncode(_favoriteItems.map((item) => item.toMap()).toList());
    await prefs.setString(_webFavoritesKey, jsonString);
  }

  bool isFavorite(Surah surah) {
    // Check by URL as it is unique for the audio file
    return _favoriteItems.any((item) => item.url == surah.url);
  }

  Future<void> toggleFavorite(Surah surah, {String? subtitle, String? type}) async {
    final isFav = isFavorite(surah);
    
    if (isFav) {
      // Find the item to remove (by URL)
      final itemToRemove = _favoriteItems.firstWhere((item) => item.url == surah.url);
      if (kIsWeb) {
        _favoriteItems.removeWhere((item) => item.url == surah.url);
        await _saveWebFavorites();
      } else {
        await DatabaseHelper.instance.removeFavorite(itemToRemove.id);
      }
    } else {
      // Add new favorite
      final id = "fav_${surah.url.hashCode}";
      
      final newItem = FavoriteItem(
        id: id,
        type: type ?? 'surah',
        title: surah.name,
        subtitle: subtitle ?? 'Unknown',
        url: surah.url,
        originalId: surah.id.toString(),
      );
      
      if (kIsWeb) {
        _favoriteItems.add(newItem);
        await _saveWebFavorites();
      } else {
        await DatabaseHelper.instance.addFavorite(newItem);
      }
    }
    
    await refreshFavorites();
  }

  Future<void> removeFavoriteById(String id) async {
    if (kIsWeb) {
      _favoriteItems.removeWhere((item) => item.id == id);
      await _saveWebFavorites();
    } else {
      await DatabaseHelper.instance.removeFavorite(id);
    }
    await refreshFavorites();
  }
}
