import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:provider/provider.dart';
import 'package:percent_indicator/circular_percent_indicator.dart';
import '../models/reciter.dart';
import '../models/surah.dart';
import '../providers/main_provider.dart';
import '../providers/audio_provider.dart';
import '../services/download_service.dart';
import '../constants/colors.dart';
import 'player_screen.dart';
import '../widgets/app_background.dart';
import '../widgets/ad_banner_widget.dart';
import '../widgets/app_list_card.dart';
import '../widgets/glass_container.dart';
import '../models/downloaded_item.dart';
import '../providers/favorites_provider.dart';
import '../providers/download_provider.dart';
import 'favorites_screen.dart';
import '../widgets/app_background.dart';

class SurahsScreen extends StatefulWidget {
  final Reciter reciter;

  const SurahsScreen({super.key, required this.reciter});

  @override
  State<SurahsScreen> createState() => _SurahsScreenState();
}

class _SurahsScreenState extends State<SurahsScreen> {
  final DownloadService _downloadService = DownloadService();
  final TextEditingController _searchController = TextEditingController();
  final Map<int, double> _downloadProgress = {};
  Map<int, bool> _isDownloaded = {};
  List<Surah> _allSurahs = [];
  List<Surah> _filteredSurahs = [];

  @override
  void initState() {
    super.initState();
    _loadSurahs();
    _checkDownloads();
  }

  void _loadSurahs() {
    final moshaf = widget.reciter.moshafs.isNotEmpty
        ? widget.reciter.moshafs.first
        : null;
    if (moshaf != null) {
      _allSurahs = Provider.of<MainProvider>(context, listen: false).getSurahs(moshaf);
      _filteredSurahs = _allSurahs;
    }
  }

  void _filterSurahs(String query) {
    setState(() {
      _filteredSurahs = _allSurahs
          .where((s) => s.name.contains(query) || s.id.toString().contains(query))
          .toList();
    });
  }

  void _checkDownloads() async {
    final downloads = await _downloadService.getDownloadedItems();
    final Map<int, bool> downloadedMap = {};
    
    for (var surah in _allSurahs) {
      final fileName = _getFileName(surah.id);
      if (downloads.any((item) => item.localPath == fileName)) {
        downloadedMap[surah.id] = true;
      }
    }

    if (mounted) {
      setState(() {
        _isDownloaded = downloadedMap;
      });
    }
  }

  Future<void> _toggleFavorite(Surah surah) async {
    final favoritesProvider = Provider.of<FavoritesProvider>(context, listen: false);
    await favoritesProvider.toggleFavorite(surah, subtitle: widget.reciter.name);
  }

  String _getFileName(int surahId) {
    return "${widget.reciter.id}_$surahId.mp3";
  }

