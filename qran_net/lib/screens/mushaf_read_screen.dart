import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter/gestures.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:provider/provider.dart';
import '../services/sound_manager.dart';
import '../providers/settings_provider.dart';
import '../widgets/ad_banner_widget.dart';
import '../models/quran_surah.dart';
import '../services/api_service.dart';
import '../constants/mushaf_data.dart';


class MushafReadScreen extends StatefulWidget {
  final QuranSurah? surah;
  final int initialPage;
  const MushafReadScreen({super.key, this.surah, this.initialPage = 1});

  @override
  State<MushafReadScreen> createState() => _MushafReadScreenState();
}

class _MushafReadScreenState extends State<MushafReadScreen> {
  late PageController _pageController;
  int _currentPage = 1;
  ScrollPhysics _scrollPhysics = const PageScrollPhysics(); // Default physics
  bool _showOverlays = false;
  List<QuranSurah> _surahs = [];
  final ApiService _apiService = ApiService();
  
  // For scroll debouncing
  DateTime? _lastScrollTime;
  static const Duration _scrollDebounce = Duration(milliseconds: 300);
  final FocusNode _focusNode = FocusNode();

  @override
  void initState() {
    super.initState();
    _currentPage = widget.initialPage;
    _pageController = PageController(initialPage: _currentPage - 1);
    // Enable Immersive Mode (Hide Status Bar)
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
    
    _loadSurahs();
    // Check for bookmark if no specific page was requested
    if (widget.initialPage == 1) {
      _loadBookmark();
    }
  }

  Future<void> _loadSurahs() async {
    final surahs = await _apiService.fetchQuranSurahs();
    if (mounted) {
      setState(() {
        _surahs = surahs;
      });
    }
  }

