import 'package:flutter/material.dart';

class AppColors {
  static const Color primary = Color(0xFF3E2723); // Darker Wood Brown
  static const Color accent = Color(0xFFD4AF37); // Gold
  static const Color background = Color(0xFF1B1008); // Dark Coffee Brown
  static const Color surface = Color(0xFF2D1B0D); // Coffee surface
  static const Color textPrimary = Colors.white;
  static const Color textSecondary = Colors.white70;

  static const LinearGradient woodGradient = LinearGradient(
    colors: [
      Color(0xFF1B1008),
      Color(0xFF2D1B0D),
      Color(0xFF1B1008),
      Color(0xFF24150B),
    ],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    stops: [0.0, 0.4, 0.6, 1.0],
  );

  static const LinearGradient cardGradient = LinearGradient(
    colors: [Color(0xFF3E2723), Color(0xFF2D1B0D)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient blackGradient = LinearGradient(
    colors: [
      Color(0xFF000000),
      Color(0xFF121212),
      Color(0xFF000000),
      Color(0xFF080808),
    ],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    stops: [0.0, 0.4, 0.6, 1.0],
  );

  static const LinearGradient greenGradient = LinearGradient(
    colors: [
      Color(0xFF041E15), // Deepest Emerald
      Color(0xFF0A3324), // Forest Emerald
      Color(0xFF041E15), // Deepest Emerald
      Color(0xFF02160E), // Ultra Dark Forest
    ],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    stops: [0.0, 0.4, 0.6, 1.0],
  );

  static const LinearGradient tealGradient = LinearGradient(
    colors: [
      Color(0xFF002B36), // Deep Navy Teal
      Color(0xFF073642), // Dark Slate Teal
      Color(0xFF002B36), // Deep Navy Teal
      Color(0xFF001F26), // Even Darker Navy
    ],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    stops: [0.0, 0.4, 0.6, 1.0],
  );

  static const Color glassColor = Color(0x1FFFFFFF);
  static const LinearGradient glassGradient = LinearGradient(
    colors: [
      Color(0x33FFFFFF),
      Color(0x0AFFFFFF),
    ],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
}

