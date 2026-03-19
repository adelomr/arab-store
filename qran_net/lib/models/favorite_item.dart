class FavoriteItem {
  final String id; // Composite ID or Unique String (e.g. "surah_1", "nasheed_12")
  final String type; // "surah", "nasheed", "radio"
  final String title;
  final String subtitle;
  final String url;
  final String originalId; // The ID in its original table/list (e.g. surah number)

  FavoriteItem({
    required this.id,
    required this.type,
    required this.title,
    required this.subtitle,
    required this.url,
    required this.originalId,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'type': type,
      'title': title,
      'subtitle': subtitle,
      'url': url,
      'originalId': originalId,
    };
  }

  factory FavoriteItem.fromMap(Map<String, dynamic> map) {
    return FavoriteItem(
      id: map['id'],
      type: map['type'],
      title: map['title'],
      subtitle: map['subtitle'],
      url: map['url'],
      originalId: map['originalId'],
    );
  }
}
