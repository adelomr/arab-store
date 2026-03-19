import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:just_audio/just_audio.dart';
import '../providers/audio_provider.dart';
import '../constants/colors.dart';

class AudioSettingsDialog extends StatefulWidget {
  const AudioSettingsDialog({super.key});

  @override
  State<AudioSettingsDialog> createState() => _AudioSettingsDialogState();
}

class _AudioSettingsDialogState extends State<AudioSettingsDialog> {
  @override
  Widget build(BuildContext context) {
    // Using a Container with a solid semi-transparent background for better visibility
    // instead of the faint GlassContainer
    return Container(
      decoration: BoxDecoration(
        color: AppColors.background.withValues(alpha: 0.95), // Dark opaque background
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        border: Border.all(color: Colors.white10),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.5),
            blurRadius: 20,
            spreadRadius: 5,
          ),
        ],
      ),
      padding: const EdgeInsets.all(24.0),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Container(
              width: 40,
              height: 4,
              margin: const EdgeInsets.only(bottom: 20),
              decoration: BoxDecoration(
                color: Colors.white24,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                "إعدادات الصوت",
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
              IconButton(
                icon: const Icon(Icons.close, color: Colors.white),
                onPressed: () => Navigator.pop(context),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Consumer<AudioProvider>(
            builder: (context, audio, child) {
              return Expanded(
                child: ListView(
                  children: [
                    const Divider(color: Colors.white10),
                    // Playback Speed
                    const Padding(
                      padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      child: Text(
                        "سرعة التشغيل",
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                          fontSize: 16,
                        ),
                      ),
                    ),
                    Row(
                      children: [
                        const SizedBox(width: 16),
                        Text(
                          "${audio.playbackSpeed.toStringAsFixed(2)}x",
                          style: const TextStyle(color: AppColors.accent, fontWeight: FontWeight.bold),
                        ),
                        Expanded(
                          child: SliderTheme(
                            data: SliderTheme.of(context).copyWith(
                              trackHeight: 4.0,
                              thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 10.0),
                              activeTrackColor: AppColors.accent,
                              thumbColor: AppColors.accent,
                            ),
                            child: Slider(
                              value: audio.playbackSpeed.clamp(0.5, 2.5),
                              min: 0.5,
                              max: 2.5,
                              divisions: 20,
                              onChanged: (value) {
                                audio.setSpeed(value);
                              },
                            ),
                          ),
                        ),
                      ],
                    ),
                    const Divider(color: Colors.white10),
                    // General Volume

                    if (!audio.supportsEffects)
                      const Padding(
                        padding: EdgeInsets.symmetric(vertical: 20),
                        child: Center(
                          child: Text(
                            "المؤثرات (Equalizer) مدعومة فقط على أندرويد",
                            style: TextStyle(color: Colors.white70),
                          ),
                        ),
                      ),
                    
                    if (audio.supportsEffects) ...[
                      // Enable/Disable
                      SwitchListTile(
                        title: const Text(
                          "تفعيل المؤثرات (Equalizer)",
                          style: TextStyle(color: Colors.white),
                        ),
                        value: audio.eqEnabled,
                        activeThumbColor: AppColors.accent,
                        onChanged: (value) {
                          audio.setEqEnabled(value);
                        },
                      ),
                      const Text(
                        "المعادل الصوتي (Equalizer)",
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                          fontSize: 16,
                        ),
                      ),
                      const SizedBox(height: 15),
                      if (audio.equalizer != null)
                        FutureBuilder<AndroidEqualizerParameters?>(
                          future: audio.equalizer!.parameters,
                          builder: (context, snapshot) {
                            if (!snapshot.hasData) return const SizedBox();
                            final params = snapshot.data!;
                            return Column(
                              children: params.bands.map((band) {
                                return StreamBuilder<double>(
                                  stream: band.gainStream,
                                  builder: (context, snapshot) {
                                    final gain = snapshot.data ?? 0.0;
                                    return Row(
                                      children: [
                                        SizedBox(width: 50, child: Text("${band.centerFrequency ~/ 1000}Hz", style: const TextStyle(fontSize: 12, color: Colors.white70))),
                                        Expanded(
                                          child: SliderTheme(
                                            data: SliderTheme.of(context).copyWith(trackHeight: 4.0, activeTrackColor: AppColors.accent, thumbColor: AppColors.accent),
                                            child: Slider(
                                              value: gain,
                                              min: params.minDecibels,
                                              max: params.maxDecibels,
                                              onChanged: audio.eqEnabled ? (value) {
                                                band.setGain(value);
                                                audio.setEqBandGain(band.index, value);
                                              } : null,
                                            ),
                                          ),
                                        ),
                                        SizedBox(width: 45, child: Text("${gain.toInt()}dB", textAlign: TextAlign.end, style: const TextStyle(fontSize: 12, color: Colors.white70))),
                                      ],
                                    );
                                  },
                                );
                              }).toList(),
                            );
                          },
                        ),
                    ],
                  ],
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}