  Future<void> _loadBookmark() async {
    final prefs = await SharedPreferences.getInstance();
    final savedPage = prefs.getInt('mushaf_bookmark');
    if (savedPage != null && savedPage != 1) {
      // Suggest jumping to bookmark
      WidgetsBinding.instance.addPostFrameCallback((_) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text("الذهاب لآخر صفحة محفوظة ($savedPage)؟"),
            action: SnackBarAction(
              label: "نعم",
              onPressed: () {
                _pageController.jumpToPage(savedPage - 1);
              },
            ),
            duration: const Duration(seconds: 5),
          ),
        );
      });
    }
  }

  Future<void> _saveBookmark() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt('mushaf_bookmark', _currentPage);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("تم حفظ الصفحة كعلامة مرجعية")),
      );
    }
  }

  void _playPageFlipSound() {
    final settings = Provider.of<SettingsProvider>(context, listen: false);
    SoundManager().playPageFlipSound(enabled: settings.pageFlipSoundEnabled);
  }

  @override
  void dispose() {
    _pageController.dispose();
    _focusNode.dispose();
    // Restore System UI
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFFF5D6), // Old paper color matches the image tint
      body: Stack(
        children: [
          // Directionality rtl ensures PageView works like a logical RTL book without reverse=true tricks
          Directionality(
            textDirection: TextDirection.rtl,
            child: KeyboardListener(
              focusNode: _focusNode..requestFocus(),
              onKeyEvent: (event) {
                if (event is KeyDownEvent) {
                  if (event.logicalKey == LogicalKeyboardKey.arrowLeft) {
                    _pageController.previousPage(duration: const Duration(milliseconds: 300), curve: Curves.easeInOut);
                  } else if (event.logicalKey == LogicalKeyboardKey.arrowRight) {
                    _pageController.nextPage(duration: const Duration(milliseconds: 300), curve: Curves.easeInOut);
                  }
                }
              },
              child: Listener(
                onPointerSignal: (pointerSignal) {
                  if (pointerSignal is PointerScrollEvent) {
                    final now = DateTime.now();
                    if (_lastScrollTime == null || now.difference(_lastScrollTime!) > _scrollDebounce) {
                      _lastScrollTime = now;
                      if (pointerSignal.scrollDelta.dy > 0) {
                        _pageController.nextPage(duration: const Duration(milliseconds: 300), curve: Curves.easeInOut);
                      } else if (pointerSignal.scrollDelta.dy < 0) {
                        _pageController.previousPage(duration: const Duration(milliseconds: 300), curve: Curves.easeInOut);
                      }
                    }
                  }
                },
                child: GestureDetector(
                  onTap: () {
                    setState(() {
                      _showOverlays = !_showOverlays;
                    });
                  },
                  child: PageView.builder(
                    controller: _pageController,
                    physics: _scrollPhysics,
                    itemCount: 604,
                    onPageChanged: (index) {
                      // Play Sound
                      _playPageFlipSound();
                      
                      setState(() {
                        _currentPage = index + 1;
                      });
                    },
                    itemBuilder: (context, index) {
                      return MushafPageImage(
                        pageNumber: index + 1,
                        onZoomStatusChanged: (isZoomed) {
                          // Zoom is disabled now but we keep the callback for compatibility
                        },
                      );
                    },
                  ),
                ),
              ),
            ),
          ),
          
          // Top Overlay
          if (_showOverlays)
            Positioned(
              top: 0,
              left: 0,
              right: 0,
              child: Container(
                padding: EdgeInsets.only(top: MediaQuery.of(context).padding.top + 10, bottom: 15),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      const Color(0xFF3E2723).withOpacity(0.8),
                      const Color(0xFF3E2723).withOpacity(0.0),
                    ],
                  ),
                ),
                child: Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.arrow_back, color: Colors.white, size: 30),
                      onPressed: () => Navigator.pop(context),
                    ),
                    Expanded(
                      child: Center(
                        child: Text(
                          MushafData.getJuzName(_currentPage),
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            fontFamily: 'Amiri',
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 48), // Spacer to balance the back button
                  ],
                ),
              ),
            ),

          // Bottom Overlay
          if (_showOverlays)
            Positioned(
              bottom: 0,
              left: 0,
              right: 0,
              child: Container(
                padding: EdgeInsets.only(bottom: MediaQuery.of(context).padding.bottom + 10, top: 15),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.bottomCenter,
                    end: Alignment.topCenter,
                    colors: [
                      const Color(0xFF3E2723).withOpacity(0.8),
                      const Color(0xFF3E2723).withOpacity(0.0),
                    ],
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    _buildOverlayButton(
                      icon: Icons.list,
                      label: "الفهرس",
                      onTap: () => Navigator.pop(context),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        "${MushafData.getSurahNameByPage(_currentPage, _surahs)} $_currentPage",
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                    ),
                    _buildOverlayButton(
                      icon: Icons.bookmark_border,
                      label: "حفظ",
                      onTap: _saveBookmark,
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
      bottomNavigationBar: const AdBannerWidget(),
    );
  }

  Widget _buildOverlayButton({required IconData icon, required String label, required VoidCallback onTap}) {
    return InkWell(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: Colors.white, size: 28),
          const SizedBox(height: 4),
          Text(
            label,
            style: const TextStyle(color: Colors.white, fontSize: 12),
          ),
        ],
      ),
    );
  }
}

class MushafPageImage extends StatefulWidget {
  final int pageNumber;
  final ValueChanged<int>? onVisible;
  final ValueChanged<bool>? onZoomStatusChanged;

  const MushafPageImage({
    super.key, 
    required this.pageNumber, 
    this.onVisible,
    this.onZoomStatusChanged,
  });

  @override
  State<MushafPageImage> createState() => _MushafPageImageState();
}

class _MushafPageImageState extends State<MushafPageImage> {
  @override
  Widget build(BuildContext context) {
    // VisibilityDetector is external, so we'll do a simple build-time notification
    // purely for the "current page" label update. 
    // It's not perfect but works for simple scrolling.
    if (widget.onVisible != null) widget.onVisible!(widget.pageNumber);

    return Container(
      // Ensure the image takes full width and adjusts height naturally
      width: double.infinity, 
      decoration: const BoxDecoration(
         color: Color(0xFFFFF5D6), // Old paper color
      ),
      child: ColorFiltered(
        colorFilter: const ColorFilter.mode(
          Color(0xFFFFF5D6), // Tint the image to match the background
          BlendMode.multiply,
        ),
        child: Image.asset(
          "assets/quran_pages/page${"${widget.pageNumber}".padLeft(3, '0')}.png",
          fit: BoxFit.fill, // Ensure it fills the width
          errorBuilder: (context, error, stackTrace) {
             return SizedBox(
              height: 300,
              child: const Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.broken_image, size: 50, color: Colors.grey),
                    SizedBox(height: 8),
                    Text("فشل تحميل الصفحة (تأكد من تنزيل الملفات)", style: TextStyle(color: Colors.grey)),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}
