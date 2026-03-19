import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/main_provider.dart';
import '../providers/audio_provider.dart';
import '../constants/strings.dart';
import '../constants/colors.dart';
import 'surahs_screen.dart';
import 'favorites_screen.dart';
import '../widgets/app_list_card.dart';
import '../widgets/ad_banner_widget.dart';
import '../widgets/app_drawer.dart';
import '../widgets/glass_container.dart';

import '../widgets/app_background.dart';
import '../providers/settings_provider.dart';
import '../providers/download_provider.dart';

class RecitersScreen extends StatefulWidget {
  final bool isMujawwad;
  const RecitersScreen({super.key, this.isMujawwad = false});

  @override
  State<RecitersScreen> createState() => _RecitersScreenState();
}

class _RecitersScreenState extends State<RecitersScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(
      () => Provider.of<MainProvider>(
        context,
        listen: false,
      ).fetchRecitersState(isMujawwad: widget.isMujawwad),
    );
  }

  @override
  Widget build(BuildContext context) {
    final settings = Provider.of<SettingsProvider>(context);
    
    return AppBackground(
      child: Scaffold(
        backgroundColor: Colors.transparent,
        appBar: AppBar(
          title: Text(widget.isMujawwad
              ? AppStrings.quranMujawwad
              : AppStrings.quranMurattal),
          centerTitle: true,
          actions: [
            IconButton(
              icon: const Icon(Icons.favorite),
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => FavoritesScreen(typeFilter: 'surah'),
                  ),
                );
              },
            ),
          ],
        ),
        body: Consumer<MainProvider>(
          builder: (context, provider, child) {
            return Column(
              children: [
                // Search Box - Always shown
                Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: GlassContainer(
                    borderRadius: 30,
                    blur: 15,
                    child: TextField(
                      style: const TextStyle(color: Colors.white),
                      decoration: InputDecoration(
                        hintText: AppStrings.searchReciter,
                        hintStyle: TextStyle(color: Colors.white.withValues(alpha: 0.4)),
                        prefixIcon: const Icon(
                          Icons.search,
                          color: AppColors.accent,
                        ),
                        border: InputBorder.none,
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 20,
                          vertical: 15,
                        ),
                      ),
                      onChanged: (value) => provider.searchReciter(value),
                    ),
                  ),
                ),

              // Results or Loading or Empty
              Expanded(
                child: provider.isLoading
                    ? const Center(child: CircularProgressIndicator())
                    : provider.reciters.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Text(
                                  AppStrings.noInternet,
                                  style: TextStyle(color: Colors.white70),
                                ),
                                const SizedBox(height: 16),
                                ElevatedButton.icon(
                                  onPressed: () => provider.fetchRecitersState(isMujawwad: widget.isMujawwad),
                                  icon: const Icon(Icons.refresh),
                                  label: const Text(AppStrings.retry),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: AppColors.accent.withValues(alpha: 0.2),
                                    foregroundColor: AppColors.accent,
                                    side: const BorderSide(color: AppColors.accent),
                                  ),
                                ),
                              ],
                            ),
                          )
                        : settings.viewMode == 'grid' 
                          ? GridView.builder(
                              padding: const EdgeInsets.symmetric(horizontal: 16),
                              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                                crossAxisCount: 2,
                                crossAxisSpacing: 12,
                                mainAxisSpacing: 12,
                                childAspectRatio: 0.9,
                              ),
                              itemCount: provider.reciters.length,
                              itemBuilder: (context, index) {
                                final reciter = provider.reciters[index];
                                return Consumer<AudioProvider>(
                                  builder: (context, audioProvider, _) {
                                    final isActiveParent = audioProvider.activeParentId == reciter.id.toString() && 
                                                          audioProvider.activeParentType == 'reciter';
                                    final isCurrentlyPlaying = isActiveParent && audioProvider.isPlaying;

                                    return GestureDetector(
                                      onTap: () {
                                        Navigator.push(
                                          context,
                                          MaterialPageRoute(
                                            builder: (_) => SurahsScreen(reciter: reciter),
                                          ),
                                        );
                                      },
                                      child: GlassContainer(
                                        isActiveGlow: isCurrentlyPlaying,
                                        child: Column(
                                          mainAxisAlignment: MainAxisAlignment.center,
                                          children: [
                                            CircleAvatar(
                                              radius: 35,
                                              backgroundColor: isActiveParent ? AppColors.accent.withAlpha(50) : Colors.white12,
                                              child: Text(
                                                reciter.letter.isNotEmpty ? reciter.letter : "?",
                                                style: TextStyle(
                                                  color: isActiveParent ? AppColors.accent : Colors.white,
                                                  fontWeight: FontWeight.bold,
                                                  fontSize: 24,
                                                ),
                                              ),
                                            ),
                                            const SizedBox(height: 12),
                                            Padding(
                                              padding: const EdgeInsets.symmetric(horizontal: 8.0),
                                              child: Text(
                                                reciter.name,
                                                textAlign: TextAlign.center,
                                                maxLines: 2,
                                                overflow: TextOverflow.ellipsis,
                                                style: TextStyle(
                                                  color: isActiveParent ? AppColors.accent : Colors.white,
                                                  fontSize: 14,
                                                  fontWeight: FontWeight.bold,
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    );
                                  },
                                );
                              },
                            )
                          : ListView.builder(
                              itemCount: provider.reciters.length,
                              itemBuilder: (context, index) {
                                  final reciter = provider.reciters[index];
                                  return Consumer<AudioProvider>(
                                    builder: (context, audioProvider, _) {
                                      final isActiveParent = audioProvider.activeParentId == reciter.id.toString() && 
                                                            audioProvider.activeParentType == 'reciter';
                                      final isCurrentlyPlaying = isActiveParent && audioProvider.isPlaying;

                                      return AppListCard(
                                        isActive: isActiveParent,
                                        isActiveGlow: isCurrentlyPlaying,
                                        leading: CircleAvatar(
                                          backgroundColor: isActiveParent ? AppColors.accent.withAlpha(50) : Colors.white24,
                                          child: Text(
                                            reciter.letter.isNotEmpty ? reciter.letter : "?",
                                            style: TextStyle(
                                              color: isActiveParent ? AppColors.accent : Colors.white,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                        ),
                                        title: Text(reciter.name),
                                        trailing: Icon(
                                          Icons.arrow_forward_ios,
                                          size: 16,
                                          color: isActiveParent ? AppColors.accent : AppColors.accent.withAlpha(128),
                                        ),
                                        onTap: () {
                                          Navigator.push(
                                            context,
                                            MaterialPageRoute(
                                              builder: (_) => SurahsScreen(reciter: reciter),
                                            ),
                                          );
                                        },
                                      );
                                    },
                                  );
                              },
                            ),
              ),
            ],
          );
          },
        ),
        bottomNavigationBar: const AdBannerWidget(),
      ),
    );
  }
}
