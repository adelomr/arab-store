import 'package:flutter/material.dart';
import 'package:just_audio/just_audio.dart';
import 'package:avatar_glow/avatar_glow.dart';
import 'package:provider/provider.dart';
import '../providers/audio_provider.dart';
import '../providers/favorites_provider.dart';
import '../constants/colors.dart';
import '../widgets/loop_button.dart';
import '../widgets/audio_settings_dialog.dart';
import '../providers/settings_provider.dart';


import '../widgets/app_background.dart';

class PlayerScreen extends StatefulWidget {
  const PlayerScreen({super.key});

  @override
  State<PlayerScreen> createState() => _PlayerScreenState();
}

class _PlayerScreenState extends State<PlayerScreen> {
  // Removed animation controller for performance
  
  @override
  void initState() {
    super.initState();
  }

  @override
  void dispose() {
    super.dispose();
  }

  String _formatDuration(Duration duration) {
    String twoDigits(int n) => n.toString().padLeft(2, "0");
    String twoDigitMinutes = twoDigits(duration.inMinutes.remainder(60));
    String twoDigitSeconds = twoDigits(duration.inSeconds.remainder(60));
    return "${twoDigits(duration.inHours)}:$twoDigitMinutes:$twoDigitSeconds";
  }

  void _showSpeedMenu(BuildContext context, AudioProvider audio) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.black,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return SingleChildScrollView(
              child: Container(
                padding: EdgeInsets.only(
                  bottom: MediaQuery.of(context).viewInsets.bottom,
                ),
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 30, horizontal: 20),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text(
                        "تحكم دقيق في السرعة",
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 10),
                      Text(
                        "${audio.playbackSpeed.toStringAsFixed(2)}x",
                        style: const TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          color: AppColors.accent,
                        ),
                      ),
                      Slider(
                        value: audio.playbackSpeed.clamp(0.5, 2.5),
                        min: 0.5,
                        max: 2.5,
                        divisions: 20, // 0.1 steps approx
                        activeColor: AppColors.accent,
                        inactiveColor: Colors.white24,
                        onChanged: (value) {
                          setModalState(() {
                            audio.setSpeed(value);
                          });
                        },
                      ),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: const [
                          Text("بطيء جداً", style: TextStyle(color: Colors.white70)),
                          Text("سريع جداً", style: TextStyle(color: Colors.white70)),
                        ],
                      ),
                      TextButton(
                        onPressed: () {
                          setModalState(() {
                            audio.setSpeed(1.0);
                          });
                        },
                        child: const Text(
                          "إعادة للسرعة الطبيعية",
                          style: TextStyle(color: AppColors.accent),
                        ),
                      ),
                      const SizedBox(height: 10),
                      const SizedBox(height: 20),
                    ],
                  ),
                ),
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return AppBackground(
      child: Scaffold(
        backgroundColor: Colors.transparent,
        appBar: AppBar(
          backgroundColor: Colors.transparent,
          elevation: 0,
          title: const Text("المشغل الصوتي"),
        leading: IconButton(
          icon: const Icon(Icons.keyboard_arrow_down),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.tune),
            onPressed: () {
              showModalBottomSheet(
                context: context,
                backgroundColor: Colors.transparent,
                isScrollControlled: true, // Allow full height if needed
                builder: (context) => const FractionallySizedBox(
                  heightFactor: 0.6,
                  child: AudioSettingsDialog(),
                ),
              );
            },
          ),
        ],
      ),
      body: Consumer<AudioProvider>(
        builder: (context, audio, child) {
          final surah = audio.currentSurah;
          if (surah == null) {
            return const Center(child: Text("لا يوجد مقطع صوتي"));
          }

          return SingleChildScrollView(
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const SizedBox(height: 40),
                  // Placeholder for Album Art / Surah Icon with Pulsing Glow
                  AvatarGlow(
                    glowColor: AppColors.accent,
                    endRadius: 180.0,
                    animate: audio.isPlaying && !context.watch<SettingsProvider>().lowEndDeviceEnabled,
                    duration: const Duration(milliseconds: 3000),
                    repeat: true,
                    curve: Curves.easeInOut,
                    child: Container(
                      width: 250,
                      height: 250,
                      decoration: BoxDecoration(
                        gradient: AppColors.cardGradient,
                        shape: BoxShape.circle,
                        boxShadow: context.watch<SettingsProvider>().lowEndDeviceEnabled ? null : [
                          BoxShadow(
                            color: AppColors.accent.withValues(alpha: 0.2),
                            blurRadius: 20,
                            spreadRadius: 2,
                          ),
                        ],
                      ),
                      child: Padding(
                        padding: const EdgeInsets.all(40.0),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(40),
                          child: Image.asset(
                            'assets/icon/app_icon.png',
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 40),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Expanded(
                        child: Text(
                          surah.name,
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            fontSize: 28,
                            fontWeight: FontWeight.bold,
                            color: AppColors.textPrimary,
                          ),
                        ),
                      ),
                      Consumer<FavoritesProvider>(
                        builder: (context, favorites, _) {
                          final isFav = favorites.isFavorite(surah);
                          return IconButton(
                            icon: Icon(
                              isFav ? Icons.favorite : Icons.favorite_border,
                              color: isFav ? Colors.red : Colors.white70,
                              size: 32,
                            ),
                            onPressed: () {
                              favorites.toggleFavorite(surah);
                            },
                          );
                        },
                      ),
                    ],
                  ),
                  if (audio.errorMessage != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 16.0),
                      child: Column(
                        children: [
                          Text(
                            audio.errorMessage!,
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                              color: Colors.redAccent,
                              fontSize: 14,
                            ),
                          ),
                          const SizedBox(height: 12),
                        ],
                      ),
                    ),

                  const SizedBox(height: 40),
                  // Progress Bar with Loop Highlight
                  SliderTheme(
                    data: SliderTheme.of(context).copyWith(
                      trackHeight: 4.0,
                      thumbShape: const RoundSliderThumbShape(
                        enabledThumbRadius: 8.0,
                      ),
                      overlayShape: const RoundSliderOverlayShape(
                        overlayRadius: 16.0,
                      ),
                    ),
                    child: LayoutBuilder(
                      builder: (context, constraints) {
                        return Stack(
                          alignment: Alignment.center,
                          children: [
                            // Loop Highlight
                            if (audio.startLoop != null &&
                                audio.duration.inMilliseconds > 0)
                              Positioned(
                                left:
                                    (constraints.maxWidth -
                                            32) * // 32 = 16 (padding) * 2 approx adjustment
                                        (audio.startLoop!.inMilliseconds /
                                            audio.duration.inMilliseconds) +
                                    16,
                                width:
                                    (constraints.maxWidth - 32) *
                                    ((audio.endLoop?.inMilliseconds ??
                                            audio.duration.inMilliseconds) -
                                        audio.startLoop!.inMilliseconds) /
                                    audio.duration.inMilliseconds,
                                height: 4.0,
                                child: Container(
                                  decoration: BoxDecoration(
                                    color: AppColors
                                        .accent, // Gold/Highlight color
                                    borderRadius: BorderRadius.circular(2.0),
                                  ),
                                ),
                              ),

                            // The Slider
                            Slider(
                              value: audio.position.inSeconds.toDouble(),
                              min: 0,
                              max: audio.duration.inSeconds.toDouble() > 0
                                  ? audio.duration.inSeconds.toDouble()
                                  : 1,
                              activeColor: AppColors.accent, // Gold for active
                              thumbColor: AppColors.accent,
                              inactiveColor: Colors.white24, // Visible inactive
                              onChanged: (value) {
                                audio.seek(Duration(seconds: value.toInt()));
                              },
                            ),
                          ],
                        );
                      },
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16.0),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          _formatDuration(audio.position),
                          style: const TextStyle(color: Colors.white70),
                        ),
                        Text(
                          _formatDuration(audio.duration),
                          style: const TextStyle(color: Colors.white70),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 40),
                  // Controls
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      IconButton(
                        icon: const Icon(
                          Icons.skip_previous,
                          size: 48,
                          color: AppColors.accent,
                        ),
                        onPressed: () => audio.playPrevious(),
                      ),
                      const SizedBox(width: 20),
                      Container(
                        width: 80,
                        height: 80,
                        decoration: BoxDecoration(
                          gradient: AppColors.cardGradient,
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.primary.withValues(alpha: 0.4),
                              blurRadius: 15,
                              offset: const Offset(0, 8),
                            ),
                          ],
                        ),
                        child: IconButton(
                          iconSize: 48,
                          icon: audio.isLoading
                              ? const SizedBox(
                                  width: 24,
                                  height: 24,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 3,
                                    color: AppColors.accent,
                                  ),
                                )
                              : Icon(
                                  audio.isPlaying ? Icons.pause : Icons.play_arrow,
                                  color: AppColors.accent,
                                ),
                          onPressed: () {
                            if (audio.isPlaying) {
                              audio.pause();
                            } else {
                              audio.play();
                            }
                          },
                        ),
                      ),
                      const SizedBox(width: 20),
                      IconButton(
                        icon: const Icon(
                          Icons.skip_next,
                          size: 48,
                          color: AppColors.accent,
                        ),
                        onPressed: () => audio.playNext(),
                      ),
                    ],
                  ),

                  const SizedBox(height: 20),
                  // Refresh button below main controls
                  IconButton(
                    icon: const Icon(Icons.refresh, color: AppColors.accent, size: 32),
                    tooltip: "تحديث الرابط",
                    onPressed: () {
                      audio.refresh();
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text("جاري تحديث الرابط..."),
                          duration: Duration(seconds: 1),
                        ),
                      );
                    },
                  ),

                  const SizedBox(height: 10),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text(
                        "تحفيظ (تكرار مقطع)",
                        style: TextStyle(color: Colors.grey),
                      ),
                      const SizedBox(width: 8),
                      IconButton(
                        icon: Icon(
                          Icons.repeat,
                          size: 28,
                          color: audio.loopMode == LoopMode.off ? Colors.white38 : AppColors.accent,
                        ),
                        onPressed: () => audio.toggleLoopMode(),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),

                  // Loop Controls
                  Container(
                    margin: const EdgeInsets.symmetric(horizontal: 8),
                    padding: const EdgeInsets.symmetric(
                      vertical: 16,
                      horizontal: 8,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.05),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: Colors.white10),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 8.0),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Expanded(
                            child: LoopButton(
                              label: "بداية (A)",
                              isActive: audio.startLoop != null,
                              onTap: () {
                                if (audio.duration == Duration.zero) return;
                                audio.setStartMarker(audio.position);
                              },
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: LoopButton(
                              label: "نهاية (B)",
                              isActive: audio.endLoop != null,
                              onTap: () {
                                if (audio.duration == Duration.zero) return;
                                if (audio.startLoop != null && audio.position > audio.startLoop!) {
                                  audio.setEndMarker(audio.position);
                                } else if (audio.startLoop == null) {
                                  // Fallback if A wasn't set, just set B
                                  audio.setEndMarker(audio.position);
                                }
                              },
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: LoopButton(
                              label: "استعادة",
                              isActive: audio.isLooping || audio.startLoop != null,
                              onTap: () {
                                if (audio.isLooping || audio.startLoop != null) {
                                  audio.clearLoop();
                                }
                              },
                            ),
                          ),
                        ],
                      ),
                    ),
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
