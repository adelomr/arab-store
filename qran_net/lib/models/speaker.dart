class Speaker {
  final String id;
  final String name;
  final String? imageUrl;

  Speaker({required this.id, required this.name, this.imageUrl});

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'imageUrl': imageUrl,
    };
  }

  factory Speaker.fromMap(Map<String, dynamic> map) {
    return Speaker(
      id: map['id'],
      name: map['name'],
      imageUrl: map['imageUrl'],
    );
  }
}
