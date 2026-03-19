import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/nasheed.dart';
import '../models/nasheed_artist.dart';
import '../services/api_service.dart';
import '../providers/audio_provider.dart';
import '../constants/colors.dart';
import './player_screen.dart';
import '../widgets/glass_container.dart';
import '../services/download_service.dart';
import '../models/downloaded_item.dart';
import 'package:percent_indicator/circular_percent_indicator.dart';
import '../providers/favorites_provider.dart';
import 'favorites_screen.dart';
import '../models/surah.dart';
import '../widgets/app_background.dart';


class NasheedTracksScreen extends StatefulWidget {
  final NasheedArtist artist;

  const NasheedTracksScreen({super.key, required this.artist});

  @override
  State<NasheedTracksScreen> createState() => _NasheedTracksScreenState();
}

class _NasheedTracksScreenState extends State<NasheedTracksScreen> {
  final ApiService _apiService = ApiService();
  List<Nasheed> _tracks = [];
  List<Nasheed> _filteredTracks = [];
  bool _isLoading = true;
  final TextEditingController _searchController = TextEditingController();
  final DownloadService _downloadService = DownloadService();
  final Map<String, double> _downloadProgress = {};
  final Map<String, bool> _isDownloaded = {};

  @override
  void initState() {
    super.initState();
    _loadTracks();
  }

  Future<void> _loadTracks() async {
    final tracks = await _apiService.fetchNasheedsByArtist(widget.artist.id);
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
          .where((track) =>
              track.title.toLowerCase().contains(query.toLowerCase()))
          .toList();
    });
  }

  Future<void> _downloadTrack(Nasheed track) async {
    final fileName = "nasheed_${track.title.hashCode}.mp3";
    
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
        category: DownloadCategory.nasheed,
        artistName: widget.artist.name,
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

  void _playAndNavigate(BuildContext context, Nasheed track) {
    final audioProvider = Provider.of<AudioProvider>(context, listen: false);
    audioProvider.playNasheedArtist(
      track, 
      playlist: _filteredTracks,
      artist: widget.artist.name,
      artistId: widget.artist.id,
    );
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => const PlayerScreen()),
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
          title: Text(widget.artist.name),
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
                          hintText: "بحث عن انشودة...",
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
                                                  type: 'nasheed',
                                                  subtitle: widget.artist.name,
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
