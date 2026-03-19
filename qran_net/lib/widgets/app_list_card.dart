import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/settings_provider.dart';
import '../constants/colors.dart';
import 'active_track_glow.dart';



class AppListCard extends StatelessWidget {
  final Widget? leading;
  final Widget title;
  final Widget? subtitle;
  final Widget? trailing;
  final VoidCallback? onTap;
  final bool isActive;
  final bool isActiveGlow;

  const AppListCard({
    super.key,
    this.leading,
    required this.title,
    this.subtitle,
    this.trailing,
    this.onTap,
    this.isActive = false,
    this.isActiveGlow = false,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: ActiveTrackGlow(
        isActive: isActiveGlow,
        borderRadius: 16,
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            gradient: AppColors.glassGradient,
            border: Border.all(
               color: isActive ? AppColors.accent : Colors.white.withValues(alpha: 0.2),
               width: isActive ? 2.0 : 1.5,
            ),
            boxShadow: context.watch<SettingsProvider>().lowEndDeviceEnabled ? null : [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.1),
                blurRadius: 4, // Reduced blur radius for shadow too
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: ListTile(
            contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
            leading: leading != null 
              ? ActiveTrackGlow(
                  isActive: isActiveGlow,
                  useScale: true,
                  borderRadius: 30, // For circles/icons
                  child: leading!,
                )
              : null,
            title: DefaultTextStyle(
              style: TextStyle(
                color: isActive ? AppColors.accent : Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
              child: title,
            ),
            subtitle: subtitle != null
                ? DefaultTextStyle(
                    style: const TextStyle(
                      color: Colors.white70,
                      fontSize: 14,
                    ),
                    child: subtitle!,
                  )
                : null,
            trailing: trailing,
            onTap: onTap,
          ),
        ),
      ),
    );
  }
}
