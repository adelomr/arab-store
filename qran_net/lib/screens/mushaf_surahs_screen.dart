import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/quran_surah.dart';
import '../services/api_service.dart';
import '../constants/colors.dart';
import '../widgets/glass_container.dart';
import 'mushaf_read_screen.dart';
import 'mushaf_verse_search_screen.dart';
import '../constants/mushaf_data.dart';
import '../widgets/app_list_card.dart';
import '../widgets/app_background.dart';
import '../widgets/ad_banner_widget.dart';
import 'package:provider/provider.dart';

class MushafSurahsScreen extends StatefulWidget {
  const MushafSurahsScreen({super.key});

  @override
  State<MushafSurahsScreen> createState() => _MushafSurahsScreenState();
}

class _MushafSurahsScreenState extends State<MushafSurahsScreen> {
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

  Future<void> _goToLastBookmark() async {
    final prefs = await SharedPreferences.getInstance();
    final lastPage = prefs.getInt('mushaf_bookmark');
    
    if (lastPage != null) {
      if (!mounted) return;
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => MushafReadScreen(initialPage: lastPage),
        ),
      );
    } else {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("لا يوجد حفظ مسبق")),
      );
    }
  }

  void _navigateToVerseSearch() {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (context) => const MushafVerseSearchScreen()),
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
          title: const Text("المصحف الشريف"),
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
                            "${surah.englishName} - ${surah.numberOfAyahs} آية",
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
                                builder: (context) => MushafReadScreen(
                                  surah: surah,
                                  initialPage: _getStartPage(surah.number),
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
        floatingActionButton: Column(
          mainAxisAlignment: MainAxisAlignment.end,
          children: [
            FloatingActionButton.small(
              heroTag: "search_verse",
              onPressed: _navigateToVerseSearch,
              backgroundColor: AppColors.accent,
              child: const Icon(Icons.search, color: Colors.black87),
            ),
            const SizedBox(height: 12),
            FloatingActionButton(
              heroTag: "last_bookmark",
              onPressed: _goToLastBookmark,
              backgroundColor: AppColors.primary,
              child: const Icon(Icons.bookmark, color: AppColors.accent),
            ),
          ],
        ),
        bottomNavigationBar: const AdBannerWidget(),
      ),
    );
  }

  int _getStartPage(int surahNumber) {
    return MushafData.surahStartPages[surahNumber] ?? 1;
  }
}
