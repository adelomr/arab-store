import '../models/reciter.dart';

class Mp3QuranService {
  final List<Reciter> _recoters = [
    Reciter(
      id: 1,
      name: "ابو بكر الشاطري",
      letter: "أ",
      moshafs: [
        Moshaf(
          id: 1,
          name: "حفص عن عاصم",
          server: "http://server11.mp3quran.net/shatri/",
          surahList: _generateSurahList(1, 114),
          surahTotal: 114, moshafType: 1,
        ),
      ],
    ),
    Reciter(
      id: 2,
      name: "أحمد الحذيفي",
      letter: "أ",
      moshafs: [
        Moshaf(
          id: 2,
          name: "حفص عن عاصم",
          server: "http://server8.mp3quran.net/ahmad_huth/",
          surahList: _generateSurahList(1, 114),
          surahTotal: 114, moshafType: 1,
        ),
      ],
    ),
    Reciter(
      id: 3,
      name: "أحمد الحواشي",
      letter: "أ",
      moshafs: [
        Moshaf(
          id: 3,
          name: "حفص عن عاصم",
          server: "http://server11.mp3quran.net/hawashi/",
          surahList: _generateSurahList(1, 114),
          surahTotal: 114, moshafType: 1,
        ),
      ],
    ),
    Reciter(
      id: 4,
      name: "أحمد الطرابلسي",
      letter: "أ",
      moshafs: [
        Moshaf(
          id: 4,
          name: "حفص عن عاصم",
          server: "http://server10.mp3quran.net/trabulsi/",
          surahList: _generateSurahList(1, 114),
          surahTotal: 114, moshafType: 1,
        ),
      ],
    ),
    Reciter(
      id: 5,
      name: "أحمد بن علي العجمي",
      letter: "أ",
      moshafs: [
        Moshaf(
          id: 5,
          name: "حفص عن عاصم",
          server: "http://server10.mp3quran.net/ajm/",
          surahList: _generateSurahList(1, 114),
          surahTotal: 114, moshafType: 1,
        ),
      ],
    ),
    Reciter(
      id: 6,
      name: "أحمد خضر الطرابلسي",
      letter: "أ",
      moshafs: [
        Moshaf(
          id: 6,
          name: "حفص عن عاصم",
          server: "http://server10.mp3quran.net/trablsi/",
          surahList: _generateSurahList(1, 114),
          surahTotal: 114, moshafType: 1,
        ),
      ],
    ),
    Reciter(
      id: 7,
      name: "أحمد سعود",
      letter: "أ",
      moshafs: [
        Moshaf(
          id: 7,
          name: "حفص عن عاصم",
          server: "http://server11.mp3quran.net/saud/",
          surahList: _generateSurahList(84, 114),
          surahTotal: 31, moshafType: 1,
        ),
      ],
    ),
    Reciter(
      id: 8,
      name: "أحمد صابر",
      letter: "أ",
      moshafs: [
        Moshaf(
          id: 8,
          name: "حفص عن عاصم",
          server: "http://server8.mp3quran.net/saber/",
          surahList: _generateSurahList(1, 114),
          surahTotal: 114, moshafType: 1,
        ),
      ],
    ),
    Reciter(
      id: 9,
      name: "أحمد عامر",
      letter: "أ",
      moshafs: [
        Moshaf(
          id: 9,
          name: "حفص عن عاصم",
          server: "http://server10.mp3quran.net/Aamer/",
          surahList: _generateSurahList(1, 114),
          surahTotal: 114, moshafType: 1,
        ),
      ],
    ),
    Reciter(
      id: 10,
      name: "أحمد نعينع",
      letter: "أ",
      moshafs: [
        Moshaf(
          id: 10,
          name: "حفص عن عاصم",
          server: "http://server11.mp3quran.net/ahmad_nu/",
          surahList: _generateSurahList(1, 114),
          surahTotal: 114, moshafType: 1,
        ),
      ],
    ),
    Reciter(
      id: 11,
      name: "إبراهيم الأخضر",
      letter: "إ",
      moshafs: [
        Moshaf(
          id: 11,
          name: "حفص عن عاصم",
          server: "http://server6.mp3quran.net/akdr/",
          surahList: _generateSurahList(1, 114),
          surahTotal: 114, moshafType: 1,
        ),
      ],
    ),
    Reciter(
      id: 12,
      name: "إدريس أبكر",
      letter: "إ",
      moshafs: [
        Moshaf(
          id: 12,
          name: "حفص عن عاصم",
          server: "http://server6.mp3quran.net/abkr/",
          surahList: _generateSurahList(1, 114),
          surahTotal: 114, moshafType: 1,
        ),
      ],
    ),
    Reciter(
      id: 13,
      name: "ابراهيم الجبرين",
      letter: "ا",
      moshafs: [
        Moshaf(
          id: 13,
          name: "حفص عن عاصم",
          server: "http://server6.mp3quran.net/jbreen/",
          surahList: _generateSurahList(18, 114),
          surahTotal: 97, moshafType: 1,
        ),
      ],
    ),
    Reciter(
      id: 14,
      name: "ابراهيم الدوسري",
      letter: "ا",
      moshafs: [
        Moshaf(
          id: 14,
          name: "ورش عن نافع",
          server: "http://server10.mp3quran.net/ibrahim_dosri_warsh/",
          surahList: _generateSurahList(1, 114),
          surahTotal: 114, moshafType: 1,
        ),
      ],
    ),
    Reciter(
      id: 15,
      name: "الدوكالي محمد العالم",
      letter: "ا",
      moshafs: [
        Moshaf(
          id: 15,
          name: "قالون عن نافع",
          server: "http://server7.mp3quran.net/dokali/",
          surahList: _generateSurahList(1, 114),
          surahTotal: 114, moshafType: 1,
        ),
      ],
    ),
    Reciter(
      id: 16,
      name: "الزين محمد أحمد",
      letter: "ا",
      moshafs: [
        Moshaf(
          id: 16,
          name: "حفص عن عاصم",
          server: "http://server9.mp3quran.net/alzain/",
          surahList: _generateSurahList(1, 114),
          surahTotal: 114, moshafType: 1,
        ),
      ],
    ),
    Reciter(
      id: 17,
      name: "العيون الكوشي",
      letter: "ا",
      moshafs: [
        Moshaf(
          id: 17,
          name: "ورش عن نافع",
          server: "http://server11.mp3quran.net/koshi/",
          surahList: _generateSurahList(1, 114),
          surahTotal: 114, moshafType: 1,
        ),
      ],
    ),
    Reciter(
      id: 18,
      name: "الفاتح محمد الزبير",
      letter: "ا",
      moshafs: [
        Moshaf(
          id: 18,
          name: "الدوري عن أبي عمرو",
          server: "http://server6.mp3quran.net/fateh/",
          surahList: _generateSurahList(1, 114),
          surahTotal: 114, moshafType: 1,
        ),
      ],
    ),
    Reciter(
      id: 19,
      name: "توفيق الصايغ",
      letter: "ت",
      moshafs: [
        Moshaf(
          id: 19,
          name: "حفص عن عاصم",
          server: "http://server6.mp3quran.net/twfeeq/",
          surahList: _generateSurahList(1, 114),
          surahTotal: 114, moshafType: 1,
        ),
      ],
    ),
    Reciter(
      id: 20,
      name: "جمال شاكر عبدالله",
      letter: "ج",
      moshafs: [
        Moshaf(
          id: 20,
          name: "حفص عن عاصم",
          server: "http://server6.mp3quran.net/jamal/",
          surahList: _generateSurahList(1, 114),
          surahTotal: 114, moshafType: 1,
        ),
      ],
    ),
    Reciter(
      id: 21,
      name: "جمعان العصيمي",
      letter: "ج",
      moshafs: [
        Moshaf(
          id: 21,
          name: "حفص عن عاصم",
          server: "http://server6.mp3quran.net/jaman/",
          surahList: _generateSurahList(1, 114),
          surahTotal: 114, moshafType: 1,
        ),
      ],
    ),
    Reciter(
      id: 22,
      name: "حاتم فريد الواع",
      letter: "ح",
      moshafs: [
        Moshaf(
          id: 22,
          name: "حفص عن عاصم",
          server: "http://server11.mp3quran.net/hatem/",
          surahList: _generateSurahList(1, 114),
          surahTotal: 114, moshafType: 1,
        ),
      ],
    ),
    Reciter(
      id: 23,
      name: "خالد القحطاني",
      letter: "خ",
      moshafs: [
        Moshaf(
          id: 23,
          name: "حفص عن عاصم",
          server: "http://server10.mp3quran.net/qht/",
          surahList: _generateSurahList(1, 114),
          surahTotal: 114, moshafType: 1,
        ),
      ],
    ),
    Reciter(
      id: 24,
      name: "خالد المهنا",
      letter: "خ",
      moshafs: [
        Moshaf(
          id: 24,
          name: "حفص عن عاصم",
          server: "http://server11.mp3quran.net/mohna/",
          surahList: _generateSurahList(1, 114),
          surahTotal: 114, moshafType: 1,
        ),
      ],
    ),
    Reciter(
      id: 25,
      name: "خالد عبدالكافي",
      letter: "خ",
      moshafs: [
        Moshaf(
          id: 25,
          name: "حفص عن عاصم",
          server: "http://server11.mp3quran.net/kafi/",
          surahList: _generateSurahList(1, 114),
          surahTotal: 114, moshafType: 1,
        ),
      ],
    ),
    Reciter(
      id: 26,
      name: "خليفة الطنيجي",
      letter: "خ",
      moshafs: [
        Moshaf(
          id: 26,
          name: "حفص عن عاصم",
          server: "http://server12.mp3quran.net/tnjy/",
          surahList: _generateSurahList(1, 114),
          surahTotal: 114, moshafType: 1,
        ),
      ],
    ),
    Reciter(
      id: 27,
      name: "داود حمزة",
      letter: "د",
      moshafs: [
        Moshaf(
          id: 27,
          name: "خلف عن حمزة",
          server: "http://server9.mp3quran.net/hamza/",
          surahList: _generateSurahList(1, 114),
          surahTotal: 114, moshafType: 1,
        ),
      ],
    ),
    Reciter(
      id: 28,
      name: "زكي داغستاني",
      letter: "ز",
      moshafs: [
        Moshaf(
          id: 28,
          name: "حفص عن عاصم",
          server: "http://server9.mp3quran.net/zaki/",
          surahList: _generateSurahList(1, 114),
          surahTotal: 114, moshafType: 1,
        ),
      ],
    ),
    Reciter(
      id: 29,
      name: "سامي الدوسري",
      letter: "س",
      moshafs: [
        Moshaf(
          id: 29,
          name: "حفص عن عاصم",
          server: "http://server8.mp3quran.net/sami_dosr/",
          surahList: _generateSurahList(28, 114),
          surahTotal: 87, moshafType: 1,
        ),
      ],
    ),
    Reciter(
      id: 30,
      name: "سعد الغامدي",
      letter: "س",
      moshafs: [
        Moshaf(
          id: 30,
          name: "حفص عن عاصم",
          server: "http://server7.mp3quran.net/s_gmd/",
          surahList: _generateSurahList(1, 114),
          surahTotal: 114, moshafType: 1,
        ),
      ],
    ),
    Reciter(
      id: 31,
      name: "سعود الشريم",
      letter: "س",
      moshafs: [
        Moshaf(
          id: 31,
          name: "حفص عن عاصم",
          server: "http://server7.mp3quran.net/shur/",
          surahList: _generateSurahList(1, 114),
          surahTotal: 114, moshafType: 1,
        ),
      ],
    ),
    Reciter(
      id: 32,
      name: "سهل ياسين",
      letter: "س",
      moshafs: [
        Moshaf(
          id: 32,
          name: "حفص عن عاصم",
          server: "http://server6.mp3quran.net/shl/",
          surahList: _generateSurahList(1, 114),
          surahTotal: 114, moshafType: 1,
        ),
      ],
    ),
    Reciter(
      id: 33,
      name: "سيد رمضان",
      letter: "س",
      moshafs: [
        Moshaf(
          id: 33,
          name: "ورش عن نافع",
          server: "http://server12.mp3quran.net/sayed/",
          surahList: _generateSurahList(1, 114),
          surahTotal: 114, moshafType: 1,
        ),
      ],
    ),
    Reciter(
      id: 34,
      name: "شيرزاد عبدالرحمن طاهر",
      letter: "ش",
      moshafs: [
        Moshaf(
          id: 34,
          name: "حفص عن عاصم",
          server: "http://server12.mp3quran.net/taher/",
          surahList: _generateSurahList(1, 114),
          surahTotal: 114, moshafType: 1,
        ),
      ],
    ),
    Reciter(
      id: 35,
      name: "صابر عبدالحكم",
      letter: "ص",
      moshafs: [
        Moshaf(
          id: 35,
          name: "حفص عن عاصم",
          server: "http://server12.mp3quran.net/hkm/",
          surahList: _generateSurahList(1, 114),
          surahTotal: 114, moshafType: 1,
        ),
      ],
    ),
    Reciter(
      id: 36,
      name: "صالح الصاهود",
      letter: "ص",
      moshafs: [
        Moshaf(
          id: 36,
          name: "حفص عن عاصم",
          server: "http://server8.mp3quran.net/sahood/",
          surahList: _generateSurahList(1, 114),
          surahTotal: 114, moshafType: 1,
        ),
      ],
    ),
    Reciter(
      id: 37,
      name: "صلاح البدير",
      letter: "ص",
      moshafs: [
        Moshaf(
          id: 37,
          name: "حفص عن عاصم",
          server: "http://server6.mp3quran.net/s_bud/",
          surahList: _generateSurahList(1, 114),
          surahTotal: 114, moshafType: 1,
        ),
      ],
    ),
    Reciter(
      id: 38,
      name: "صلاح الهاشم",
      letter: "ص",
      moshafs: [
        Moshaf(
          id: 38,
          name: "حفص عن عاصم",
          server: "http://server12.mp3quran.net/salah_hashim_m/",
          surahList: _generateSurahList(1, 114),
          surahTotal: 114, moshafType: 1,
        ),
      ],
    ),
    Reciter(
      id: 39,
      name: "صلاح بو خاطر",
      letter: "ص",
      moshafs: [
        Moshaf(
          id: 39,
          name: "حفص عن عاصم",
          server: "http://server8.mp3quran.net/bu_khtr/",
          surahList: _generateSurahList(1, 114),
          surahTotal: 114, moshafType: 1,
        ),
      ],
    ),
    Reciter(
      id: 40,
      name: "طارق عبدالغني دعوب",
      letter: "ط",
      moshafs: [
        Moshaf(
          id: 40,
          name: "قالون عن نافع",
          server: "http://server10.mp3quran.net/tareq/",
          surahList: _generateSurahList(1, 114),
          surahTotal: 114, moshafType: 1,
        ),
      ],
    ),
    Reciter(
      id: 41,
      name: "عادل الكلباني",
      letter: "ع",
      moshafs: [
        Moshaf(
          id: 41,
          name: "حفص عن عاصم",
          server: "http://server8.mp3quran.net/a_klb/",
          surahList: _generateSurahList(1, 114),
          surahTotal: 114, moshafType: 1,
        ),
      ],
    ),
    Reciter(
      id: 42,
      name: "عادل ريان",
      letter: "ع",
      moshafs: [
        Moshaf(
          id: 42,
          name: "حفص عن عاصم",
          server: "http://server8.mp3quran.net/ryan/",
          surahList: _generateSurahList(1, 114),
          surahTotal: 114, moshafType: 1,
        ),
      ],
    ),
    Reciter(
      id: 43,
      name: "عبدالبارئ الثبيتي",
      letter: "ع",
      moshafs: [
        Moshaf(
          id: 43,
          name: "حفص عن عاصم",
          server: "http://server6.mp3quran.net/thubti/",
          surahList: _generateSurahList(1, 114),
          surahTotal: 114, moshafType: 1,
        ),
      ],
    ),
    Reciter(
      id: 44,
      name: "عبدالبارئ محمد",
      letter: "ع",
      moshafs: [
        Moshaf(
          id: 44,
          name: "حفص عن عاصم",
          server: "http://server12.mp3quran.net/bari/",
          surahList: _generateSurahList(1, 114),
          surahTotal: 114, moshafType: 1,
        ),
      ],
    ),
    Reciter(
      id: 45,
      name: "عبدالباسط عبدالصمد [حفص]",
      letter: "ع",
      moshafs: [
        Moshaf(
          id: 45,
          name: "حفص عن عاصم",
          server: "http://server7.mp3quran.net/basit/",
          surahList: _generateSurahList(1, 114),
          surahTotal: 114, moshafType: 1,
        ),
      ],
    ),
    Reciter(
      id: 46,
      name: "عبدالباسط عبدالصمد [ورش]",
      letter: "ع",
      moshafs: [
        Moshaf(
          id: 46,
          name: "ورش عن نافع",
          server: "http://server10.mp3quran.net/basit_warsh/",
          surahList: _generateSurahList(1, 114),
          surahTotal: 114, moshafType: 1,
        ),
      ],
    ),
    Reciter(
      id: 47,
      name: "عبدالباسط عبدالصمد [مجود]",
      letter: "ع",
      moshafs: [
        Moshaf(
          id: 47,
          name: "المصحف المجود",
          server: "http://server13.mp3quran.net/basit_mjwd/",
          surahList: _generateSurahList(1, 114),
          surahTotal: 114, moshafType: 1,
        ),
      ],
    ),
    Reciter(
      id: 48,
      name: "عبدالرحمن السديس",
      letter: "ع",
      moshafs: [
        Moshaf(
          id: 48,
          name: "حفص عن عاصم",
          server: "http://server11.mp3quran.net/sds/",
          surahList: _generateSurahList(1, 114),
          surahTotal: 114, moshafType: 1,
        ),
      ],
    ),
    Reciter(
      id: 49,
      name: "عبدالرشيد صوفي",
      letter: "ع",
      moshafs: [
        Moshaf(
          id: 49,
          name: "خلف عن حمزة",
          server: "http://server9.mp3quran.net/soufi_klf/",
          surahList: _generateSurahList(1, 114),
          surahTotal: 114, moshafType: 1,
        ),
      ],
    ),
    Reciter(
      id: 50,
      name: "عبدالعزيز الأحمد",
      letter: "ع",
      moshafs: [
        Moshaf(
          id: 50,
          name: "حفص عن عاصم",
          server: "http://server11.mp3quran.net/a_ahmed/",
          surahList: _generateSurahList(1, 114),
          surahTotal: 114, moshafType: 1,
        ),
      ],
    ),
    Reciter(
      id: 51,
      name: "عبدالله البريمي",
      letter: "ع",
      moshafs: [
        Moshaf(
          id: 51,
          name: "حفص عن عاصم",
          server: "http://server8.mp3quran.net/brmi/",
          surahList: _generateSurahList(48, 114),
          surahTotal: 67, moshafType: 1,
        ),
      ],
    ),
    Reciter(
      id: 52,
      name: "عبدالله الكندري",
      letter: "ع",
      moshafs: [
        Moshaf(
          id: 52,
          name: "حفص عن عاصم",
          server: "http://server10.mp3quran.net/Abdullahk/",
          surahList: _generateSurahList(1, 114),
          surahTotal: 114, moshafType: 1,
        ),
      ],
    ),
    Reciter(
      id: 53,
      name: "عبدالله المطرود",
      letter: "ع",
      moshafs: [
        Moshaf(
          id: 53,
          name: "حفص عن عاصم",
          server: "http://server8.mp3quran.net/mtrod/",
          surahList: _generateSurahList(1, 114),
          surahTotal: 114, moshafType: 1,
        ),
      ],
    ),
    Reciter(
      id: 54,
      name: "عبدالله بصفر",
      letter: "ع",
      moshafs: [
        Moshaf(
          id: 54,
          name: "حفص عن عاصم",
          server: "http://server6.mp3quran.net/bsfr/",
          surahList: _generateSurahList(1, 114),
          surahTotal: 114, moshafType: 1,
        ),
      ],
    ),
    Reciter(
      id: 55,
      name: "عبدالله خياط",
      letter: "ع",
      moshafs: [
        Moshaf(
          id: 55,
          name: "حفص عن عاصم",
          server: "http://server12.mp3quran.net/kyat/",
          surahList: _generateSurahList(1, 114),
          surahTotal: 114, moshafType: 1,
        ),
      ],
    ),
    Reciter(
      id: 56,
      name: "عبدالله عواد الجهني",
      letter: "ع",
      moshafs: [
        Moshaf(
          id: 56,
          name: "حفص عن عاصم",
          server: "http://server13.mp3quran.net/jhn/",
          surahList: _generateSurahList(1, 114),
          surahTotal: 114, moshafType: 1,
        ),
      ],
    ),
    Reciter(
      id: 57,
      name: "عبدالمحسن الحارثي",
      letter: "ع",
      moshafs: [
        Moshaf(
          id: 57,
          name: "حفص عن عاصم",
          server: "http://server6.mp3quran.net/mohsin_harthi/",
          surahList: _generateSurahList(1, 114),
          surahTotal: 114, moshafType: 1,
        ),
      ],
    ),
    Reciter(
      id: 58,
      name: "عبدالمحسن العبيكان",
      letter: "ع",
      moshafs: [
        Moshaf(
          id: 58,
          name: "حفص عن عاصم",
          server: "http://server12.mp3quran.net/obk/",
          surahList: _generateSurahList(1, 114),
          surahTotal: 114, moshafType: 1,
        ),
      ],
    ),
    Reciter(
      id: 59,
      name: "عبدالمحسن القاسم",
      letter: "ع",
      moshafs: [
        Moshaf(
          id: 59,
          name: "حفص عن عاصم",
          server: "http://server8.mp3quran.net/qasm/",
          surahList: _generateSurahList(1, 114),
          surahTotal: 114, moshafType: 1,
        ),
      ],
    ),
    Reciter(
      id: 60,
      name: "عبدالهادي أحمد كناكري",
      letter: "ع",
      moshafs: [
        Moshaf(
          id: 60,
          name: "حفص عن عاصم",
          server: "http://server6.mp3quran.net/kanakeri/",
          surahList: _generateSurahList(1, 114),
          surahTotal: 114, moshafType: 1,
        ),
      ],
    ),
    Reciter(
      id: 61,
      name: "عبدالودود حنيف",
      letter: "ع",
      moshafs: [
        Moshaf(
          id: 61,
          name: "حفص عن عاصم",
          server: "http://server8.mp3quran.net/wdod/",
          surahList: _generateSurahList(1, 114),
          surahTotal: 114, moshafType: 1,
        ),
      ],
    ),
    Reciter(
      id: 62,
      name: "علي أبو هاشم",
      letter: "ع",
      moshafs: [
        Moshaf(
          id: 62,
          name: "حفص عن عاصم",
          server: "http://server9.mp3quran.net/abo_hashim/",
          surahList: _generateSurahList(49, 58),
          surahTotal: 10, moshafType: 1,
        ),
      ],
    ),
    Reciter(
      id: 63,
      name: "علي الحذيفي",
      letter: "ع",
      moshafs: [
        Moshaf(
          id: 63,
          name: "قالون عن نافع",
          server: "http://server9.mp3quran.net/huthifi_qalon/",
          surahList: _generateSurahList(1, 114),
          surahTotal: 114, moshafType: 1,
        ),
      ],
    ),
    Reciter(
      id: 64,
      name: "علي جابر",
      letter: "ع",
      moshafs: [
        Moshaf(
          id: 64,
          name: "حفص عن عاصم",
          server: "http://server11.mp3quran.net/a_jbr/",
          surahList: _generateSurahList(1, 114),
          surahTotal: 114, moshafType: 1,
        ),
      ],
    ),
    Reciter(
      id: 65,
      name: "علي حجاج السويسي",
      letter: "ع",
      moshafs: [
        Moshaf(
          id: 65,
          name: "حفص عن عاصم",
          server: "http://server9.mp3quran.net/hajjaj/",
          surahList: _generateSurahList(1, 114),
          surahTotal: 114, moshafType: 1,
        ),
      ],
    ),
    Reciter(
      id: 66,
      name: "عماد زهير حافظ",
      letter: "ع",
      moshafs: [
        Moshaf(
          id: 66,
          name: "حفص عن عاصم",
          server: "http://server6.mp3quran.net/hafz/",
          surahList: _generateSurahList(1, 114),
          surahTotal: 114, moshafType: 1,
        ),
      ],
    ),
    Reciter(
      id: 67,
      name: "فارس عباد",
      letter: "ف",
      moshafs: [
        Moshaf(
          id: 67,
          name: "حفص عن عاصم",
          server: "http://server8.mp3quran.net/frs_a/",
          surahList: _generateSurahList(1, 114),
          surahTotal: 114, moshafType: 1,
        ),
      ],
    ),
    Reciter(
      id: 68,
      name: "لافي العوني",
      letter: "ل",
      moshafs: [
        Moshaf(
          id: 68,
          name: "حفص عن عاصم",
          server: "http://server6.mp3quran.net/lafi/",
          surahList: _generateSurahList(29, 114),
          surahTotal: 86, moshafType: 1,
        ),
      ],
    ),
    Reciter(
      id: 69,
      name: "ماجد الزامل",
      letter: "م",
      moshafs: [
        Moshaf(
          id: 69,
          name: "حفص عن عاصم",
          server: "http://server9.mp3quran.net/zaml/",
          surahList: _generateSurahList(12, 114),
          surahTotal: 103, moshafType: 1,
        ),
      ],
    ),
    Reciter(
      id: 70,
      name: "ماهر المعيقلي",
      letter: "م",
      moshafs: [
        Moshaf(
          id: 70,
          name: "حفص عن عاصم",
          server: "http://server12.mp3quran.net/maher/",
          surahList: _generateSurahList(1, 114),
          surahTotal: 114, moshafType: 1,
        ),
      ],
    ),
    Reciter(
      id: 71,
      name: "ماهر شخاشير",
      letter: "م",
      moshafs: [
        Moshaf(
          id: 71,
          name: "حفص عن عاصم",
          server: "http://server10.mp3quran.net/shaksh/",
          surahList: _generateSurahList(1, 114),
          surahTotal: 114, moshafType: 1,
        ),
      ],
    ),
    Reciter(
      id: 72,
      name: "محمد أيوب",
      letter: "م",
      moshafs: [
        Moshaf(
          id: 72,
          name: "حفص عن عاصم",
          server: "http://server8.mp3quran.net/ayyub/",
          surahList: _generateSurahList(1, 114),
          surahTotal: 114, moshafType: 1,
        ),
      ],
    ),
    Reciter(
      id: 73,
      name: "محمد البراك",
      letter: "م",
      moshafs: [
        Moshaf(
          id: 73,
          name: "حفص عن عاصم",
          server: "http://server13.mp3quran.net/braak/",
          surahList: _generateSurahList(49, 114),
          surahTotal: 66, moshafType: 1,
        ),
      ],
    ),
    Reciter(
      id: 74,
      name: "محمد الطبلاوي",
      letter: "م",
      moshafs: [
        Moshaf(
          id: 74,
          name: "حفص عن عاصم",
          server: "http://server12.mp3quran.net/tblawi/",
          surahList: _generateSurahList(1, 114),
          surahTotal: 114, moshafType: 1,
        ),
      ],
    ),
    Reciter(
      id: 75,
      name: "محمد المحيسني",
      letter: "م",
      moshafs: [
        Moshaf(
          id: 75,
          name: "حفص عن عاصم",
          server: "http://server11.mp3quran.net/mhsny/",
          surahList: _generateSurahList(1, 114),
          surahTotal: 114, moshafType: 1,
        ),
      ],
    ),
    Reciter(
      id: 76,
      name: "محمد المنشد",
      letter: "م",
      moshafs: [
        Moshaf(
          id: 76,
          name: "حفص عن عاصم",
          server: "http://server10.mp3quran.net/monshed/",
          surahList: _generateSurahList(1, 114),
          surahTotal: 114, moshafType: 1,
        ),
      ],
    ),
    Reciter(
      id: 77,
      name: "محمد جبريل",
      letter: "م",
      moshafs: [
        Moshaf(
          id: 77,
          name: "حفص عن عاصم",
          server: "http://server8.mp3quran.net/jbrl/",
          surahList: _generateSurahList(1, 114),
          surahTotal: 114, moshafType: 1,
        ),
      ],
    ),
    Reciter(
      id: 78,
      name: "محمد رشاد الشريف",
      letter: "م",
      moshafs: [
        Moshaf(
          id: 78,
          name: "حفص عن عاصم",
          server: "http://server10.mp3quran.net/rashad/",
          surahList: _generateSurahList(1, 114),
          surahTotal: 114, moshafType: 1,
        ),
      ],
    ),
    Reciter(
      id: 79,
      name: "محمد صديق المنشاوي",
      letter: "م",
      moshafs: [
        Moshaf(
          id: 79,
          name: "حفص عن عاصم",
          server: "http://server10.mp3quran.net/minsh/",
          surahList: _generateSurahList(1, 114),
          surahTotal: 114, moshafType: 1,
        ),
      ],
    ),
    Reciter(
      id: 80,
      name: "محمد صديق المنشاوي [مجود]",
      letter: "م",
      moshafs: [
        Moshaf(
          id: 80,
          name: "المصحف المجود",
          server: "http://server11.mp3quran.net/minsh_mjwd/",
          surahList: _generateSurahList(1, 114),
          surahTotal: 114, moshafType: 1,
        ),
      ],
    ),
    Reciter(
      id: 81,
      name: "محمود الرفاعي",
      letter: "م",
      moshafs: [
        Moshaf(
          id: 81,
          name: "حفص عن عاصم",
          server: "http://server11.mp3quran.net/mrifai/",
          surahList: _generateSurahList(1, 114),
          surahTotal: 114, moshafType: 1,
        ),
      ],
    ),
    Reciter(
      id: 82,
      name: "محمود خليل الحصري",
      letter: "م",
      moshafs: [
        Moshaf(
          id: 82,
          name: "حفص عن عاصم",
          server: "http://server13.mp3quran.net/husr/",
          surahList: _generateSurahList(1, 114),
          surahTotal: 114, moshafType: 1,
        ),
      ],
    ),
    Reciter(
      id: 83,
      name: "محمود علي البنا",
      letter: "م",
      moshafs: [
        Moshaf(
          id: 83,
          name: "المصحف المجود",
          server: "http://server8.mp3quran.net/bna_mjwd/",
          surahList: _generateSurahList(1, 114),
          surahTotal: 114, moshafType: 1,
        ),
      ],
    ),
    Reciter(
      id: 84,
      name: "مشاري العفاسي",
      letter: "م",
      moshafs: [
        Moshaf(
          id: 84,
          name: "حفص عن عاصم",
          server: "http://server8.mp3quran.net/afs/",
          surahList: _generateSurahList(1, 114),
          surahTotal: 114, moshafType: 1,
        ),
      ],
    ),
    Reciter(
      id: 85,
      name: "مصطفى إسماعيل",
      letter: "م",
      moshafs: [
        Moshaf(
          id: 85,
          name: "حفص عن عاصم",
          server: "http://server8.mp3quran.net/mustafa/",
          surahList: _generateSurahList(1, 114),
          surahTotal: 114, moshafType: 1,
        ),
      ],
    ),
    Reciter(
      id: 86,
      name: "ناصر القطامي",
      letter: "ن",
      moshafs: [
        Moshaf(
          id: 86,
          name: "حفص عن عاصم",
          server: "http://server6.mp3quran.net/qtm/",
          surahList: _generateSurahList(1, 114),
          surahTotal: 114, moshafType: 1,
        ),
      ],
    ),
    Reciter(
      id: 87,
      name: "ياسر الدوسري",
      letter: "ي",
      moshafs: [
        Moshaf(
          id: 87,
          name: "حفص عن عاصم",
          server: "http://server11.mp3quran.net/yasser/",
          surahList: _generateSurahList(1, 114),
          surahTotal: 114, moshafType: 1,
        ),
      ],
    ),
  ];

  Future<List<Reciter>> fetchReciters() async {
    await Future.delayed(const Duration(milliseconds: 200));
    _recoters.sort((a, b) => a.name.compareTo(b.name));
    return _recoters;
  }

  static String _generateSurahList(int start, int end) {
    return List.generate(
      end - start + 1,
      (i) => "${start + i}",
    ).join(',');
  }
}
