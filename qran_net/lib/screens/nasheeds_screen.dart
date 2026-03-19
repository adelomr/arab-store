import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/audio_provider.dart';
import '../models/nasheed_artist.dart';
import '../services/api_service.dart';
import '../constants/colors.dart';
import '../constants/strings.dart';
import 'nasheed_tracks_screen.dart';
import '../widgets/glass_container.dart';
import 'favorites_screen.dart';


import '../widgets/app_background.dart';
import '../providers/settings_provider.dart';
import '../widgets/ad_banner_widget.dart';
import '../widgets/app_drawer.dart';
import '../widgets/app_list_card.dart';

class NasheedsScreen extends StatefulWidget {
  const NasheedsScreen({super.key});

  @override
  State<NasheedsScreen> createState() => _NasheedsScreenState();
}

class _NasheedsScreenState extends State<NasheedsScreen> {
  final ApiService _apiService = ApiService();
  List<NasheedArtist> _artists = [];
  List<NasheedArtist> _filteredArtists = [];
  bool _isLoading = true;
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadArtists();
  }

  Future<void> _loadArtists() async {
    final artists = await _apiService.fetchNasheedArtists();
    if (mounted) {
      setState(() {
        _artists = artists;
        _filteredArtists = artists;
        _isLoading = false;
      });
    }
  }

  void _filterArtists(String query) {
    setState(() {
      _filteredArtists = _artists
          .where((artist) =>
              artist.name.toLowerCase().contains(query.toLowerCase()))
          .toList();
    });
  }

  @override
  Widget build(BuildContext context) {
    final settings = Provider.of<SettingsProvider>(context);

    return AppBackground(
      child: Scaffold(
        backgroundColor: Colors.transparent,
        appBar: AppBar(
          backgroundColor: Colors.transparent,
          elevation: 0,
          title: const Text(AppStrings.nasheeds),
          centerTitle: true,
          actions: [
            IconButton(
              icon: const Icon(Icons.favorite),
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => FavoritesScreen(typeFilter: 'nasheed'),
                  ),
                );
              },
            ),
          ],
        ),
        body: _isLoading
            ? const Center(
                child: CircularProgressIndicator(color: AppColors.accent),
              )
            : Column(
                children: [
                  Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: GlassContainer(
                      borderRadius: 30,
                      blur: 15,
                      child: TextField(
                        controller: _searchController,
                        style: const TextStyle(color: Colors.white),
                        decoration: InputDecoration(
                          hintText: "بحث عن منشد...",
                          hintStyle: TextStyle(color: Colors.white.withOpacity(0.4)),
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
                        onChanged: _filterArtists,
                      ),
                    ),
                  ),
                  Expanded(
                    child: settings.viewMode == 'grid'
                      ? GridView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 0),
                          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 2,
                            crossAxisSpacing: 12,
                            mainAxisSpacing: 12,
                            childAspectRatio: 0.85,
                          ),
                          itemCount: _filteredArtists.length,
                          itemBuilder: (context, index) {
                            final artist = _filteredArtists[index];
                            return Consumer<AudioProvider>(
                              builder: (context, audioProvider, _) {
                                final isActiveParent = audioProvider.activeParentId == artist.id && 
                                                      audioProvider.activeParentType == 'nasheed';
                                final isCurrentlyPlaying = isActiveParent && audioProvider.isPlaying;

                                return GestureDetector(
                                  onTap: () {
                                    Navigator.push(
                                      context,
                                      MaterialPageRoute(
                                        builder: (context) => NasheedTracksScreen(artist: artist),
                                      ),
                                    );
                                  },
                                  child: GlassContainer(
                                    isActiveGlow: isCurrentlyPlaying,
                                    child: Column(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [
                                        Container(
                                          padding: const EdgeInsets.all(4),
                                          decoration: BoxDecoration(
                                            shape: BoxShape.circle,
                                            border: Border.all(
                                              color: isCurrentlyPlaying 
                                                ? AppColors.accent 
                                                : AppColors.accent.withOpacity(0.5),
                                              width: isCurrentlyPlaying ? 3 : 2,
                                            ),
                                          ),
                                          child: CircleAvatar(
                                            radius: 40,
                                            backgroundColor: Colors.white12,
                                            backgroundImage: artist.imageUrl != null
                                                ? AssetImage(artist.imageUrl!)
                                                : null,
                                            child: artist.imageUrl == null
                                                ? const Icon(
                                                    Icons.person,
                                                    size: 40,
                                                    color: AppColors.accent,
                                                  )
                                                : null,
                                          ),
                                        ),
                                        const SizedBox(height: 12),
                                        Padding(
                                          padding: const EdgeInsets.symmetric(horizontal: 8.0),
                                          child: Text(
                                            artist.name,
                                            textAlign: TextAlign.center,
                                            style: TextStyle(
                                              color: isCurrentlyPlaying ? AppColors.accent : Colors.white,
                                              fontSize: 16,
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
                          itemCount: _filteredArtists.length,
                          itemBuilder: (context, index) {
                            final artist = _filteredArtists[index];
                            return Consumer<AudioProvider>(
                              builder: (context, audioProvider, _) {
                                final isActiveParent = audioProvider.activeParentId == artist.id && 
                                                      audioProvider.activeParentType == 'nasheed';
                                final isCurrentlyPlaying = isActiveParent && audioProvider.isPlaying;

                                return AppListCard(
                                  isActive: isActiveParent,
                                  isActiveGlow: isCurrentlyPlaying,
                                  leading: CircleAvatar(
                                    backgroundColor: Colors.white12,
                                    backgroundImage: artist.imageUrl != null
                                        ? AssetImage(artist.imageUrl!)
                                        : null,
                                    child: artist.imageUrl == null
                                        ? const Icon(Icons.person, color: AppColors.accent)
                                        : null,
                                  ),
                                  title: Text(artist.name),
                                  trailing: const Icon(Icons.arrow_forward_ios, size: 16, color: Colors.white24),
                                  onTap: () {
                                    Navigator.push(
                                      context,
                                      MaterialPageRoute(
                                        builder: (context) => NasheedTracksScreen(artist: artist),
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
              ),
        bottomNavigationBar: const AdBannerWidget(),
      ),
    );
  }
}
