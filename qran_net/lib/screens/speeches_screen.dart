import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/audio_provider.dart';
import '../models/speaker.dart';
import '../services/api_service.dart';
import '../constants/strings.dart';
import '../constants/colors.dart';
import '../widgets/glass_container.dart';
import 'speech_tracks_screen.dart';
import 'favorites_screen.dart';

import '../widgets/app_background.dart';
import '../providers/settings_provider.dart';
import '../widgets/ad_banner_widget.dart';
import '../widgets/app_drawer.dart';
import '../widgets/app_list_card.dart';

class SpeechesScreen extends StatefulWidget {
  const SpeechesScreen({super.key});

  @override
  State<SpeechesScreen> createState() => _SpeechesScreenState();
}

class _SpeechesScreenState extends State<SpeechesScreen> {
  final ApiService _apiService = ApiService();
  final TextEditingController _searchController = TextEditingController();
  List<Speaker> _speakers = [];
  List<Speaker> _filteredSpeakers = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadSpeakers();
  }

  Future<void> _loadSpeakers() async {
    final speakers = await _apiService.fetchSpeakers();
    if (mounted) {
      setState(() {
        _speakers = speakers;
        _filteredSpeakers = speakers;
        _isLoading = false;
      });
    }
  }

  void _filterSpeakers(String query) {
    setState(() {
      _filteredSpeakers = _speakers
          .where((s) => s.name.contains(query))
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
          title: const Text(AppStrings.speeches),
          centerTitle: true,
          actions: [
            IconButton(
              icon: const Icon(Icons.favorite),
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => FavoritesScreen(typeFilter: 'speech'),
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
                          hintText: "بحث عن شيخ...",
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
                        onChanged: _filterSpeakers,
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
                          itemCount: _filteredSpeakers.length,
                          itemBuilder: (context, index) {
                            final speaker = _filteredSpeakers[index];
                            return Consumer<AudioProvider>(
                              builder: (context, audioProvider, _) {
                                final isActiveParent = audioProvider.activeParentId == speaker.id && 
                                                      audioProvider.activeParentType == 'speaker';
                                final isCurrentlyPlaying = isActiveParent && audioProvider.isPlaying;

                                return GestureDetector(
                                  onTap: () {
                                    Navigator.push(
                                      context,
                                      MaterialPageRoute(
                                        builder: (context) => SpeechTracksScreen(speaker: speaker),
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
                                            backgroundImage: speaker.imageUrl != null
                                                ? AssetImage(speaker.imageUrl!)
                                                : null,
                                            child: speaker.imageUrl == null
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
                                            speaker.name,
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
                          itemCount: _filteredSpeakers.length,
                          itemBuilder: (context, index) {
                            final speaker = _filteredSpeakers[index];
                            return Consumer<AudioProvider>(
                              builder: (context, audioProvider, _) {
                                final isActiveParent = audioProvider.activeParentId == speaker.id && 
                                                      audioProvider.activeParentType == 'speaker';
                                final isCurrentlyPlaying = isActiveParent && audioProvider.isPlaying;

                                return AppListCard(
                                  isActive: isActiveParent,
                                  isActiveGlow: isCurrentlyPlaying,
                                  leading: CircleAvatar(
                                    backgroundColor: Colors.white12,
                                    backgroundImage: speaker.imageUrl != null
                                        ? AssetImage(speaker.imageUrl!)
                                        : null,
                                    child: speaker.imageUrl == null
                                        ? const Icon(Icons.person, color: AppColors.accent)
                                        : null,
                                  ),
                                  title: Text(speaker.name),
                                  trailing: const Icon(Icons.arrow_forward_ios, size: 16, color: Colors.white24),
                                  onTap: () {
                                    Navigator.push(
                                      context,
                                      MaterialPageRoute(
                                        builder: (context) => SpeechTracksScreen(speaker: speaker),
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
