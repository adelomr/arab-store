import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class SettingsProvider extends ChangeNotifier {
  static const String _keyPageFlipSound = 'settings_page_flip_sound';
  static const String _keyBackgroundPlayback = 'settings_background_playback';
  static const String _keyBackgroundType = 'settings_background_type';
  static const String _keyViewMode = 'settings_view_mode';
  static const String _keyLowEndDevice = 'settings_low_end_device';

  bool _pageFlipSoundEnabled = true;
  bool _backgroundPlaybackEnabled = true;
  String _backgroundType = 'wood'; // wood, black, green, blue
  String _viewMode = 'grid'; // list, grid
  bool _lowEndDeviceEnabled = false;

  bool get pageFlipSoundEnabled => _pageFlipSoundEnabled;
  bool get backgroundPlaybackEnabled => _backgroundPlaybackEnabled;
  String get backgroundType => _backgroundType;
  String get viewMode => _viewMode;
  bool get lowEndDeviceEnabled => _lowEndDeviceEnabled;

  SettingsProvider() {
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    final prefs = await SharedPreferences.getInstance();
    _pageFlipSoundEnabled = prefs.getBool(_keyPageFlipSound) ?? true;
    _backgroundPlaybackEnabled = prefs.getBool(_keyBackgroundPlayback) ?? true;
    _backgroundType = prefs.getString(_keyBackgroundType) ?? 'wood';
    _viewMode = prefs.getString(_keyViewMode) ?? 'grid';
    _lowEndDeviceEnabled = prefs.getBool(_keyLowEndDevice) ?? false;
    notifyListeners();
  }

  Future<void> setPageFlipSoundEnabled(bool enabled) async {
    _pageFlipSoundEnabled = enabled;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_keyPageFlipSound, enabled);
    notifyListeners();
  }

  Future<void> setBackgroundPlaybackEnabled(bool enabled) async {
    _backgroundPlaybackEnabled = enabled;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_keyBackgroundPlayback, enabled);
    notifyListeners();
  }

  Future<void> setBackgroundType(String type) async {
    _backgroundType = type;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyBackgroundType, type);
    notifyListeners();
  }

  Future<void> setViewMode(String mode) async {
    _viewMode = mode;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyViewMode, mode);
    notifyListeners();
  }

  Future<void> setLowEndDeviceEnabled(bool enabled) async {
    _lowEndDeviceEnabled = enabled;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_keyLowEndDevice, enabled);
    notifyListeners();
  }
}
