import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/settings_provider.dart';
import 'active_track_glow.dart';

class GlassContainer extends StatelessWidget {
  final Widget child;
  final double borderRadius;
  final double blur;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final BoxBorder? border;
  final bool isActiveGlow;

  const GlassContainer({
    super.key,
    required this.child,
    this.borderRadius = 16,
    this.blur = 10,
    this.padding,
    this.margin,
    this.border,
    this.isActiveGlow = false,
  });

  @override
  Widget build(BuildContext context) {
    final lowEndDevice = context.watch<SettingsProvider>().lowEndDeviceEnabled;

    if (lowEndDevice) {
       return Container(
        margin: margin,
        padding: padding,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(borderRadius),
          color: Colors.white.withValues(alpha: 0.1),
          border: border ?? Border.all(
            color: Colors.white.withValues(alpha: 0.2),
            width: 1.0,
          ),
        ),
        child: child,
      );
    }

    return ActiveTrackGlow(
      isActive: isActiveGlow,
      borderRadius: borderRadius,
      child: Container(
        margin: margin,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(borderRadius),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.1),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Container(
          padding: padding,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(borderRadius),
            color: Colors.white.withValues(alpha: 0.05), // Simple semi-transparent background
            border: border ?? Border.all(
              color: Colors.white.withValues(alpha: 0.1),
              width: 1.0,
            ),
          ),
          child: ActiveTrackGlow(
            isActive: isActiveGlow,
            useScale: true,
            borderRadius: borderRadius,
            child: child,
          ),
        ),
      ),
    );
  }
}
