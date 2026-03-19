class Speech {
  final String title;
  final String url;

  final String? speakerId;

  Speech({required this.title, required this.url, this.speakerId});

  Map<String, dynamic> toMap() {
    return {
      'title': title,
      'url': url,
      'speakerId': speakerId,
    };
  }

  factory Speech.fromMap(Map<String, dynamic> map) {
    return Speech(
      title: map['title'],
      url: map['url'],
      speakerId: map['speakerId'],
    );
  }
}
