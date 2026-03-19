import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:url_launcher/url_launcher.dart';
import '../constants/strings.dart';
import 'package:package_info_plus/package_info_plus.dart';

class UpdateService {
  static String? _latestDownloadUrl;

  Future<bool> checkForUpdates() async {
    try {
      final response = await http.get(Uri.parse(AppStrings.updateCheckUrl));
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final int latestBuild = data['build_number'] ?? 0;
        _latestDownloadUrl = data['download_url'];
        
        final packageInfo = await PackageInfo.fromPlatform();
        final int currentBuild = int.tryParse(packageInfo.buildNumber) ?? 0;

        return latestBuild > currentBuild;
      }
    } catch (e) {
      print('Error checking for updates: $e');
    }
    return false;
  }

  Future<void> triggerUpdate() async {
    final String urlStr = _latestDownloadUrl ?? AppStrings.appDownloadUrl;
    final Uri url = Uri.parse(urlStr);
    if (await canLaunchUrl(url)) {
      await launchUrl(url, mode: LaunchMode.externalApplication);
    }
  }
}
