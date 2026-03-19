import 'dart:convert';
import 'package:flutter/services.dart';
import 'package:flutter/foundation.dart';
import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
import '../models/quran_surah.dart';
import '../models/favorite_item.dart';
import '../models/reciter.dart';
import '../models/speaker.dart';
import '../models/speech.dart';

class DatabaseHelper {
  static final DatabaseHelper instance = DatabaseHelper._init();
  static Database? _database;

  DatabaseHelper._init();

  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDB('app_database.db');
    return _database!;
  }

  Future<Database> _initDB(String filePath) async {
    final dbPath = await getDatabasesPath();
    final path = join(dbPath, filePath);

    return await openDatabase(
      path, 
      version: 3, 
      onCreate: _createDB,
      onUpgrade: _upgradeDB,
    );
  }

  Future<void> _createDB(Database db, int version) async {
    // Reciters Table
    await db.execute('''
      CREATE TABLE reciters (
        id INTEGER PRIMARY KEY,
        name TEXT,
        letter TEXT,
        moshafs TEXT
      )
    ''');

    // Surahs Table (Metadata)
    await db.execute('''
      CREATE TABLE surahs (
        number INTEGER PRIMARY KEY,
        name TEXT,
        englishName TEXT,
        englishNameTranslation TEXT,
        numberOfAyahs INTEGER,
        revelationType TEXT
      )
    ''');

    // Nasheeds Table
    await db.execute('''
      CREATE TABLE nasheeds (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        artistId TEXT,
        title TEXT,
        url TEXT
      )
    ''');
    
    // Favorites Table
    await db.execute('''
      CREATE TABLE favorites (
        id TEXT PRIMARY KEY, 
        type TEXT,
        title TEXT,
        subtitle TEXT,
        url TEXT,
        originalId TEXT
      )
    ''');

    // Speakers Table
    await db.execute('''
      CREATE TABLE speakers (
        id TEXT PRIMARY KEY,
        name TEXT,
        imageUrl TEXT
      )
    ''');

    // Speeches Table
    await db.execute('''
      CREATE TABLE speeches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        speakerId TEXT,
        title TEXT,
        url TEXT,
        FOREIGN KEY (speakerId) REFERENCES speakers (id)
      )
    ''');
    
    // Seed Data immediately after creation
    await _seedDatabase(db);
  }

  Future<void> _upgradeDB(Database db, int oldVersion, int newVersion) async {
    if (oldVersion < 2) {
      await db.execute('''
        CREATE TABLE favorites (
          id TEXT PRIMARY KEY, 
          type TEXT,
          title TEXT,
          subtitle TEXT,
          url TEXT,
          originalId TEXT
        )
      ''');
    }
    if (oldVersion < 3) {
      await db.execute('''
        CREATE TABLE speakers (
          id TEXT PRIMARY KEY,
          name TEXT,
          imageUrl TEXT
        )
      ''');
      await db.execute('''
        CREATE TABLE speeches (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          speakerId TEXT,
          title TEXT,
          url TEXT,
          FOREIGN KEY (speakerId) REFERENCES speakers (id)
        )
      ''');
      await _seedSpeeches(db);
    }
  }

  Future<void> _seedDatabase(Database db) async {
    try {
      // Seed Surahs
      final String surahJson = await rootBundle.loadString('assets/data/surahs.json');
      final Map<String, dynamic> surahData = json.decode(surahJson);
      final List<dynamic> surahsList = surahData['data'];
      
      final Batch surahBatch = db.batch();
      for (var s in surahsList) {
        surahBatch.insert('surahs', {
          'number': s['number'],
          'name': s['name'],
          'englishName': s['englishName'],
          'englishNameTranslation': s['englishNameTranslation'],
          'numberOfAyahs': s['numberOfAyahs'],
          'revelationType': s['revelationType'],
        });
      }
      await surahBatch.commit(noResult: true);
      debugPrint("Seeded Surahs");

      // Seed Reciters
      final String reciterJson = await rootBundle.loadString('assets/data/reciters.json');
      final Map<String, dynamic> reciterData = json.decode(reciterJson);
      final List<dynamic> recitersList = reciterData['reciters'];

      final Batch reciterBatch = db.batch();
      for (var r in recitersList) {
        // We store the list of moshafs as a JSON string to simplify the table structure 
        // since we just need to retrieve and parse it back.
        reciterBatch.insert('reciters', {
          'id': r['id'],
          'name': r['name'],
          'letter': r['letter'],
          'moshafs': json.encode(r['moshaf']),
        });
      }
      await reciterBatch.commit(noResult: true);
      debugPrint("Seeded Reciters");

      await _seedSpeeches(db);

    } catch (e) {
      debugPrint('Error seeding database: $e');
    }
  }

  Future<void> _seedSpeeches(Database db) async {
    try {
      // Seed Speakers
      final String speakerJson = await rootBundle.loadString('assets/data/speakers.json');
      final List<dynamic> speakersList = json.decode(speakerJson);
      
      final Batch speakerBatch = db.batch();
      for (var s in speakersList) {
        speakerBatch.insert('speakers', {
          'id': s['id'],
          'name': s['name'],
          'imageUrl': s['imageUrl'],
        });
      }
      await speakerBatch.commit(noResult: true);
      debugPrint("Seeded Speakers");

      // Seed Speeches
      final String speechJson = await rootBundle.loadString('assets/data/speeches.json');
      final List<dynamic> speechesList = json.decode(speechJson);
      
      final Batch speechBatch = db.batch();
      for (var s in speechesList) {
        speechBatch.insert('speeches', {
          'speakerId': s['speakerId'],
          'title': s['title'],
          'url': s['url'],
        });
      }
      await speechBatch.commit(noResult: true);
      debugPrint("Seeded Speeches");
    } catch (e) {
      debugPrint('Error seeding speeches: $e');
    }
  }

  // --- CRUD Operations ---

  Future<List<Reciter>> getReciters() async {
    final db = await instance.database;
    final maps = await db.query('reciters', orderBy: 'name ASC');

    if (maps.isEmpty) return [];

    return maps.map((map) {
      // Decode the moshafs JSON string back to a list of objects
      List<dynamic> moshafList = json.decode(map['moshafs'] as String);
      // We need to reconstruct the Reciter object manually or update model to support this
      // For now, let's map it to the structure Reciter.fromJson expects, or create new from props
      // Re-using the structure required by Reciter.fromJson partially
      return Reciter(
        id: map['id'] as int,
        name: map['name'] as String,
        letter: map['letter'] as String,
        moshafs: moshafList.map((m) => Moshaf.fromJson(m)).toList(),
      );
    }).toList();
  }

  Future<List<QuranSurah>> getSurahs() async {
    final db = await instance.database;
    final maps = await db.query('surahs', orderBy: 'number ASC');

    if (maps.isEmpty) return [];

    return maps.map((map) => QuranSurah(
      number: map['number'] as int,
      name: map['name'] as String,
      englishName: map['englishName'] as String,
      englishNameTranslation: map['englishNameTranslation'] as String,
      numberOfAyahs: map['numberOfAyahs'] as int,
      revelationType: map['revelationType'] as String,
      revelationOrder: map['number'] as int, // Defaulting to number as it wasn't in schema
    )).toList();
  }
  
  // Method to manually trigger seeding if needed (e.g. if file didn't exist at creation)
  Future<void> reSeed() async {
     final db = await instance.database;
     // Check if empty
     final count = Sqflite.firstIntValue(await db.rawQuery('SELECT COUNT(*) FROM surahs'));
     if (count == 0) {
       await _seedDatabase(db);
     }
  }

  // --- Favorites Operations ---

  Future<void> addFavorite(FavoriteItem item) async {
    final db = await instance.database;
    await db.insert('favorites', item.toMap(), conflictAlgorithm: ConflictAlgorithm.replace);
  }

  Future<void> removeFavorite(String id) async {
    final db = await instance.database;
    await db.delete('favorites', where: 'id = ?', whereArgs: [id]);
  }

  Future<bool> isFavorite(String id) async {
    final db = await instance.database;
    final List<Map<String, dynamic>> maps = await db.query(
      'favorites',
      where: 'id = ?',
      whereArgs: [id],
    );
    return maps.isNotEmpty;
  }

  Future<List<FavoriteItem>> getFavorites() async {
    final db = await instance.database;
    final maps = await db.query('favorites');
    return maps.map((map) => FavoriteItem.fromMap(map)).toList();
  }

  // --- Speeches Operations ---

  Future<List<Speaker>> getSpeakers() async {
    final db = await instance.database;
    final maps = await db.query('speakers', orderBy: 'name ASC');
    return maps.map((map) => Speaker.fromMap(map)).toList();
  }

  Future<List<Speech>> getSpeechesBySpeaker(String speakerId) async {
    final db = await instance.database;
    final maps = await db.query(
      'speeches',
      where: 'speakerId = ?',
      whereArgs: [speakerId],
    );
    return maps.map((map) => Speech.fromMap(map)).toList();
  }
}
