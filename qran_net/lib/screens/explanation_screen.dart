import 'package:flutter/material.dart';
import 'package:package_info_plus/package_info_plus.dart';
import '../constants/colors.dart';
import '../widgets/app_background.dart';
import '../widgets/glass_container.dart';

class ExplanationScreen extends StatelessWidget {
  const ExplanationScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return AppBackground(
      child: Scaffold(
        backgroundColor: Colors.transparent,
        appBar: AppBar(
          backgroundColor: Colors.transparent,
          elevation: 0,
          title: const Text("شرح التطبيق"),
          centerTitle: true,
        ),
        body: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
          child: Column(
            children: [
              const SizedBox(height: 20),
              Center(
                child: Hero(
                  tag: 'app_logo_explanation',
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: Colors.black.withValues(alpha: 0.2),
                      border: Border.all(color: AppColors.accent.withValues(alpha: 0.3)),
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(20),
                      child: Image.asset(
                        'assets/icon/app_icon.png',
                        width: 100,
                        height: 100,
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 30),
              GlassContainer(
                padding: const EdgeInsets.all(24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          "حول تطبيق الجامع",
                          style: TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                            color: AppColors.accent,
                          ),
                        ),
                        FutureBuilder<PackageInfo>(
                          future: PackageInfo.fromPlatform(),
                          builder: (context, snapshot) {
                            final version = snapshot.hasData ? snapshot.data!.version : "...";
                            return Text(
                              "الإصدار $version",
                              style: const TextStyle(
                                fontSize: 12,
                                color: Colors.white54,
                              ),
                            );
                          },
                        ),
                      ],
                    ),
                    const Divider(color: Colors.white24, height: 30),
                    _buildParagraph(
                        "صُمِّم تطبيق «الجامع» خصيصًا ليلبي احتياجات كل مسلم في جوانب شتى؛ حيث يضم عشرات التلاوات لكبار قراء العالم الإسلامي، بالإضافة إلى أقسام خاصة للتجويد، والخطب، والأناشيد، والابتهالات الدينية. كما يحتوي على مجموعة كبيرة من الإذاعات الإسلامية، وفي مقدمتها إذاعة القرآن الكريم من القاهرة."),
                    const SizedBox(height: 20),
                    _buildParagraph(
                        "يتيح لك التطبيق الاستماع لأي قارئ، مع إمكانية تحميل المقاطع الصوتية لتشغيلها لاحقًا بدون الحاجة إلى اتصال بالإنترنت. كما يتضمن «المصحف المقروء» الذي يمكنك من خلاله تصفح القرآن الكريم، مع ميزة حفظ علامة «الورد اليومي» لتنتقل مباشرة إلى حيث توقفت في آخر مرة. بالإضافة إلى ذلك، يوفر التطبيق خاصية البحث عن الآيات، مع «التفسير الميسر» للقرآن الكريم."),
                    const SizedBox(height: 20),
                    _buildParagraph(
                        "هذا ما مَنَّ الله به علينا في هذه المرحلة، وسنواصل بمشيئة الله تحديثه وتطويره بناءً على مقترحاتكم. أسألكم الدعاء لي ولعامة المسلمين."),
                    const SizedBox(height: 40),
                    Align(
                      alignment: Alignment.centerLeft,
                      child: Text(
                        "محبكم في الله: عادل جودة نوح",
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: AppColors.accent.withValues(alpha: 0.8),
                          fontStyle: FontStyle.italic,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildParagraph(String text) {
    return Text(
      text,
      textAlign: TextAlign.justify,
      style: const TextStyle(
        fontSize: 16,
        color: Colors.white,
        height: 1.8,
        letterSpacing: 0.2,
      ),
    );
  }
}
