enum DownloadCategory { quran, nasheed, speech }

class DownloadedItem {
  final String id;
  final String title;
  final String localPath;
  final String url;
  final DownloadCategory category;
  final String? artistName;

  DownloadedItem({
    required this.id,
    required this.title,
    required this.localPath,
    required this.url,
    required this.category,
    this.artistName,
  });

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'localPath': localPath,
      'url': url,
      'category': category.index,
      'artistName': artistName,
    };
  }

  factory DownloadedItem.fromJson(Map<String, dynamic> json) {
    return DownloadedItem(
      id: json['id'],
      title: json['title'],
      localPath: json['localPath'],
      url: json['url'],
      category: DownloadCategory.values[json['category']],
      artistName: json['artistName'],
    );
  }
}
