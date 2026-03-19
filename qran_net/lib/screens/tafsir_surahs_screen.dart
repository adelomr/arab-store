import 'package:flutter/material.dart';
import '../models/quran_surah.dart';
import '../services/api_service.dart';
import '../constants/colors.dart';
import '../widgets/glass_container.dart';
import '../widgets/app_list_card.dart';
import 'tafsir_detail_screen.dart';
import '../widgets/app_background.dart';
import 'package:provider/provider.dart';
import '../widgets/ad_banner_widget.dart';

class TafsirSurahsScreen extends StatefulWidget {
  const TafsirSurahsScreen({super.key});

  @override
  State<TafsirSurahsScreen> createState() => _TafsirSurahsScreenState();
}

class _TafsirSurahsScreenState extends State<TafsirSurahsScreen> {
  final ApiService _apiService = ApiService();
  List<QuranSurah> _allSurahs = [];
  List<QuranSurah> _filteredSurahs = [];
  bool _isLoading = true;
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadSurahs();
  }

  Future<void> _loadSurahs() async {
    final surahs = await _apiService.fetchQuranSurahs();
    if (mounted) {
      setState(() {
        _allSurahs = surahs;
        _filteredSurahs = surahs;
        _isLoading = false;
      });
    }
  }

  void _filterSurahs(String query) {
    setState(() {
      _filteredSurahs = _allSurahs
          .where((s) =>
              s.name.contains(query) ||
              s.englishName.toLowerCase().contains(query.toLowerCase()) ||
              s.number.toString().contains(query))
          .toList();
    });
  }

  @override
  Widget build(BuildContext context) {
    return AppBackground(
      child: Scaffold(
        backgroundColor: Colors.transparent,
        appBar: AppBar(
          backgroundColor: Colors.transparent,
          elevation: 0,
          title: const Text("التفسير الميسر"),
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
                  textAlign: TextAlign.right,
                  style: const TextStyle(color: Colors.white),
                  decoration: InputDecoration(
                    hintText: "بحث عن سورة...",
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
                  onChanged: _filterSurahs,
                ),
              ),
            ),
            Expanded(
              child: _isLoading
                  ? const Center(child: CircularProgressIndicator(color: AppColors.accent))
                  : ListView.builder(
                      itemCount: _filteredSurahs.length,
                      itemBuilder: (context, index) {
                        final surah = _filteredSurahs[index];
                        return AppListCard(
                          leading: CircleAvatar(
                            backgroundColor: Colors.white24,
                            child: Text(
                              "${surah.number}",
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                          title: Text(surah.name),
                          subtitle: Text(
                            "${surah.numberOfAyahs} آية",
                            style: const TextStyle(color: Colors.white60, fontSize: 12),
                          ),
                          trailing: const Icon(
                            Icons.arrow_forward_ios,
                            size: 16,
                            color: AppColors.accent,
                          ),
                          onTap: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => TafsirDetailScreen(surah: surah),
                              ),
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
