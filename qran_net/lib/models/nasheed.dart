class Nasheed {
  final String title;
  final String url;

  Nasheed({required this.title, required this.url});

  factory Nasheed.fromJson(Map<String, dynamic> json) {
    return Nasheed(title: json['title'] ?? '', url: json['url'] ?? '');
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is Nasheed &&
          runtimeType == other.runtimeType &&
          url == other.url &&
          title == other.title;

  @override
  int get hashCode => url.hashCode ^ title.hashCode;
}
