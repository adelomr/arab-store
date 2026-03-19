import 'package:flutter_test/flutter_test.dart';
import 'package:test_wep/services/api_service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('ApiService Ibtihalat Tests', () {
    final apiService = ApiService();

    test('fetchIbtihalatArtists includes Sheikh Muhammad Imran', () async {
      final artists = await apiService.fetchIbtihalatArtists();
      final imran = artists.firstWhere((a) => a.id == 'imran');
      expect(imran.name, 'الشيخ محمد عمران');
    });

    test('fetchIbtihalatArtists includes Sheikh Taha Al-Fashni', () async {
      final artists = await apiService.fetchIbtihalatArtists();
      final fashni = artists.firstWhere((a) => a.id == 'fashni');
      expect(fashni.name, 'طه الفشني');
    });

    test('fetchIbtihalatTracks returns 20 tracks for fashni', () async {
      final tracks = await apiService.fetchIbtihalatTracks('fashni');
      expect(tracks.length, 20);
      expect(tracks[0].title, 'آخذ بالروح منى');
      expect(tracks[19].title, 'يأيها المختار');
    });
  });
}
