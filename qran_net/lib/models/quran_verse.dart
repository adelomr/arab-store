class QuranVerse {
  final int number;
  final String text;
  final int numberInSurah;
  final int surahNumber;
  final String surahName;
  final int juz;
  final int manzil;
  final int page;
  final int ruku;
  final int hizbQuarter;

  QuranVerse({
    required this.number,
    required this.text,
    required this.numberInSurah,
    required this.surahNumber,
    required this.surahName,
    required this.juz,
    required this.manzil,
    required this.page,
    required this.ruku,
    required this.hizbQuarter,
  });

  factory QuranVerse.fromJson(Map<String, dynamic> json) {
    // When fetching by page, the surah info is in a nested 'surah' object
    final surahJson = json['surah'] ?? {};
    return QuranVerse(
      number: json['number'],
      text: json['text'],
      numberInSurah: json['numberInSurah'],
      surahNumber: surahJson['number'] ?? 0,
      surahName: surahJson['name'] ?? '',
      juz: json['juz'],
      manzil: json['manzil'],
      page: json['page'],
      ruku: json['ruku'],
      hizbQuarter: json['hizbQuarter'],
    );
  }
}