  Future<void> _downloadSurah(Surah surah) async {
    final fileName = _getFileName(surah.id);
    if (await _downloadService.isFileExists(fileName)) return;

    setState(() {
      _downloadProgress[surah.id] = 0.001; // Start progress
    });

    try {
      await _downloadService.downloadFile(
        surah.url,
        fileName,
        (progress) {
          if (mounted) {
            setState(() {
              _downloadProgress[surah.id] = progress;
            });
          }
        },
        title: surah.name,
        category: DownloadCategory.quran,
        artistName: widget.reciter.name,
        id: fileName,
      );
      if (mounted) {
        setState(() {
          _downloadProgress.remove(surah.id);
          _isDownloaded[surah.id] = true;
        });
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('تم تحميل ${surah.name} بنجاح')));
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _downloadProgress.remove(surah.id);
        });
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('فشل التحميل')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final moshaf = widget.reciter.moshafs.isNotEmpty
        ? widget.reciter.moshafs.first
        : null;

    if (moshaf == null) {
      return Scaffold(
        appBar: AppBar(title: Text(widget.reciter.name)),
        body: const Center(child: Text("لا توجد تلاوات متاحة")),
      );
    }

    // Ensure surahs are pre-cached if needed, though they are likely already loaded
    Provider.of<MainProvider>(context, listen: false).getSurahs(moshaf);

    return AppBackground(
      child: Scaffold(
        backgroundColor: Colors.transparent,
        appBar: AppBar(
          backgroundColor: Colors.transparent,
          elevation: 0,
          title: Text(widget.reciter.name),
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
            IconButton(
              icon: const Icon(Icons.refresh),
              onPressed: () {
                _loadSurahs();
                _checkDownloads();
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text("جاري تحديث القائمة..."), duration: Duration(seconds: 1)),
                );
              },
            ),
            Consumer<DownloadProvider>(
              builder: (context, downloadProvider, _) {
                final isDownloading = downloadProvider.isDownloading(widget.reciter.id.toString());
                final progress = downloadProvider.getBatchProgress(widget.reciter.id.toString());

                if (isDownloading) {
                  return Center(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16.0),
                      child: SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          value: progress,
                          strokeWidth: 2,
                          color: AppColors.accent,
                        ),
                      ),
                    ),
                  );
                }

                return IconButton(
                  icon: const Icon(Icons.download_for_offline),
                  onPressed: () {
                    final moshaf = widget.reciter.moshafs.isNotEmpty ? widget.reciter.moshafs.first : null;
                    if (moshaf != null) {
                      final surahs = Provider.of<MainProvider>(context, listen: false).getSurahs(moshaf);
                      downloadProvider.downloadReciterBatch(widget.reciter, surahs);
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text("بدأ تحميل مصحف ${widget.reciter.name}...")),
                      );
                    }
                  },
                );
              },
            ),
          ],
        ),
        body: Column(
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
                    hintText: "بحث عن سورة...",
                    hintStyle: TextStyle(color: Colors.white.withAlpha(128)),
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
                    _filterSurahs(val);
                  },
                ),
              ),
            ),
            Expanded(
              child: ListView.builder(
                itemCount: _filteredSurahs.length,
                itemBuilder: (context, index) {
                  final surah = _filteredSurahs[index];
                  return Consumer<AudioProvider>(
                    builder: (context, audioProvider, child) {
                      final isPlaying = audioProvider.currentSurah?.url == surah.url;
                      final isCurrentlyActive = isPlaying && audioProvider.isPlaying;

                      return AppListCard(
                        isActive: isPlaying,
                        isActiveGlow: isCurrentlyActive,
                        leading: CircleAvatar(
                          backgroundColor: isPlaying ? AppColors.accent.withAlpha(50) : Colors.white24,
                          child: Text(
                            "${surah.id}",
                            style: TextStyle(
                              color: isPlaying ? AppColors.accent : Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                        title: Text(surah.name),
                        trailing: SizedBox(
                          width: 150,
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.end,
                            children: [
                              Consumer<FavoritesProvider>(
                                builder: (context, favorites, _) {
                                  final isFav = favorites.isFavorite(surah);
                                  return IconButton(
                                    visualDensity: VisualDensity.compact,
                                    icon: Icon(
                                      isFav ? Icons.favorite : Icons.favorite_border,
                                      color: isFav
                                          ? Colors.red
                                          : (isPlaying ? AppColors.accent : AppColors.accent.withAlpha(128)),
                                      size: 24,
                                    ),
                                    onPressed: () => _toggleFavorite(surah),
                                  );
                                },
                              ),
                              if (_downloadProgress.containsKey(surah.id))
                                CircularPercentIndicator(
                                  radius: 12.0,
                                  lineWidth: 2.5,
                                  percent: _downloadProgress[surah.id]!,
                                  progressColor: AppColors.accent,
                                )
                              else
                                IconButton(
                                  visualDensity: VisualDensity.compact,
                                  icon: Icon(
                                    Icons.download,
                                    color: _isDownloaded[surah.id] == true
                                        ? AppColors.accent.withAlpha(75)
                                        : AppColors.accent,
                                  ),
                                  onPressed: () {
                                    _downloadSurah(surah);
                                  },
                                ),
                              isCurrentlyActive
                                ? const Icon(
                                    Icons.graphic_eq,
                                    color: AppColors.accent,
                                    size: 32,
                                  )
                                : IconButton(
                                    visualDensity: VisualDensity.compact,
                                    icon: Icon(
                                      isPlaying ? Icons.pause_circle_filled : Icons.play_circle_fill,
                                      color: AppColors.accent,
                                      size: 32,
                                    ),
                                    onPressed: () => _playSurah(audioProvider, surah, isPlaying),
                                  ),
                            ],
                          ),
                        ),
                        onTap: () {
                          if (isPlaying) {
                            Navigator.push(
                              context,
                              MaterialPageRoute(builder: (_) => const PlayerScreen()),
                            );
                          }
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

  Future<void> _playSurah(AudioProvider audioProvider, Surah surah, bool isPlaying) async {
    if (isPlaying) {
      Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => const PlayerScreen()),
      );
    } else {
      // Check if downloaded or online
      bool isLocal = _isDownloaded[surah.id] == true;
      
      if (!isLocal) {
        try {
          if (!kIsWeb) {
            final result = await InternetAddress.lookup('google.com');
            if (result.isEmpty || result[0].rawAddress.isEmpty) {
              throw const SocketException("No internet");
            }
          }
        } catch (_) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('عفوا لا يوجد اتصال بالانترنت'),
                backgroundColor: Colors.red,
              ),
            );
          }
          return;
        }
      }

      if (!mounted) return;
      audioProvider.playReciterSurah(
        surah, 
        playlist: _filteredSurahs,
        reciterId: widget.reciter.id,
      );
      Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => const PlayerScreen()),
      );
    }
  }
}
