class MushafData {
  static const Map<int, int> surahStartPages = {
    1: 1,      // Al-Fatihah
    2: 2,      // Al-Baqarah
    3: 50,     // Al-Imran
    4: 77,     // An-Nisa
    5: 106,    // Al-Ma'idah
    6: 128,    // Al-An'am
    7: 151,    // Al-A'raf
    8: 177,    // Al-Anfal
    9: 187,    // At-Tawbah
    10: 208,   // Yunus
    11: 221,   // Hud
    12: 235,   // Yusuf
    13: 249,   // Ar-Ra'd
    14: 255,   // Ibrahim
    15: 262,   // Al-Hijr
    16: 267,   // An-Nahl
    17: 282,   // Al-Isra
    18: 293,   // Al-Kahf
    19: 305,   // Maryam
    20: 312,   // Ta-Ha
    21: 322,   // Al-Anbiya
    22: 332,   // Al-Hajj
    23: 342,   // Al-Mu'minun
    24: 350,   // An-Nur
    25: 359,   // Al-Furqan
    26: 367,   // Ash-Shu'ara
    27: 377,   // An-Naml
    28: 385,   // Al-Qasas
    29: 396,   // Al-Ankabut
    30: 404,   // Ar-Rum
    31: 411,   // Luqman
    32: 415,   // As-Sajdah
    33: 418,   // Al-Ahzab
    34: 428,   // Saba
    35: 434,   // Fatir
    36: 440,   // Ya-Sin
    37: 446,   // As-Saffat
    38: 453,   // Sad
    39: 458,   // Az-Zumar
    40: 467,   // Ghafir
    41: 477,   // Fussilat
    42: 483,   // Ash-Shura
    43: 489,   // Az-Zukhruf
    44: 496,   // Ad-Dukhan
    45: 499,   // Al-Jathiyah
    46: 502,   // Al-Ahqaf
    47: 507,   // Muhammad
    48: 511,   // Al-Fath
    49: 515,   // Al-Hujurat
    50: 518,   // Qaf
    51: 520,   // Adh-Dhariyat
    52: 523,   // At-Tur
    53: 526,   // An-Najm
    54: 528,   // Al-Qamar
    55: 531,   // Ar-Rahman
    56: 534,   // Al-Waqi'ah
    57: 537,   // Al-Hadid
    58: 542,   // Al-Mujadila
    59: 545,   // Al-Hashr
    60: 549,   // Al-Mumtahanah
    61: 551,   // As-Saff
    62: 553,   // Al-Jumu'ah
    63: 554,   // Al-Munafiqun
    64: 556,   // At-Taghabun
    65: 558,   // At-Talaq
    66: 560,   // At-Tahrim
    67: 562,   // Al-Mulk
    68: 564,   // Al-Qalam
    69: 566,   // Al-Haqqah
    70: 568,   // Al-Ma'arij
    71: 570,   // Nuh
    72: 572,   // Al-Jinn
    73: 574,   // Al-Muzzammil
    74: 575,   // Al-Muddaththir
    75: 577,   // Al-Qiyamah
    76: 578,   // Al-Insan
    77: 580,   // Al-Mursalat
    78: 582,   // An-Naba
    79: 583,   // An-Nazi'at
    80: 585,   // 'Abasa
    81: 586,   // At-Takwir
    82: 587,   // Al-Infitar
    83: 587,   // Al-Mutaffifin
    84: 589,   // Al-Inshiqaq
    85: 590,   // Al-Buruj
    86: 591,   // At-Tariq
    87: 591,   // Al-A'la
    88: 592,   // Al-Ghashiyah
    89: 593,   // Al-Fajr
    90: 594,   // Al-Balad
    91: 595,   // Ash-Shams
    92: 595,   // Al-Lail
    93: 596,   // Ad-Duha
    94: 596,   // Ash-Sharh
    95: 597,   // At-Tin
    96: 597,   // Al-'Alaq
    97: 598,   // Al-Qadr
    98: 598,   // Al-Bayyinah
    99: 599,   // Az-Zalzalah
    100: 599,  // Al-'Adiyat
    101: 600,  // Al-Qari'ah
    102: 600,  // At-Takathur
    103: 601,  // Al-'Asr
    104: 601,  // Al-Humazah
    105: 601,  // Al-Fil
    106: 602,  // Quraish
    107: 602,  // Al-Ma'un
    108: 602,  // Al-Kawthar
    109: 603,  // Al-Kafirun
    110: 603,  // An-Nasr
    111: 603,  // Al-Masad
    114: 604,  // Al-Ikhlas
    115: 604,  // Al-Falaq
    116: 604,  // An-Nas
  };

  static const Map<int, int> juzStartPages = {
    1: 1, 2: 22, 3: 42, 4: 62, 5: 82, 6: 102, 7: 122, 8: 142, 9: 162, 10: 182,
    11: 202, 12: 222, 13: 242, 14: 262, 15: 282, 16: 302, 17: 322, 18: 342, 19: 362, 20: 382,
    21: 402, 22: 422, 23: 442, 24: 462, 25: 482, 26: 502, 27: 522, 28: 542, 29: 562, 30: 582,
  };

  static const List<String> juzNamesArabic = [
    "الأول", "الثاني", "الثالث", "الرابع", "الخامس", "السادس", "السابع", "الثامن", "التاسع", "العاشر",
    "الحادي عشر", "الثاني عشر", "الثالث عشر", "الرابع عشر", "الخامس عشر", "السادس عشر", "السابع عشر", "الثامن عشر", "التاسع عشر", "العشرون",
    "الحادي والعشرون", "الثاني والعشرون", "الثالث والعشرون", "الرابع والعشرون", "الخامس والعشرون", "السادس والعشرون", "السابع والعشرون", "الثامن والعشرون", "التاسع والعشرون", "الثلاثون"
  ];

  static String getJuzName(int pageNumber) {
    int juz = 30;
    for (int i = 1; i <= 30; i++) {
      if (juzStartPages[i]! > pageNumber) {
        juz = i - 1;
        break;
      }
    }
    return "الجزء ${juzNamesArabic[juz - 1]}";
  }

  static String getSurahNameByPage(int pageNumber, List<dynamic> surahs) {
    int surahNumber = 114;
    for (int i = 1; i <= 114; i++) {
      if (surahStartPages[i]! > pageNumber) {
        surahNumber = i - 1;
        break;
      }
    }
    // Find surah name from the list
    try {
      return surahs.firstWhere((s) => s.number == surahNumber).name;
    } catch (e) {
      return "";
    }
  }
}
