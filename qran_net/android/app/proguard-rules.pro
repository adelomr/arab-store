# Flutter ProGuard Rules
-keep class com.elmoka.aljam3.** { *; }

# Add any specific rules for your dependencies if you see errors during build.
# Google Mobile Ads (if used)
-keep public class com.google.android.gms.ads.** {
   public *;
}

# Add rules for just_audio, audio_session etc if needed.
