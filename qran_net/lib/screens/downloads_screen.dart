import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/downloaded_item.dart';
import '../models/surah.dart';
import '../services/download_service.dart';
import '../providers/audio_provider.dart';
import '../constants/colors.dart';
import '../widgets/app_list_card.dart';
import '../widgets/ad_banner_widget.dart';
import 'player_screen.dart';
import '../widgets/app_background.dart';
import '../widgets/glass_container.dart';

class DownloadsScreen extends StatefulWidget {
  const DownloadsScreen({super.key});

  @override
  State<DownloadsScreen> createState() => _DownloadsScreenState();
}

class _DownloadsScreenState extends State<DownloadsScreen> {
  final DownloadService _downloadService = DownloadService();
  List<DownloadedItem> _downloads = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadDownloads();
  }

  Future<void> _loadDownloads() async {
    final items = await _downloadService.getDownloadedItems();
    setState(() {
      _downloads = items;
      _isLoading = false;
    });
  }

  void _playDownload(DownloadedItem item) {
    final audioProvider = Provider.of<AudioProvider>(context, listen: false);
    
    // Create a Surah object with local path
    // Our AudioProvider.play() will detect this URL as a downloaded one because it's in the list
    final surah = Surah(
      id: 0,
      name: item.title,
      url: item.url, // We use the URL as ID to find the local path in AudioProvider
    );

    audioProvider.setPlaylist([surah], 0);
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => const PlayerScreen()),
    );
  }

  Future<void> _deleteDownload(DownloadedItem item) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text("حذف التحميل"),
        content: Text("هل أنت متأكد من حذف '${item.title}'؟"),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text("إلغاء"),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text("حذف", style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      await _downloadService.deleteDownload(item.id);
      _loadDownloads();
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
          title: const Text("التحميلات"),
          centerTitle: true,
        ),
        body: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : _downloads.isEmpty
                ? const Center(
                    child: Text(
                      "لا توجد ملفات محملة حالياً",
                      style: TextStyle(color: Colors.white70),
                    ),
                  )
                : ListView.builder(
                    itemCount: _downloads.length,
                    itemBuilder: (context, index) {
                      final item = _downloads[index];
                      return Consumer<AudioProvider>(
                        builder: (context, audioProvider, _) {
                          final isPlaying = audioProvider.currentSurah?.url == item.url;
                          final isCurrentlyActive = isPlaying && audioProvider.isPlaying;

                          return AppListCard(
                            isActive: isPlaying,
                            isActiveGlow: isCurrentlyActive,
                            leading: CircleAvatar(
                                backgroundColor: isPlaying ? AppColors.accent.withAlpha(50) : Colors.white12,
                                child: Icon(
                                  item.category == DownloadCategory.quran
                                      ? Icons.mic
                                      : item.category == DownloadCategory.nasheed
                                          ? Icons.music_note
                                          : Icons.mic_external_on,
                                  color: isPlaying ? AppColors.accent : AppColors.accent,
                                ),
                              ),
                              title: Text(item.title),
                              subtitle: Text(
                                item.artistName ?? "",
                                style: const TextStyle(color: Colors.white60, fontSize: 12),
                              ),
                              trailing: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  IconButton(
                                    icon: const Icon(Icons.delete_outline, color: Colors.redAccent),
                                    onPressed: () => _deleteDownload(item),
                                  ),
                                  isCurrentlyActive
                                    ? const Icon(Icons.graphic_eq, color: AppColors.accent, size: 32)
                                    : IconButton(
                                        icon: Icon(
                                          isPlaying ? Icons.pause_circle_filled : Icons.play_circle_fill,
                                          color: AppColors.accent,
                                          size: 32,
                                        ),
                                        onPressed: () => _playDownload(item),
                                      ),
                                ],
                              ),
                              onTap: () => _playDownload(item),
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
