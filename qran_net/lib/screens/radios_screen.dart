import 'package:flutter/material.dart';
import '../models/radio_channel.dart';
import '../services/api_service.dart';
import '../widgets/radio_card.dart';
import '../widgets/glass_container.dart';
import '../constants/strings.dart';
import '../constants/colors.dart';
import 'favorites_screen.dart';
import '../widgets/app_background.dart';
import 'package:provider/provider.dart';
import '../widgets/ad_banner_widget.dart';

class RadiosScreen extends StatefulWidget {
  const RadiosScreen({super.key});

  @override
  State<RadiosScreen> createState() => _RadiosScreenState();
}

class _RadiosScreenState extends State<RadiosScreen> {
  final ApiService _apiService = ApiService();
  final TextEditingController _searchController = TextEditingController();
  List<RadioChannel> _allRadios = [];
  List<RadioChannel> _filteredRadios = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadRadios();
  }

  Future<void> _loadRadios() async {
    final radios = await _apiService.fetchRadios();
    if (mounted) {
      setState(() {
        _allRadios = radios;
        _filteredRadios = radios;
        _isLoading = false;
      });
    }
  }

  void _filterRadios(String query) {
    setState(() {
      _filteredRadios = _allRadios
          .where((r) => r.name.contains(query))
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
          title: const Text(AppStrings.specialRadios),
          centerTitle: true,
          actions: [
            IconButton(
              icon: const Icon(Icons.favorite),
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => FavoritesScreen(typeFilter: 'radio'),
                  ),
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
                          hintText: "بحث عن إذاعة...",
                          hintStyle: TextStyle(color: Colors.white.withAlpha(100)),
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
                        onChanged: _filterRadios,
                      ),
                    ),
                  ),
                  Expanded(
                    child: _filteredRadios.isEmpty
                        ? const Center(
                            child: Text(
                              "لا توجد إذاعات متاحة حالياً",
                              style: TextStyle(color: Colors.white70),
                            ),
                          )
                        : ListView.builder(
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            itemCount: _filteredRadios.length,
                            itemBuilder: (context, index) {
                              return RadioCard(
                                radio: _filteredRadios[index],
                                playlist: _filteredRadios,
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
