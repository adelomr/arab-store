import '../models/reciter.dart';

class TvQuranService {
  // Static list of verified reciters from TVQuran
  final List<Reciter> _verifiedReciters = [
    Reciter(
      id: 3,
      name: "أحمد العجمي",
      letter: "أ",
      moshafs: [
        Moshaf(
          id: 1,
          name: "حفص عن عاصم",
          server: "https://download.tvquran.com/download/TvQuran.com__Al-Ajmy",
          surahList: _generateSurahList(1, 114),
          surahTotal: 114,
          moshafType: 1,
        ),
      ],
    ),
    Reciter(
      id: 32,
      name: "أبو بكر الشاطري",
      letter: "أ",
      moshafs: [
        Moshaf(
          id: 2,
          name: "حفص عن عاصم",
          server: "https://download.tvquran.com/download/TvQuran.com__Shatri",
          surahList: _generateSurahList(1, 114),
          surahTotal: 114,
          moshafType: 1,
        ),
      ],
    ),
    Reciter(
      id: 9,
      name: "إدريس أبكر",
      letter: "إ",
      moshafs: [
        Moshaf(
          id: 3,
          name: "حفص عن عاصم",
          server: "https://download.tvquran.com/download/TvQuran.com__Abkar",
          surahList: _generateSurahList(1, 114),
          surahTotal: 114,
          moshafType: 1,
        ),
      ],
    ),
    Reciter(
      id: 98,
      name: "عبدالرحمن السديس",
      letter: "ع",
      moshafs: [
        Moshaf(
          id: 4,
          name: "حفص عن عاصم",
          server:
              "https://download.tvquran.com/download/TvQuran.com__Al-Sudais",
          surahList: _generateSurahList(1, 114),
          surahTotal: 114,
          moshafType: 1,
        ),
      ],
    ),
    Reciter(
      id: 104,
      name: "سعود الشريم",
      letter: "س",
      moshafs: [
        Moshaf(
          id: 5,
          name: "حفص عن عاصم",
          server:
              "https://download.tvquran.com/download/TvQuran.com__Al-Shuraim",
          surahList: _generateSurahList(1, 114),
          surahTotal: 114,
          moshafType: 1,
        ),
      ],
    ),
    Reciter(
      id: 79,
      name: "ماهر المعيقلي",
      letter: "م",
      moshafs: [
        Moshaf(
          id: 6,
          name: "حفص عن عاصم",
          server: "https://download.tvquran.com/download/TvQuran.com__Maher",
          surahList: _generateSurahList(1, 114),
          surahTotal: 114,
          moshafType: 1,
        ),
      ],
    ),
  ];

  Future<List<Reciter>> fetchReciters() async {
    // Simulate network delay for better UX (optional)
    await Future.delayed(Duration(milliseconds: 500));

    // Sort alphabetically
    _verifiedReciters.sort((a, b) => a.name.compareTo(b.name));

    return _verifiedReciters;
  }

  static String _generateSurahList(int start, int end) {
    return List.generate(
      end - start + 1,
      (i) => "${start + i}",
    ).join(',');
  }
}
