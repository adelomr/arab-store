import 'dart:io';
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:just_audio/just_audio.dart';
import 'package:audio_session/audio_session.dart';
import 'package:just_audio_background/just_audio_background.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/surah.dart';
import '../models/radio_channel.dart';
import '../models/nasheed.dart';
import '../models/ibtihalat.dart';
import '../models/downloaded_item.dart';
import '../services/download_service.dart';
import '../services/connectivity_service.dart';

class AudioProvider extends ChangeNotifier with WidgetsBindingObserver {
  late final AudioPlayer _player;
  final DownloadService _downloadService = DownloadService();

  // Effects (Android Only)
  AndroidEqualizer? _equalizer;
  AndroidLoudnessEnhancer? _loudnessEnhancer;

  // Settings
  double _volumeBoost = 0.0;
  bool _eqEnabled = false;
  double _volume = 1.0;

  List<Surah> _playlist = [];
  int _currentIndex = -1;
  bool _isPlaying = false;
  Duration _duration = Duration.zero;
  Duration _position = Duration.zero;
  bool _isLoading = false;
  double _playbackSpeed = 1.0;
  String _artistName = "القارئ";

  // Loop State
  Duration? _startLoop;
  Duration? _endLoop;
  bool _isLooping = false;
  String? _errorMessage;
  bool _isNetworkError = false;
  StreamSubscription? _connectivitySubscription;
  final ConnectivityService _connectivityService = ConnectivityService();

  String? _activeParentId;
  String? _activeParentType; // 'reciter', 'speaker', 'nasheed', 'ibtihalat', 'radio'

  bool get isPlaying => _isPlaying;
  bool get isLoading => _isLoading;
  String? get activeParentId => _activeParentId;
  String? get activeParentType => _activeParentType;
  Duration get duration => _duration;
  Duration get position => _position;
  double get playbackSpeed => _playbackSpeed;
  Surah? get currentSurah =>
      _currentIndex != -1 && _currentIndex < _playlist.length
      ? _playlist[_currentIndex]
      : null;

  bool get isLooping => _isLooping && _startLoop != null;
  Duration? get startLoop => _startLoop;
  Duration? get endLoop => _endLoop;
  String? get errorMessage => _errorMessage;
  LoopMode _loopMode = LoopMode.off;
  LoopMode get loopMode => _loopMode;

  // Effects Getters
  bool get eqEnabled => _eqEnabled;
  double get volumeBoost => _volumeBoost;
  double get volume => _volume;
  AndroidEqualizer? get equalizer => _equalizer;
  bool get supportsEffects =>
      !kIsWeb && defaultTargetPlatform == TargetPlatform.android;

  AudioProvider() {
    _initPlayer();
    _init();
    WidgetsBinding.instance.addObserver(this);
  }

  void _initPlayer() {
    if (supportsEffects) {
      _equalizer = AndroidEqualizer();
      _loudnessEnhancer = AndroidLoudnessEnhancer();
      _loudnessEnhancer!.setEnabled(true);

      _player = AudioPlayer(
        audioPipeline: AudioPipeline(
          androidAudioEffects: [_loudnessEnhancer!, _equalizer!],
        ),
      );
    } else {
      _player = AudioPlayer();
    }
  }

