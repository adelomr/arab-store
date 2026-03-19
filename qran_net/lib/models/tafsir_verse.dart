class TafsirVerse {
  final int numberInSurah;
  final String text;
  final String tafsir;

  TafsirVerse({
    required this.numberInSurah,
    required this.text,
    required this.tafsir,
  });

  factory TafsirVerse.fromJsons(Map<String, dynamic> verseJson, Map<String, dynamic> tafsirJson) {
    return TafsirVerse(
      numberInSurah: verseJson['numberInSurah'],
      text: verseJson['text'],
      tafsir: tafsirJson['text'],
    );
  }
}
