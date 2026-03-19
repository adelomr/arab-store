import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/favorite_item.dart';
import '../models/surah.dart';
import '../widgets/app_list_card.dart';
import '../widgets/ad_banner_widget.dart';
import '../constants/colors.dart';
import '../providers/audio_provider.dart';
import '../providers/favorites_provider.dart'; // Added import
import 'player_screen.dart';
import '../widgets/app_background.dart';
import '../widgets/glass_container.dart';

class FavoritesScreen extends StatelessWidget {
  final String? typeFilter;
  const FavoritesScreen({super.key, this.typeFilter});

  void _playFavorite(BuildContext context, List<FavoriteItem> favorites, int index, {bool autoNavigate = true}) {
    // Convert Favorites to Surahs for the player
    List<Surah> playlist = favorites.map((f) => Surah(
      id: int.tryParse(f.originalId) ?? -1, // Fallback for non-integer IDs
      name: f.title,
      url: f.url,
    )).toList();

    final audioProvider = Provider.of<AudioProvider>(context, listen: false);
    audioProvider.setPlaylist(playlist, index);
    
    if (autoNavigate) {
      Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => const PlayerScreen()),
      );
    }
  }

  String _getTitle() {
    switch (typeFilter) {
      case 'surah':
        return "التلاوات المفضلة";
      case 'speech':
        return "الخطب المفضلة";
      case 'nasheed':
        return "الأناشيد المفضلة";
      case 'ibtihalat':
        return "الابتهالات المفضلة";
      case 'radio':
        return "الإذاعات المفضلة";
      default:
        return "المفضلة";
    }
  }

  @override
  Widget build(BuildContext context) {
    return AppBackground(
      child: Scaffold(
        backgroundColor: Colors.transparent,
        appBar: AppBar(
          backgroundColor: Colors.transparent,
          elevation: 0,
          title: Text(_getTitle()),
        ),
        body: Consumer<FavoritesProvider>(
          builder: (context, favProvider, child) {
            final allFavorites = favProvider.favoriteItems;
            final favorites = typeFilter == null 
                ? allFavorites 
                : allFavorites.where((item) => item.type == typeFilter).toList();
            
            if (favorites.isEmpty) {
              return Center(
                child: Text(
                  allFavorites.isEmpty ? "لا توجد عناصر في المفضلة" : "لا توجد عناصر في هذا القسم",
                  style: const TextStyle(color: Colors.white, fontSize: 18),
                ),
              );
            }

            return ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: favorites.length,
              itemBuilder: (context, index) {
                final item = favorites[index];
                return Consumer<AudioProvider>(
                  builder: (context, audioProvider, child) {
                    final isPlaying = audioProvider.currentSurah?.url == item.url;
                    final isCurrentlyActive = isPlaying && audioProvider.isPlaying;

                    return AppListCard(
                      isActive: isPlaying,
                      isActiveGlow: isCurrentlyActive,
                      leading: CircleAvatar(
                          backgroundColor: isPlaying ? AppColors.accent.withAlpha(50) : Colors.white24,
                          child: Icon(
                            item.type == 'surah' ? Icons.book : 
                            item.type == 'nasheed' ? Icons.music_note : 
                            item.type == 'ibtihalat' ? Icons.auto_awesome : 
                            item.type == 'speech' ? Icons.mic_external_on : Icons.radio,
                            color: isPlaying ? AppColors.accent : Colors.white,
                            size: 20,
                          ),
                        ),
                        title: Text(item.title),
                        subtitle: Text(item.subtitle),
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            IconButton(
                              icon: const Icon(Icons.delete, color: Colors.redAccent, size: 20),
                              onPressed: () {
                                favProvider.removeFavoriteById(item.id);
                              },
                            ),
                            isCurrentlyActive
                              ? IconButton(
                                  icon: const Icon(
                                    Icons.pause_circle_filled,
                                    color: AppColors.accent,
                                    size: 32,
                                  ),
                                  onPressed: () {
                                    audioProvider.pause();
                                  },
                                )
                              : IconButton(
                                  icon: Icon(
                                    isPlaying ? Icons.play_circle_fill : Icons.play_circle_fill,
                                    color: AppColors.accent,
                                    size: 32,
                                  ),
                                  onPressed: () {
                                    if (isPlaying) {
                                      audioProvider.resume();
                                    } else {
                                      _playFavorite(context, favorites, index, autoNavigate: item.type != 'radio');
                                    }
                                  },
                                ),
                          ],
                        ),
                        onTap: () {
                          if (item.type == 'radio') {
                            if (isCurrentlyActive) {
                              audioProvider.pause();
                            } else if (isPlaying) {
                              audioProvider.resume();
                            } else {
                              _playFavorite(context, favorites, index, autoNavigate: false);
                            }
                          } else {
                            if (isPlaying) {
                              Navigator.push(
                                context,
                                MaterialPageRoute(builder: (_) => const PlayerScreen()),
                              );
                            }
                          }
                        },
                      );
                    },
                  );
                },
              );
            },
          ),
        bottomNavigationBar: const AdBannerWidget(),
      ),
    );
  }
}
