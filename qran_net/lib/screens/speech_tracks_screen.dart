import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/speaker.dart';
import '../models/speech.dart';
import '../models/surah.dart';
import '../services/api_service.dart';
import '../providers/audio_provider.dart';
import '../constants/colors.dart';
import '../widgets/glass_container.dart';
import '../services/download_service.dart';
import '../models/downloaded_item.dart';
import 'package:percent_indicator/circular_percent_indicator.dart';
import 'player_screen.dart';
import '../providers/favorites_provider.dart';
import 'favorites_screen.dart';
import '../widgets/app_background.dart';

class SpeechTracksScreen extends StatefulWidget {
  final Speaker speaker;

  const SpeechTracksScreen({super.key, required this.speaker});

  @override
  State<SpeechTracksScreen> createState() => _SpeechTracksScreenState();
}

class _SpeechTracksScreenState extends State<SpeechTracksScreen> {
  final ApiService _apiService = ApiService();
  final TextEditingController _searchController = TextEditingController();
  List<Speech> _tracks = [];
  List<Speech> _filteredTracks = [];
  bool _isLoading = true;
  final DownloadService _downloadService = DownloadService();
  final Map<String, double> _downloadProgress = {};
  final Map<String, bool> _isDownloaded = {};

  @override
  void initState() {
    super.initState();
    _loadTracks();
  }

  Future<void> _loadTracks() async {
    final tracks = await _apiService.fetchSpeechesBySpeaker(widget.speaker.id);
    if (mounted) {
      setState(() {
        _tracks = tracks;
        _filteredTracks = tracks;
        _isLoading = false;
      });
      _checkDownloads();
    }
  }

  void _checkDownloads() async {
    final downloads = await _downloadService.getDownloadedItems();
    final Map<String, bool> downloadedMap = {};
    for (var track in _tracks) {
      if (downloads.any((item) => item.url == track.url)) {
        downloadedMap[track.title] = true;
      }
    }
    if (mounted) {
      setState(() {
        _isDownloaded.addAll(downloadedMap);
      });
    }
  }

  void _filterTracks(String query) {
    setState(() {
      _filteredTracks = _tracks
          .where((t) => t.title.contains(query))
          .toList();
    });
  }

  void _playAndNavigate(BuildContext context, Speech track) {
    final audioProvider = Provider.of<AudioProvider>(context, listen: false);
    
    // Map all filtered tracks to Surah for the playlist
    final playlist = _filteredTracks.map((t) => Surah(
      id: 0,
      name: t.title,
      url: t.url,
    )).toList();

    audioProvider.playSpeech(
      Surah(id: 0, name: track.title, url: track.url),
      playlist: playlist,
      artist: widget.speaker.name,
      speakerId: widget.speaker.id,
    );
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => const PlayerScreen()),
    );
  }

  Future<void> _downloadTrack(Speech track) async {
    final fileName = "speech_${track.title.hashCode}.mp3";

    setState(() {
      _downloadProgress[track.title] = 0.001;
    });

    try {
      await _downloadService.downloadFile(
        track.url,
        fileName,
        (progress) {
          if (mounted) {
            setState(() {
              _downloadProgress[track.title] = progress;
            });
          }
        },
        title: track.title,
        category: DownloadCategory.speech,
        artistName: widget.speaker.name,
        id: track.url,
      );

      if (mounted) {
        setState(() {
          _downloadProgress.remove(track.title);
          _isDownloaded[track.title] = true;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("تم تحميل ${track.title} بنجاح")),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _downloadProgress.remove(track.title);
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("فشل التحميل")),
        );
      }
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
          title: Text(widget.speaker.name),
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
            IconButton(
              icon: const Icon(Icons.refresh),
              onPressed: () {
                _loadTracks();
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text("جاري تحديث القائمة..."), duration: Duration(seconds: 1)),
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
                          hintText: "بحث عن خطبة...",
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
                        onChanged: (val) {
                          _filterTracks(val);
                        },
                      ),
                    ),
                  ),
                  Expanded(
                    child: ListView.builder(
                      itemCount: _filteredTracks.length,
                      itemBuilder: (context, index) {
                        return Consumer<AudioProvider>(
                          builder: (context, audioProvider, child) {
                            final track = _filteredTracks[index];
                            final isPlaying = audioProvider.currentSurah?.url == track.url;
                            final isCurrentlyActive = isPlaying && audioProvider.isPlaying;

                            return Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                              child: GlassContainer(
                                padding: const EdgeInsets.symmetric(vertical: 4),
                                isActiveGlow: isCurrentlyActive,
                                border: isPlaying
                                      ? Border.all(color: AppColors.accent, width: 2)
                                      : null,
                                  child: ListTile(
                                    title: Text(
                                      track.title,
                                      style: TextStyle(
                                        color: isPlaying ? AppColors.accent : Colors.white,
                                        fontWeight: isPlaying ? FontWeight.bold : FontWeight.normal,
                                        fontSize: 14.0,
                                      ),
                                    ),
                                    trailing: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Consumer<FavoritesProvider>(
                                          builder: (context, favorites, _) {
                                            final surahProxy = Surah(
                                              id: 0, 
                                              name: track.title, 
                                              url: track.url
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
                                                  type: 'speech',
                                                  subtitle: widget.speaker.name,
                                                );
                                              },
                                            );
                                          },
                                        ),
                                        if (_downloadProgress.containsKey(track.title))
                                          CircularPercentIndicator(
                                            radius: 12.0,
                                            lineWidth: 2.5,
                                            percent: _downloadProgress[track.title]!,
                                            progressColor: AppColors.accent,
                                          )
                                        else
                                          IconButton(
                                            icon: Icon(
                                              Icons.download_rounded,
                                              color: _isDownloaded[track.title] == true
                                                  ? AppColors.accent.withValues(alpha: 0.3)
                                                  : AppColors.accent,
                                            ),
                                            onPressed: () {
                                              _downloadTrack(track);
                                            },
                                          ),
                                        isCurrentlyActive
                                            ? const Icon(
                                                Icons.graphic_eq, 
                                                color: AppColors.accent,
                                                size: 36,
                                              )
                                            : IconButton(
                                                icon: Icon(
                                                  isPlaying ? Icons.pause_circle_filled : Icons.play_circle_filled,
                                                  color: AppColors.accent,
                                                  size: 36,
                                                ),
                                                onPressed: () {
                                                  if (isPlaying) {
                                                     Navigator.push(
                                                      context,
                                                      MaterialPageRoute(builder: (_) => const PlayerScreen()),
                                                    );
                                                  } else {
                                                      _playAndNavigate(context, track);
                                                  }
                                                },
                                              ),
                                      ],
                                    ),
                                    onTap: () {
                                      if (isPlaying) {
                                          Navigator.push(
                                            context,
                                            MaterialPageRoute(builder: (_) => const PlayerScreen()),
                                          );
                                      } else {
                                           _playAndNavigate(context, track);
                                      }
                                    },
                                  ),
                                ),
                              );
                            },
                          );
                      },
                    ),
                  ),
                ],
              ),
      ),
    );
  }
}
