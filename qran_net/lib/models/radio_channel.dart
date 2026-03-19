class RadioChannel {
  final int id;
  final String name;
  final String url;

  RadioChannel({required this.id, required this.name, required this.url});

  factory RadioChannel.fromJson(Map<String, dynamic> json) {
    return RadioChannel(
      id: json['id'],
      name: json['name'] ?? '',
      url: json['url'] ?? '',
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is RadioChannel &&
          runtimeType == other.runtimeType &&
          id == other.id &&
          url == other.url &&
          name == other.name;

  @override
  int get hashCode => id.hashCode ^ url.hashCode ^ name.hashCode;
}