  Future<void> _init() async {
    final session = await AudioSession.instance;
    await session.configure(const AudioSessionConfiguration.speech());

    _player.playerStateStream.listen((state) {
      _isPlaying = state.playing;
      if (state.processingState == ProcessingState.completed) {
        // JustAudio handles playlist progression automatically with ConcatenatingAudioSource
        if (_loopMode == LoopMode.one) {
             // Loop mode handled by player
        } else if (_loopMode == LoopMode.all) {
             // Loop mode handled by player
        } else {
             // Auto progression handled by ConcatenatingAudioSource
             if (_currentIndex >= _playlist.length - 1 && !_isLooping) {
               _isPlaying = false;
             }
        }
      }
      notifyListeners();
    });

    // Listen to current item index changes from the player
    _player.currentIndexStream.listen((index) {
      if (index != null) {
        _currentIndex = index;
        notifyListeners();
      }
    });

    _player.playbackEventStream.listen((event) {
      // Normal events
    }, onError: (Object e, StackTrace st) async {
      _isLoading = false;
      bool hasInternet = await _connectivityService.hasGoodConnection();
      
      if (!hasInternet) {
        _isNetworkError = true;
        _errorMessage = "لا يوجد اتصال بالإنترنت. سيتم الاستئناف تلقائياً عند عودة الاتصال.";
      } else if (e is PlayerException) {
        String msg = e.message ?? "";
        if (msg.contains("403")) {
          _errorMessage = "تم رفض الوصول للملف (خطأ 403). قد يكون الرابط منتهياً.";
        } else if (msg.contains("404")) {
          _errorMessage = "الملف غير موجود (خطأ 404). الرابط غير صالح حالياً.";
        } else if (msg.contains("source")) {
          _errorMessage = "خطأ في مصدر الصوت. يرجى محاولة التحديث.";
        } else {
          _errorMessage = "خطأ في المشغل: ${_translateError(msg)}";
        }
      } else if (e is PlayerInterruptedException) {
        _errorMessage = "تم قطع الاتصال بالمشغل";
      } else {
        _errorMessage = "حدث خطأ غير متوقع: ${_translateError(e.toString())}";
      }
      notifyListeners();
    });

    // Listen for connectivity changes
    _connectivitySubscription = _connectivityService.onConnectivityChanged.listen((isOnline) {
      if (isOnline && _isNetworkError) {
        _handleReconnection();
      } else if (!isOnline && _isPlaying) {
        // We can proactively show error if we lose connection while playing remote content
        _checkAndReportNetworkLoss();
      }
    });

    _player.processingStateStream.listen((state) {
      if (state == ProcessingState.ready || state == ProcessingState.idle) {
        _isLoading = false;
        if (state == ProcessingState.ready) {
          _errorMessage = null; // Clear error if we successfully reached ready state
        }
        notifyListeners();
      }
    });

    _player.durationStream.listen((d) {
      _duration = d ?? Duration.zero;
      notifyListeners();
    });

    _player.positionStream.listen((p) {
      _position = p;
      if (_isLooping && _endLoop != null && p >= _endLoop!) {
        if (_startLoop != null) {
          seek(_startLoop!);
        } else {
          seek(Duration.zero);
        }
      }
      notifyListeners();
    });

    // Load Settings
    await _loadSettings();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) async {
    if (state == AppLifecycleState.paused) {
      final prefs = await SharedPreferences.getInstance();
      final backgroundEnabled = prefs.getBool('settings_background_playback') ?? true;
      if (!backgroundEnabled && _isPlaying) {
        pause();
      }
    }
  }

  Future<void> _loadSettings() async {
    if (!supportsEffects) return;

    final prefs = await SharedPreferences.getInstance();

    // Boost
    _volumeBoost = prefs.getDouble('audio_boost') ?? 0.0;
    _setVolumeBoost(_volumeBoost);

    // EQ
    _eqEnabled = prefs.getBool('eq_enabled') ?? false;
    await _equalizer!.setEnabled(_eqEnabled);

    // EQ Bands
    try {
      final bands = await _equalizer!.parameters;
      for (var band in bands.bands) {
        final gain = prefs.getDouble('eq_band_${band.index}');
        if (gain != null) {
          await band.setGain(gain);
        }
      }
    } catch (e) {
      debugPrint("Error loading EQ: $e");
    }

    // Load Speed
    _playbackSpeed = (prefs.getDouble('audio_speed') ?? 1.0).clamp(0.5, 2.5);
    await _player.setSpeed(_playbackSpeed);

    // Load Volume
    _volume = prefs.getDouble('audio_volume') ?? 1.0;
    await _player.setVolume(_volume);

    notifyListeners();
  }

  Future<void> setVolumeBoost(double value) async {
    if (!supportsEffects) return;
    _volumeBoost = value;
    await _setVolumeBoost(value);
    final prefs = await SharedPreferences.getInstance();
    prefs.setDouble('audio_boost', value);
    notifyListeners();
  }

  Future<void> _setVolumeBoost(double value) async {
    if (_loudnessEnhancer != null) {
      // Safe boost range 0 to 3000 mB
      await _loudnessEnhancer!.setTargetGain(value * 2000);
    }
  }

