import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/radio_channel.dart';
import '../models/surah.dart';
import '../providers/audio_provider.dart';
import '../providers/favorites_provider.dart';
import '../constants/colors.dart';
import '../screens/player_screen.dart';
import 'app_list_card.dart';
import 'glass_container.dart';

class RadioCard extends StatelessWidget {
  final RadioChannel radio;
  final List<RadioChannel>? playlist;

  const RadioCard({
    super.key,
    required this.radio,
    this.playlist,
  });

  @override
  Widget build(BuildContext context) {
    final audioProvider = Provider.of<AudioProvider>(context);
    final isPlaying = audioProvider.currentSurah?.url == radio.url;
    final isCurrentlyActive = isPlaying && audioProvider.isPlaying;

    return AppListCard(
      isActive: isPlaying,
      isActiveGlow: isCurrentlyActive,
      title: Text(radio.name),
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Consumer<FavoritesProvider>(
            builder: (context, favorites, _) {
              final surahProxy = Surah(
                id: 0, 
                name: radio.name, 
                url: radio.url
              );
              final isFav = favorites.isFavorite(surahProxy);
              return IconButton(
                icon: Icon(
                  isFav ? Icons.favorite : Icons.favorite_border,
                  color: isFav ? Colors.red : AppColors.accent,
                ),
                onPressed: () {
                  favorites.toggleFavorite(
                    surahProxy,
                    type: 'radio',
                    subtitle: "",
                  );
                },
              );
            },
          ),
          IconButton(
            icon: Icon(
              isCurrentlyActive ? Icons.pause_circle_filled : Icons.play_circle_filled,
              color: AppColors.accent,
              size: 32,
            ),
            onPressed: () {
              if (isCurrentlyActive) {
                audioProvider.pause();
              } else if (isPlaying) {
                audioProvider.resume();
              } else {
                audioProvider.playRadio(radio, playlist: playlist);
              }
            },
          ),
        ],
      ),
      onTap: () {
        if (isCurrentlyActive) {
          audioProvider.pause();
        } else if (isPlaying) {
          audioProvider.resume();
        } else {
          audioProvider.playRadio(radio, playlist: playlist);
        }
      },
    );
  }
}
