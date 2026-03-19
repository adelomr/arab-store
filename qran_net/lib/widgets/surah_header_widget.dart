import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';

class SurahHeaderWidget extends StatelessWidget {
  final String surahName;
  final int surahNumber;
  final String revelationType; // Meccan / Medinan
  final int ayahCount;
  final int revelationOrder;

  const SurahHeaderWidget({
    super.key,
    required this.surahName,
    required this.surahNumber,
    required this.revelationType,
    required this.ayahCount,
    required this.revelationOrder,
  });

  @override
  Widget build(BuildContext context) {
    final ApiService apiService = ApiService();
    String typeText = revelationType == "Meccan" ? "مكية" : "مدنية";
    
    String afterSurahText = "";
    if (revelationOrder > 1) {
      final prevSurah = apiService.getSurahByRevelationOrder(revelationOrder - 1);
      if (prevSurah != null) {
        afterSurahText = "نزلت بعد ${prevSurah.name}";
      }
    }

    return Container(
      width: double.infinity,
      margin: const EdgeInsets.symmetric(vertical: 8, horizontal: 0),
      child: CustomPaint(
        painter: SurahHeaderPainter(),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          child: Column(
            children: [
              Text(
                surahName,
                style: TextStyle(
                  fontFamily: GoogleFonts.amiri().fontFamily,
                  fontSize: 18,
                  color: Colors.black,
                ),
              ),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  _infoItem(typeText),
                  _divider(),
                  _infoItem("آياتها $ayahCount"),
                  if (afterSurahText.isNotEmpty) ...[
                    _divider(),
                    _infoItem(afterSurahText),
                  ],
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _infoItem(String text) {
    return Text(
      text,
      style: TextStyle(
        fontFamily: GoogleFonts.amiri().fontFamily,
        fontSize: 14,
        color: Colors.black, // Removed opacity for better clarity in Uthmanic
      ),
    );
  }

  Widget _divider() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 8),
      width: 4,
      height: 4,
      decoration: const BoxDecoration(
        color: Color(0xFFD4AF37),
        shape: BoxShape.circle,
      ),
    );
  }
}

class SurahHeaderPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0xFFD4AF37)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.0;

    final rect = Rect.fromLTWH(0, 0, size.width, size.height);
    final RRect rrect = RRect.fromRectAndRadius(rect, const Radius.circular(12));

    // Outer border
    canvas.drawRRect(rrect, paint);

    // Inner ornate lines
    final innerPaint = Paint()
      ..color = const Color(0xFFD4AF37).withValues(alpha: 0.5)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.0;

    canvas.drawRRect(
      RRect.fromRectAndRadius(
        rect.deflate(4),
        const Radius.circular(8),
      ),
      innerPaint,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
