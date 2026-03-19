import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:package_info_plus/package_info_plus.dart';
import '../providers/settings_provider.dart';
import '../constants/colors.dart';
import '../constants/strings.dart';
import '../screens/explanation_screen.dart';
import '../services/update_service.dart';
import 'app_background.dart';


class AppDrawer extends StatelessWidget {
  const AppDrawer({super.key});

  @override
  Widget build(BuildContext context) {
    final settings = Provider.of<SettingsProvider>(context);

    return Drawer(
      width: MediaQuery.of(context).size.width * 0.85,
      child: AppBackground(
        child: Column(
          children: [
            DrawerHeader(
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.3),
              ),
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(20),
                      child: Image.asset(
                        'assets/icon/app_icon.png',
                        width: 80,
                        height: 80,
                      ),
                    ),
                    const SizedBox(height: 10),
                    const Text(
                      AppStrings.appName,
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            Expanded(
              child: ListView(
                padding: EdgeInsets.zero,
                children: [
                  _buildSectionHeader(context, "إعدادات الصوت"),
                  SwitchListTile(
                    title: const Text("صوت تقليب الصفحات", style: TextStyle(color: Colors.white)),
                    subtitle: const Text("تشغيل صوت واقعي عند تصفح المصحف", style: TextStyle(color: Colors.white70, fontSize: 12)),
                    value: settings.pageFlipSoundEnabled,
                    activeThumbColor: AppColors.accent,
                    onChanged: (value) => settings.setPageFlipSoundEnabled(value),
                  ),
                  SwitchListTile(
                    title: const Text("التشغيل في الخلفية", style: TextStyle(color: Colors.white)),
                    subtitle: const Text("استمرار الصوت عند إغلاق الشاشة", style: TextStyle(color: Colors.white70, fontSize: 12)),
                    value: settings.backgroundPlaybackEnabled,
                    activeThumbColor: AppColors.accent,
                    onChanged: (value) => settings.setBackgroundPlaybackEnabled(value),
                  ),
                  SwitchListTile(
                    title: const Text("تخفيف الإعدادات للأجهزة الضعيفة", style: TextStyle(color: Colors.white)),
                    subtitle: const Text("إيقاف التوهج والblur لتوفير الذاكرة", style: TextStyle(color: Colors.white70, fontSize: 12)),
                    value: settings.lowEndDeviceEnabled,
                    activeThumbColor: AppColors.accent,
                    onChanged: (value) => settings.setLowEndDeviceEnabled(value),
                  ),
                  const Divider(color: Colors.white24),
                  _buildSectionHeader(context, "إعدادات العرض"),
                  ListTile(
                    title: const Text("تغيير الخلفية", style: TextStyle(color: Colors.white)),
                    subtitle: Column(
                      children: [
                        _buildBackgroundOption(context, settings, 'wood', "خشبية"),
                        _buildBackgroundOption(context, settings, 'black', "سوداء"),
                        _buildBackgroundOption(context, settings, 'green', "زمردي (أخضر فاخر)"),
                        _buildBackgroundOption(context, settings, 'teal', "تيل (بترولي)"),
                      ],
                    ),
                  ),
                  const SizedBox(height: 8),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text("طريقة عرض القوائم", style: TextStyle(color: Colors.white)),
                        const Text("(الرئيسية، القراء، المنشدون، الخطباء، المبتهلون)", style: TextStyle(color: Colors.white70, fontSize: 10)),
                        const SizedBox(height: 8),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            ToggleButtons(
                              isSelected: [
                                settings.viewMode == 'list',
                                settings.viewMode == 'grid',
                              ],
                              onPressed: (index) {
                                settings.setViewMode(index == 0 ? 'list' : 'grid');
                              },
                              color: Colors.white54,
                              selectedColor: AppColors.accent,
                              fillColor: AppColors.accent.withValues(alpha: 0.1),
                              borderColor: Colors.white24,
                              selectedBorderColor: AppColors.accent,
                              borderRadius: BorderRadius.circular(8),
                              constraints: const BoxConstraints(minHeight: 36, minWidth: 70),
                              children: const [
                                Icon(Icons.list, size: 20, semanticLabel: "قائمة"),
                                Icon(Icons.grid_view, size: 20, semanticLabel: "مربعات"),
                              ],
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const Divider(color: Colors.white24),
                  _buildSectionHeader(context, "تواصل ومشاركة"),
                  ListTile(
                    leading: const Icon(Icons.share, color: Colors.white),
                    title: const Text("مشاركة التطبيق", style: TextStyle(color: Colors.white)),
                    onTap: () {
                      Share.share("${AppStrings.shareMessage}${AppStrings.appDownloadUrl}");
                    },
                  ),
                  ListTile(
                    leading: const Icon(Icons.system_update_alt, color: Colors.white),
                    title: const Text(AppStrings.checkForUpdates, style: TextStyle(color: Colors.white)),
                    onTap: () => _handleUpdateCheck(context),
                  ),
                  ListTile(
                    leading: const Icon(Icons.help_outline, color: Colors.white),
                    title: const Text("شرح التطبيق", style: TextStyle(color: Colors.white)),
                    onTap: () {
                      Navigator.pop(context); // Close drawer
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => const ExplanationScreen()),
                      );
                    },
                  ),
                  ListTile(
                    leading: const Icon(Icons.chat_bubble_outline, color: Colors.white),
                    title: const Text("اتصل بنا (واتساب)", style: TextStyle(color: Colors.white)),
                    onTap: () async {
                      final Uri url = Uri.parse("https://wa.me/201127556848");
                      if (await canLaunchUrl(url)) {
                        await launchUrl(url, mode: LaunchMode.externalApplication);
                      } else {
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text("عذراً، لا يمكن فتح واتساب حالياً")),
                          );
                        }
                      }
                    },
                  ),
                  ListTile(
                    leading: const Icon(Icons.info_outline, color: Colors.white),
                    title: const Text("عن التطبيق", style: TextStyle(color: Colors.white)),
                    onTap: () => _showAboutDialog(context),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: FutureBuilder<PackageInfo>(
                future: PackageInfo.fromPlatform(),
                builder: (context, snapshot) {
                  final version = snapshot.hasData ? snapshot.data!.version : "...";
                  return Text(
                    "الإصدار $version",
                    style: const TextStyle(color: Colors.white54, fontSize: 12),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(BuildContext context, String title) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      child: Text(
        title,
        style: const TextStyle(
          color: AppColors.accent,
          fontSize: 14,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  Widget _buildBackgroundOption(BuildContext context, SettingsProvider settings, String type, String label) {
    bool isSelected = settings.backgroundType == type;
    Gradient gradient;
    
    switch (type) {
      case 'black': gradient = AppColors.blackGradient; break;
      case 'green': gradient = AppColors.greenGradient; break;
      case 'teal': gradient = AppColors.tealGradient; break;
      case 'wood': default: gradient = AppColors.woodGradient; break;
    }

    return GestureDetector(
      onTap: () => settings.setBackgroundType(type),
      child: Container(
        width: double.infinity,
        margin: const EdgeInsets.only(top: 8),
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          gradient: gradient,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? AppColors.accent : Colors.white24,
            width: isSelected ? 2 : 1,
          ),
          boxShadow: isSelected ? [
            BoxShadow(
              color: AppColors.accent.withValues(alpha: 0.3),
              blurRadius: 8,
              spreadRadius: 1,
            )
          ] : null,
        ),
        child: Center(
          child: Text(
            label,
            style: TextStyle(
              color: isSelected ? AppColors.accent : Colors.white,
              fontSize: 14,
              fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
            ),
          ),
        ),
      ),
    );
  }

  void _handleUpdateCheck(BuildContext context) async {
    final updateService = UpdateService();
    
    // Show loading dialog
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(
        child: CircularProgressIndicator(color: AppColors.accent),
      ),
    );

    try {
      final updateAvailable = await updateService.checkForUpdates();
      if (context.mounted) {
        Navigator.pop(context); // Close loading dialog

        if (updateAvailable) {
          _showUpdateDialog(context, updateService);
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text(AppStrings.upToDate)),
          );
        }
      }
    } catch (e) {
      if (context.mounted) {
        Navigator.pop(context); // Close loading dialog
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text(AppStrings.updateError)),
        );
      }
    }
  }

  void _showUpdateDialog(BuildContext context, UpdateService updateService) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.surface,
        title: const Text(AppStrings.updateAvailable, style: TextStyle(color: Colors.white)),
        content: const Text(AppStrings.updateMessage, style: TextStyle(color: Colors.white70)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text(AppStrings.close, style: TextStyle(color: Colors.white54)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.accent),
            onPressed: () {
              Navigator.pop(context);
              updateService.triggerUpdate();
            },
            child: const Text(AppStrings.download, style: TextStyle(color: Colors.black)),
          ),
        ],
      ),
    );
  }

  void _showAboutDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.surface,
        title: const Text("عن التطبيق", style: TextStyle(color: Colors.white)),
        content: FutureBuilder<PackageInfo>(
          future: PackageInfo.fromPlatform(),
          builder: (context, snapshot) {
            final version = snapshot.hasData ? snapshot.data!.version : "...";
            return Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text("تطبيق الجامع - تجربة إيمانية متكاملة.", style: TextStyle(color: Colors.white)),
                const SizedBox(height: 10),
                Text("الإصدار: $version", style: const TextStyle(color: Colors.white70)),
                const SizedBox(height: 5),
                const Text("تم التطوير باستخدام Flutter.", style: TextStyle(color: Colors.white70)),
              ],
            );
          },
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text("إغلاق", style: TextStyle(color: AppColors.accent)),
          ),
        ],
      ),
    );
  }
}
