import 'dart:async';
import 'package:flutter/material.dart';
import '../models/quran_verse.dart';
import '../services/api_service.dart';
import '../constants/colors.dart';
import 'mushaf_read_screen.dart';
import '../widgets/app_background.dart';
import '../widgets/glass_container.dart';
import '../providers/settings_provider.dart';

import 'package:quran/quran.dart' as quran;

class MushafVerseSearchScreen extends StatefulWidget {
  const MushafVerseSearchScreen({super.key});

  @override
  State<MushafVerseSearchScreen> createState() => _MushafVerseSearchScreenState();
}

class _MushafVerseSearchScreenState extends State<MushafVerseSearchScreen> {
  final ApiService _apiService = ApiService();
  final TextEditingController _searchController = TextEditingController();
  List<QuranVerse> _searchResults = [];
  bool _isLoading = false;
  String? _errorMessage;
  Timer? _debounce;

  @override
  void dispose() {
    _debounce?.cancel();
    _searchController.dispose();
    super.dispose();
  }

  void _onSearchChanged(String query) {
    if (_debounce?.isActive ?? false) _debounce!.cancel();
    _debounce = Timer(const Duration(milliseconds: 600), () {
      if (query.trim().isNotEmpty) {
        _performSearch(query.trim());
      } else {
        setState(() {
          _searchResults = [];
          _isLoading = false;
        });
      }
    });
  }

  Future<void> _performSearch(String query) async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    
    try {
      // Normalize Arabic for better search results
      final normalizedQuery = _normalizeArabic(query);
      final results = await _apiService.searchVerses(normalizedQuery);
      
      if (mounted) {
        setState(() {
          _searchResults = results;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _errorMessage = "حدث خطأ أثناء البحث. يرجى المحاولة مرة أخرى.";
        });
      }
    }
  }

  String _normalizeArabic(String text) {
    return text
        .replaceAll(RegExp(r'[\u064B-\u065F\u0670]'), '') // Remove harakat
        .replaceAll('أ', 'ا')
        .replaceAll('إ', 'ا')
        .replaceAll('آ', 'ا')
        .replaceAll('ة', 'ه')
        .replaceAll('ى', 'ي');
  }

  @override
  Widget build(BuildContext context) {
    return AppBackground(
      child: Scaffold(
        backgroundColor: Colors.transparent,
        appBar: AppBar(
          backgroundColor: Colors.transparent,
          elevation: 0,
          title: const Text("بحث في القرآن الكريم"),
          centerTitle: true,
        ),
        body: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: GlassContainer(
                borderRadius: 15,
                blur: 10,
                child: TextField(
                  controller: _searchController,
                  onChanged: _onSearchChanged,
                  autofocus: true,
                  style: const TextStyle(color: Colors.white, fontSize: 18),
                  textAlign: TextAlign.right,
                  decoration: InputDecoration(
                    hintText: "مثال: وجعلنا من الماء كل شيء حي",
                    hintStyle: TextStyle(color: Colors.white.withOpacity(0.3), fontSize: 16),
                    prefixIcon: const Icon(Icons.search, color: AppColors.accent),
                    suffixIcon: _searchController.text.isNotEmpty 
                      ? IconButton(
                          icon: const Icon(Icons.clear, color: Colors.white54),
                          onPressed: () {
                            _searchController.clear();
                            _onSearchChanged('');
                          },
                        )
                      : null,
                    border: InputBorder.none,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 15),
                  ),
                ),
              ),
            ),
            if (_isLoading)
              const Padding(
                padding: EdgeInsets.all(20.0),
                child: CircularProgressIndicator(color: AppColors.accent),
              )
            else if (_errorMessage != null)
              Padding(
                padding: const EdgeInsets.all(20.0),
                child: Column(
                  children: [
                    const Icon(Icons.error_outline, color: Colors.redAccent, size: 40),
                    const SizedBox(height: 10),
                    Text(
                      _errorMessage!,
                      style: const TextStyle(color: Colors.white70),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            Expanded(
              child: Container(
                width: double.infinity,
                margin: const EdgeInsets.only(top: 10),
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.2), // Adjusted for glass effect
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(30)),
                ),
                child: _searchResults.isEmpty && !_isLoading && _searchController.text.isNotEmpty
                    ? const Center(
                        child: Text(
                          "لم يتم العثور على نتائج",
                          style: TextStyle(color: Colors.white60, fontSize: 18),
                        ),
                      )
                    : ListView.separated(
                        padding: const EdgeInsets.symmetric(vertical: 20),
                        itemCount: _searchResults.length,
                        separatorBuilder: (context, index) => const Divider(color: Colors.white10, indent: 20, endIndent: 20),
                        itemBuilder: (context, index) {
                          final verse = _searchResults[index];
                          // Use quran package to get precise page number for the Madani Mushaf
                          final pageNumber = quran.getPageNumber(verse.surahNumber, verse.numberInSurah);
                          
                          return ListTile(
                            contentPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
                            title: Text(
                              verse.text,
                              textAlign: TextAlign.right,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 18,
                                height: 1.6,
                                fontFamily: 'Traditional Arabic', // Optional if font exists
                              ),
                            ),
                            subtitle: Padding(
                              padding: const EdgeInsets.only(top: 8.0),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.end,
                                children: [
                                  Text(
                                    "آية ${verse.numberInSurah}",
                                    style: const TextStyle(color: AppColors.accent, fontSize: 14),
                                  ),
                                  const SizedBox(width: 8),
                                  const Icon(Icons.circle, size: 4, color: Colors.white24),
                                  const SizedBox(width: 8),
                                  Text(
                                    "سورة ${verse.surahName}",
                                    style: const TextStyle(color: Colors.white60, fontSize: 14, fontWeight: FontWeight.bold),
                                  ),
                                ],
                              ),
                            ),
                            onTap: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  // Navigate using the accurate page number from quran package
                                  builder: (context) => MushafReadScreen(initialPage: pageNumber),
                                ),
                              );
                            },
                          );
                        },
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