  Future<void> setEqEnabled(bool enabled) async {
    if (!supportsEffects) return;
    _eqEnabled = enabled;
    await _equalizer!.setEnabled(enabled);
    final prefs = await SharedPreferences.getInstance();
    prefs.setBool('eq_enabled', enabled);
    notifyListeners();
  }

  Future<void> setEqBandGain(int bandIndex, double gain) async {
    if (!supportsEffects) return;
    try {
      final bands = await _equalizer!.parameters;
      await bands.bands[bandIndex].setGain(gain);
      final prefs = await SharedPreferences.getInstance();
      prefs.setDouble('eq_band_$bandIndex', gain);
      notifyListeners();
    } catch (e) {
      debugPrint("Error setting EQ band gain: $e");
    }
  }

  Future<void> setSpeed(double speed) async {
    _playbackSpeed = speed;
    await _player.setSpeed(speed);
    final prefs = await SharedPreferences.getInstance();
    prefs.setDouble('audio_speed', speed);
    notifyListeners();
  }

  Future<void> setVolume(double value) async {
    _volume = value;
    await _player.setVolume(value);
    final prefs = await SharedPreferences.getInstance();
    prefs.setDouble('audio_volume', value);
    notifyListeners();
  }

  Future<void> setPlaylist(List<Surah> surahs, int initialIndex, {String? artist, bool forceReload = false}) async {
    if (artist != null) {
      _artistName = artist;
    }

    // Optimization: Check if we are just changing index within the same playlist
    bool isSamePlaylist = listEquals(_playlist, surahs);
    if (!forceReload && isSamePlaylist && _player.audioSource != null) {
      _errorMessage = null; // Clear any previous error messages
      if (_currentIndex != initialIndex) {
         await _player.seek(Duration.zero, index: initialIndex);
      }
      if (!_isPlaying) {
        await _player.play();
      }
      notifyListeners();
      return;
    }

    _isLoading = true;
    _errorMessage = null; // Clear any previous error messages
    _playlist = surahs;
    _currentIndex = initialIndex;
    _clearLoop();
    notifyListeners();

    try {
      // 1. Pre-load downloaded items metadata for bulk checking
      final downloads = await _downloadService.getDownloadedItems();
      final downloadMap = {for (var item in downloads) item.url: item};

      // 2. Build Audio Sources
      List<AudioSource> sources = [];
      for (var surah in surahs) {
        sources.add(await _createAudioSource(surah, downloadMap));
      }

      // 3. Set Source
      final playlistSource = ConcatenatingAudioSource(
        useLazyPreparation: true,
        shuffleOrder: DefaultShuffleOrder(),
        children: sources,
      );

      await _player.setAudioSource(
        playlistSource,
        initialIndex: initialIndex,
        initialPosition: Duration.zero,
      ).timeout(const Duration(seconds: 45)); // Increase timeout for slow connections
      
      await _player.play();

    } catch (e) {
      _errorMessage = "تعذر تحميل القائمة: $e";
      debugPrint("Error loading playlist: $e");
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<AudioSource> _createAudioSource(Surah surah, Map<String, DownloadedItem> downloadMap) async {
    String playUrl = surah.url;
    bool isLocal = surah.url.startsWith('/') || surah.url.startsWith('file:');

    // Check downloads if not already local
    if (!isLocal && downloadMap.containsKey(surah.url)) {
      final item = downloadMap[surah.url]!;
      final localPath = await _downloadService.getFilePath(item.localPath);
      if (await File(localPath).exists()) {
        playUrl = localPath;
        isLocal = true;
      }
    }

    Uri? artUri;
    if (kIsWeb) {
      // On web, assets are served from the root. relative path might work.
      // Or we can leave it null to avoid errors if we can't resolve it easily.
      // Trying relative path 'assets/icon/app_icon.png' hoping it resolves against base.
      artUri = Uri.parse('assets/icon/app_icon.png');
    } else {
      artUri = Uri.parse("asset:///assets/icon/app_icon.png");
    }

    final mediaItem = MediaItem(
      id: surah.url,
      album: "الجامع",
      title: surah.name,
      artist: _artistName,
      artUri: artUri,
    );


    if (isLocal) {
      return AudioSource.uri(
        Uri.file(playUrl),
        tag: mediaItem,
      );
    } else {
      return AudioSource.uri(
        Uri.parse(playUrl),
        tag: mediaItem,
      );
    }
  }

  void setStartMarker(Duration start) {
    _startLoop = start;
    notifyListeners();
  }

  void setEndMarker(Duration end) {
    _endLoop = end;
    _isLooping = true;
    notifyListeners();
    
    final start = _startLoop ?? Duration.zero;
    if (_position < start || _position > end) {
      seek(start);
    }
  }

  void setLoop(Duration start, Duration end) {
    _startLoop = start;
    _endLoop = end;
    _isLooping = true;
    notifyListeners();
    
    if (_position < start || _position > end) {
      seek(start);
    }
  }

  Future<void> toggleLoopMode() async {
    if (_loopMode == LoopMode.off) {
      _loopMode = LoopMode.one;
    } else {
      _loopMode = LoopMode.off;
    }
    await _player.setLoopMode(_loopMode);
    notifyListeners();
  }

  void clearLoop() {
    _clearLoop();
    notifyListeners();
  }

  void _clearLoop() {
    _startLoop = null;
    _endLoop = null;
    _isLooping = false;
  }

  Future<void> playRadio(RadioChannel radio, {List<RadioChannel>? playlist}) async {
    List<Surah> surahList;
    int index = 0;
    
    _artistName = "إذاعة";

    if (playlist != null) {
      surahList = playlist.map((r) => Surah(id: -1, name: r.name, url: r.url)).toList();
      index = playlist.indexOf(radio);
    } else {
      surahList = [Surah(id: -1, name: radio.name, url: radio.url)];
    }
    
    _activeParentId = radio.url; // Use URL for radio
    _activeParentType = 'radio';
    await setPlaylist(surahList, index, artist: "إذاعة");
  }

  Future<void> playSurah(Surah surah, {List<Surah>? playlist}) async {
    List<Surah> surahList;
    int index = 0;

    if (playlist != null) {
      surahList = playlist;
      index = playlist.indexOf(surah);
    } else {
      surahList = [surah];
    }

    _activeParentType = 'reciter';
    // ID comes from the reciter passed in various screens, but here we only have the playlist
    // We'll rely on the specific screen to pass the parent ID if needed, 
    // or infer it if it's already set.
    await setPlaylist(surahList, index);
  }

  Future<void> playReciterSurah(Surah surah, {required List<Surah> playlist, required int reciterId}) async {
    _activeParentId = reciterId.toString();
    _activeParentType = 'reciter';
    await playSurah(surah, playlist: playlist);
  }

  Future<void> playNasheed(Nasheed nasheed, {List<Nasheed>? playlist, String? artist}) async {
    List<Surah> surahList;
    int index = 0;
    
    if (playlist != null) {
      surahList = playlist.map((n) => Surah(id: -1, name: n.title, url: n.url)).toList();
      index = playlist.indexOf(nasheed);
    } else {
      surahList = [Surah(id: -1, name: nasheed.title, url: nasheed.url)];
    }

    await setPlaylist(surahList, index, artist: artist);
    _activeParentType = 'nasheed';
  }

  Future<void> playNasheedArtist(Nasheed nasheed, {required List<Nasheed> playlist, String? artist, required String artistId}) async {
    _activeParentId = artistId;
    _activeParentType = 'nasheed';
    await playNasheed(nasheed, playlist: playlist, artist: artist);
  }

  Future<void> playIbtihalat(Ibtihalat ibtihalat, {List<Ibtihalat>? playlist, String? artist}) async {
    List<Surah> surahList;
    int index = 0;
    
    if (playlist != null) {
      surahList = playlist.map((i) => Surah(id: -1, name: i.title, url: i.url)).toList();
      index = playlist.indexOf(ibtihalat);
    } else {
      surahList = [Surah(id: -1, name: ibtihalat.title, url: ibtihalat.url)];
    }

    await setPlaylist(surahList, index, artist: artist);
    _activeParentType = 'ibtihalat';
  }

  Future<void> playIbtihalatArtist(Ibtihalat ibtihalat, {required List<Ibtihalat> playlist, String? artist, required String artistId}) async {
    _activeParentId = artistId;
    _activeParentType = 'ibtihalat';
    await playIbtihalat(ibtihalat, playlist: playlist, artist: artist);
  }

  Future<void> playSpeech(Surah speech, {List<Surah>? playlist, String? artist, required String speakerId}) async {
    _activeParentId = speakerId;
    _activeParentType = 'speaker';
    await setPlaylist(playlist ?? [speech], playlist?.indexOf(speech) ?? 0, artist: artist);
  }

  Future<void> pause() async {
    await _player.pause();
  }

  Future<void> resume() async {
    await _player.play();
  }

  Future<void> stop() async {
    await _player.stop();
  }

  Future<void> seek(Duration position) async {
    await _player.seek(position);
  }

  Future<void> playNext() async {
    try {
      if (_player.hasNext) {
        await _player.seekToNext();
      } else if (_currentIndex < _playlist.length - 1) {
         await _player.seek(Duration.zero, index: _currentIndex + 1);
      }
      if (!_player.playing) {
        await _player.play();
      }
    } catch (e) {
      debugPrint("AudioProvider: Error in playNext: $e");
    }
  }

  Future<void> playPrevious() async {
    try {
      if (_player.hasPrevious) {
        await _player.seekToPrevious();
      } else if (_currentIndex > 0) {
        await _player.seek(Duration.zero, index: _currentIndex - 1);
      }
      if (!_player.playing) {
        await _player.play();
      }
    } catch (e) {
      debugPrint("AudioProvider: Error in playPrevious: $e");
    }
  }
  
  // Deprecated direct play, use setPlaylist for proper queue management
  Future<void> play() async {
    if (_player.audioSource == null && _playlist.isNotEmpty) {
      await setPlaylist(_playlist, _currentIndex);
    } else {
      await _player.play();
    }
  }

  Future<void> refresh() async {
    if (_playlist.isNotEmpty && _currentIndex != -1) {
      await setPlaylist(_playlist, _currentIndex, forceReload: true);
    }
  }

  Future<void> _handleReconnection() async {
    _isNetworkError = false;
    _errorMessage = null;
    notifyListeners();
    
    try {
      if (_playlist.isNotEmpty && _currentIndex != -1) {
        debugPrint("Reconnecting: Attempting to resume playback...");
        // If it's a stream or we were playing, try to reload/play
        if (_player.processingState == ProcessingState.idle || _player.processingState == ProcessingState.completed) {
           await setPlaylist(_playlist, _currentIndex);
        } else {
           await _player.play();
        }
      }
    } catch (e) {
      debugPrint("Error during reconnection playback: $e");
    }
  }

  Future<void> _checkAndReportNetworkLoss() async {
    // Only report if it's not a local file
    if (_currentIndex != -1 && _currentIndex < _playlist.length) {
      final surah = _playlist[_currentIndex];
      bool isLocal = surah.url.startsWith('/') || surah.url.startsWith('file:');
      if (!isLocal) {
        _isNetworkError = true;
        _errorMessage = "انقطع الاتصال بالإنترنت. سنحاول الاستئناف عند عودة الاتصال.";
        notifyListeners();
      }
    }
  }

  String _translateError(String error) {
    final lowerError = error.toLowerCase();
    if (lowerError.contains("network") || lowerError.contains("connection")) {
      return "خطأ في الشبكة، تحقق من اتصالك.";
    } else if (lowerError.contains("timeout")) {
      return "انتهت مهلة الاتصال، حاول مرة أخرى.";
    } else if (lowerError.contains("not found") || lowerError.contains("404")) {
      return "الملف غير موجود.";
    } else if (lowerError.contains("permission") || lowerError.contains("forbidden") || lowerError.contains("403")) {
      return "لا تتوفر صلاحية للوصول (رابط منتهي أو محمي).";
    } else if (lowerError.contains("decode")) {
      return "خطأ في فك ترميز ملف الصوت.";
    }
    return error; // Return original if no match
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _connectivitySubscription?.cancel();
    _player.dispose();
    super.dispose();
  }
}

