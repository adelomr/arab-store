import 'package:flutter/material.dart';
import '../constants/strings.dart';
import '../widgets/category_card.dart';
import 'reciters_screen.dart';
import 'radios_screen.dart';
import 'nasheeds_screen.dart';
import 'speeches_screen.dart';
import 'downloads_screen.dart';
import 'mushaf_surahs_screen.dart';
import 'favorites_screen.dart';
import 'tafsir_surahs_screen.dart';
import 'ibtihalat_screen.dart';
import '../constants/colors.dart';
import '../widgets/app_background.dart';
import '../widgets/app_drawer.dart';

import 'package:provider/provider.dart';
import '../providers/settings_provider.dart';
import '../widgets/app_list_card.dart';
import '../widgets/ad_banner_widget.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final settings = Provider.of<SettingsProvider>(context);

    final List<Map<String, dynamic>> categories = [
      {
        'title': AppStrings.quranMurattal,
        'icon': Icons.mic,
        'onTap': () => Navigator.push(context, MaterialPageRoute(builder: (context) => const RecitersScreen(isMujawwad: false))),
      },
      {
        'title': AppStrings.quranMujawwad,
        'icon': Icons.record_voice_over,
        'onTap': () => Navigator.push(context, MaterialPageRoute(builder: (context) => const RecitersScreen(isMujawwad: true))),
      },
      {
        'title': "المصحف",
        'icon': Icons.menu_book,
        'onTap': () => Navigator.push(context, MaterialPageRoute(builder: (context) => const MushafSurahsScreen())),
      },
      {
        'title': "التفسير الميسر",
        'icon': Icons.auto_stories,
        'onTap': () => Navigator.push(context, MaterialPageRoute(builder: (context) => const TafsirSurahsScreen())),
      },
      {
        'title': AppStrings.speeches,
        'icon': Icons.mic_external_on,
        'onTap': () => Navigator.push(context, MaterialPageRoute(builder: (context) => const SpeechesScreen())),
      },
      {
        'title': AppStrings.nasheeds,
        'icon': Icons.music_note,
        'onTap': () => Navigator.push(context, MaterialPageRoute(builder: (context) => const NasheedsScreen())),
      },
      {
        'title': AppStrings.ibtihalat,
        'icon': Icons.auto_awesome,
        'onTap': () => Navigator.push(context, MaterialPageRoute(builder: (context) => const IbtihalatScreen())),
      },
      {
        'title': AppStrings.specialRadios,
        'icon': Icons.radio,
        'onTap': () => Navigator.push(context, MaterialPageRoute(builder: (context) => const RadiosScreen())),
      },
      {
        'title': "التحميلات",
        'icon': Icons.download_for_offline,
        'onTap': () => Navigator.push(context, MaterialPageRoute(builder: (context) => const DownloadsScreen())),
      },
      {
        'title': "المفضلة",
        'icon': Icons.favorite,
        'onTap': () => Navigator.push(context, MaterialPageRoute(builder: (context) => const FavoritesScreen())),
      },
    ];

    return AppBackground(
      child: Scaffold(
        backgroundColor: Colors.transparent,
        drawer: const AppDrawer(),
        appBar: AppBar(
          title: const Text(AppStrings.appName),
          centerTitle: true,
          leading: Builder(
            builder: (context) => Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                IconButton(
                  icon: const Icon(Icons.menu),
                  onPressed: () => Scaffold.of(context).openDrawer(),
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 8.0),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: Image.asset('assets/icon/app_icon.png'),
                  ),
                ),
              ],
            ),
          ),
          leadingWidth: 100,
        ),
        body: Padding(
          padding: const EdgeInsets.all(16.0),
          child: settings.viewMode == 'grid'
              ? GridView.builder(
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    crossAxisSpacing: 16,
                    mainAxisSpacing: 16,
                  ),
                  itemCount: categories.length,
                  itemBuilder: (context, index) {
                    final cat = categories[index];
                    return CategoryCard(
                      title: cat['title'],
                      icon: cat['icon'],
                      onTap: cat['onTap'],
                    );
                  },
                )
              : ListView.builder(
                  itemCount: categories.length,
                  itemBuilder: (context, index) {
                    final cat = categories[index];
                    return AppListCard(
                      leading: Icon(cat['icon'], color: AppColors.accent, size: 28),
                      title: Text(cat['title']),
                      trailing: const Icon(Icons.arrow_forward_ios, color: AppColors.accent, size: 16),
                      onTap: cat['onTap'],
                    );
                  },
                ),
        ),
        bottomNavigationBar: const AdBannerWidget(),
      ),
    );
  }
}
