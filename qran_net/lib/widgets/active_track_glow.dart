import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/settings_provider.dart';
import '../constants/colors.dart';

class ActiveTrackGlow extends StatefulWidget {
  final Widget child;
  final bool isActive;
  final double borderRadius;
  final bool useScale;

  const ActiveTrackGlow({
    super.key,
    required this.child,
    required this.isActive,
    this.borderRadius = 16,
    this.useScale = false,
  });

  @override
  State<ActiveTrackGlow> createState() => _ActiveTrackGlowState();
}

class _ActiveTrackGlowState extends State<ActiveTrackGlow>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    );
    _animation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );

    if (widget.isActive) {
      _controller.repeat(reverse: true);
    }
  }

  @override
  void didUpdateWidget(ActiveTrackGlow oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.isActive != oldWidget.isActive) {
      if (widget.isActive) {
        _controller.repeat(reverse: true);
      } else {
        _controller.stop();
        _controller.reset();
      }
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!widget.isActive) return widget.child;

    final lowEndDevice = context.watch<SettingsProvider>().lowEndDeviceEnabled;

    if (lowEndDevice) {
      return Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(widget.borderRadius),
          border: Border.all(
            color: AppColors.accent,
            width: 2.0,
          ),
        ),
        child: widget.child,
      );
    }

    return AnimatedBuilder(
      animation: _animation,
      builder: (context, child) {
        Widget content = child!;
        
        if (widget.useScale) {
          content = Transform.scale(
            scale: 1.0 + (0.1 * _animation.value), // Subtle pulse
            child: content,
          );
        }

        return Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(widget.borderRadius),
            boxShadow: [
              BoxShadow(
                color: AppColors.accent.withValues(alpha: 0.15 + (0.15 * _animation.value)), // Much subtler
                blurRadius: 10 + (10 * _animation.value), 
                spreadRadius: 1 + (2 * _animation.value), 
              ),
            ],
            // Subtler pulsing border
            border: Border.all(
              color: AppColors.accent.withValues(alpha: 0.05 + (0.15 * _animation.value)),
              width: 1.0,
            ),
          ),
          child: content,
        );
      },
      child: widget.child,
    );
  }
}
