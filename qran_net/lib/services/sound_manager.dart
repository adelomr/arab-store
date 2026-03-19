import 'package:flutter/foundation.dart';
import 'package:audioplayers/audioplayers.dart';

class SoundManager {
  static final SoundManager _instance = SoundManager._internal();
  factory SoundManager() => _instance;
  SoundManager._internal();

  final AudioPlayer _pageFlipPlayer = AudioPlayer();

  /// Plays the page flip sound. 
  /// Uses [PlayerMode.lowLatency] which is optimized for short sound effects.
  Future<void> playPageFlipSound({bool enabled = true}) async {
    if (!enabled) return;
    try {
      // "stop" ensures if the user flips very quickly, it re-triggers cleanly 
      // though "play" usually handles overlap or restart depending on platform.
      // For simple UI sounds, just calling play is often enough, but stop() is safer for single-instance player.
      await _pageFlipPlayer.stop();
      
      // Use lowLatency mode for UI sounds
      await _pageFlipPlayer.play(
        AssetSource('sounds/page_flip.mp3'),
        mode: PlayerMode.lowLatency,
      );
    } catch (e) {
      debugPrint("SoundManager: Error playing sound: $e");
    }
  }

  void dispose() {
    _pageFlipPlayer.dispose();
  }
}
