import 'package:flutter/material.dart';
import '../models/quran_surah.dart';
import '../models/tafsir_verse.dart';
import '../widgets/ad_banner_widget.dart';
import '../services/api_service.dart';
import '../constants/colors.dart';
import '../widgets/glass_container.dart';
import '../widgets/app_background.dart';

class TafsirDetailScreen extends StatefulWidget {
  final QuranSurah surah;
  const TafsirDetailScreen({super.key, required this.surah});

  @override
  State<TafsirDetailScreen> createState() => _TafsirDetailScreenState();
}

class _TafsirDetailScreenState extends State<TafsirDetailScreen> {
  final ApiService _apiService = ApiService();
  List<TafsirVerse> _verses = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadTafsir();
  }

  Future<void> _loadTafsir() async {
    final verses = await _apiService.fetchSurahTafsir(widget.surah.number);
    if (mounted) {
      setState(() {
        _verses = verses;
        _isLoading = false;
      });
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
          title: Text("تفسير سورة ${widget.surah.name}"),
        ),
        body: _isLoading
            ? const Center(child: CircularProgressIndicator(color: AppColors.accent))
            : ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: _verses.length,
                itemBuilder: (context, index) {
                  final verse = _verses[index];
                  return Container(
                    margin: const EdgeInsets.only(bottom: 20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        // Verse Card
                        GlassContainer(
                          borderRadius: 15,
                          blur: 10,
                          child: Padding(
                            padding: const EdgeInsets.all(16.0),
                            child: Column(
                              children: [
                                Text(
                                  verse.text,
                                  textAlign: TextAlign.center,
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 22,
                                    fontFamily: 'Amiri', // Assuming Amiri is available
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                const SizedBox(height: 8),
                                CircleAvatar(
                                  radius: 12,
                                  backgroundColor: AppColors.accent,
                                  child: Text(
                                    "${verse.numberInSurah}",
                                    style: const TextStyle(
                                      color: Colors.black,
                                      fontSize: 10,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(height: 12),
                        // Tafsir Section
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Row(
                                mainAxisAlignment: MainAxisAlignment.end,
                                children: [
                                  Text(
                                    "التفسير الميسر",
                                    style: TextStyle(
                                      color: AppColors.accent,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 14,
                                    ),
                                  ),
                                  SizedBox(width: 8),
                                  Icon(Icons.description, color: AppColors.accent, size: 16),
                                ],
                              ),
                              const Divider(color: AppColors.accent, thickness: 0.5),
                              Text(
                                verse.tafsir,
                                textAlign: TextAlign.right,
                                style: TextStyle(
                                  color: Colors.white.withOpacity(0.9),
                                  fontSize: 16,
                                  height: 1.6,
                                ),
                              ),
                            ],
                          ),
                        ),
                        if (index < _verses.length - 1)
                          const Padding(
                            padding: EdgeInsets.symmetric(vertical: 24.0),
                            child: Icon(Icons.star, color: Colors.white10, size: 12),
                          ),
                      ],
                    ),
                  );
                },
              ),
        bottomNavigationBar: const AdBannerWidget(),
      ),
    );
  }
}
