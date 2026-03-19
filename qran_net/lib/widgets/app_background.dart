import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/settings_provider.dart';
import '../constants/colors.dart';

class AppBackground extends StatelessWidget {
  final Widget child;

  const AppBackground({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return Consumer<SettingsProvider>(
      builder: (context, settings, _) {
        Decoration decoration;
        
        switch (settings.backgroundType) {
          case 'black':
            decoration = const BoxDecoration(
              gradient: AppColors.blackGradient,
            );
            break;
          case 'green':
            decoration = const BoxDecoration(
              gradient: AppColors.greenGradient,
            );
            break;
          case 'blue':
          case 'teal':
            decoration = const BoxDecoration(
              gradient: AppColors.tealGradient,
            );
            break;
          case 'wood':
          default:
            decoration = const BoxDecoration(
              gradient: AppColors.woodGradient,
            );
            break;
        }

        return Container(
          decoration: decoration,
          child: child,
        );
      },
    );
  }
}
