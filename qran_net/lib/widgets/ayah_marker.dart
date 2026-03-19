import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AyahMarker extends StatelessWidget {
  final String ayahNumber;
  final double size;
  const AyahMarker({super.key, required this.ayahNumber, this.size = 24.0});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 4),
      child: Stack(
        alignment: Alignment.center,
        children: [
          CustomPaint(
            size: Size(size, size),
            painter: AyahMarkerPainter(),
          ),
          Text(
            ayahNumber,
            style: GoogleFonts.amiri(
              fontSize: size * 0.35, // Scaled to fit 3 digits (approx 9 for size 26)
              fontWeight: FontWeight.bold,
              color: Colors.black,
            ),
          ),
        ],
      ),
    );
  }
}

class AyahMarkerPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0xFFD4AF37)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.0;

    final fillPaint = Paint()
      ..color = const Color(0xFFD4AF37).withValues(alpha: 0.15)
      ..style = PaintingStyle.fill;

    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2.8;

    // Background circle fill
    canvas.drawCircle(center, radius, fillPaint);
    canvas.drawCircle(center, radius, paint);

    // 8-point star/flower
    final Path path = Path();
    for (int i = 0; i < 16; i++) {
      final double angle = (i * 22.5) * math.pi / 180;
      final double r = (i % 2 == 0) ? radius + 5 : radius + 1;
      final double x = center.dx + r * math.cos(angle);
      final double y = center.dy + r * math.sin(angle);
      if (i == 0) {
        path.moveTo(x, y);
      } else {
        path.lineTo(x, y);
      }
    }
    path.close();
    canvas.drawPath(path, paint);
    
    // Inner dots or small circles at peaks
    final dotPaint = Paint()
      ..color = Colors.black
      ..style = PaintingStyle.fill;
    
    for (int i = 0; i < 8; i++) {
        final double angle = (i * 45) * math.pi / 180;
        final double r = radius + 4;
        canvas.drawCircle(
            Offset(center.dx + r * math.cos(angle), center.dy + r * math.sin(angle)),
            0.8,
            dotPaint
        );
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
