class Reciter {
  final int id;
  final String name;
  final String letter;
  final List<Moshaf> moshafs;

  Reciter({
    required this.id,
    required this.name,
    required this.letter,
    required this.moshafs,
  });

  factory Reciter.fromJson(Map<String, dynamic> json) {
    var list = json['moshaf'] as List? ?? [];
    List<Moshaf> moshafList = list.map((i) => Moshaf.fromJson(i)).toList();

    return Reciter(
      id: json['id'] ?? 0,
      name: json['name'] ?? '',
      letter: json['letter'] ?? '',
      moshafs: moshafList,
    );
  }
}

class Moshaf {
  final int id;
  final String name;
  final String server;
  final String surahList;
  final int surahTotal;
  final int moshafType;

  Moshaf({
    required this.id,
    required this.name,
    required this.server,
    required this.surahList,
    required this.surahTotal,
    required this.moshafType,
  });

  factory Moshaf.fromJson(Map<String, dynamic> json) {
    return Moshaf(
      id: json['id'] ?? 0,
      name: json['name'] ?? '',
      server: json['server'] ?? '',
      surahList: json['surah_list'] ?? '',
      surahTotal: json['surah_total'] ?? 0,
      moshafType: json['moshaf_type'] ?? 0,
    );
  }
}
