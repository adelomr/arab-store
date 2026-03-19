class Ibtihalat {
  final String title;
  final String url;

  Ibtihalat({required this.title, required this.url});

  factory Ibtihalat.fromJson(Map<String, dynamic> json) {
    return Ibtihalat(title: json['title'] ?? '', url: json['url'] ?? '');
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is Ibtihalat &&
          runtimeType == other.runtimeType &&
          url == other.url &&
          title == other.title;

  @override
  int get hashCode => url.hashCode ^ title.hashCode;
}
