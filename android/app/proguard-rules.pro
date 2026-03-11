# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in C:\Users\adel\AppData\Local\Android\sdk/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.

# Firebase specific rules
-keepattributes Signature
-keepattributes *Annotation*
-dontwarn com.google.firebase.**
-keep class com.google.firebase.** { *; }

# Keep our model classes for Firestore serialization
-keep class com.arabstore.app.AppModel { *; }
-keep class com.arabstore.app.ReviewModel { *; }

# Glide rules
-keep public class * extends com.bumptech.glide.module.AppGlideModule
-keep public class * extends com.bumptech.glide.module.LibraryGlideModule
-keep class com.bumptech.glide.GeneratedAppGlideModuleImpl { *; }
-keep class com.bumptech.glide.GeneratedLibraryGlideModuleImpl { *; }
-dontwarn com.bumptech.glide.**

# Credential Manager
-keep class androidx.credentials.** { *; }
-dontwarn androidx.credentials.**

# General Android rules
-keep class android.support.v4.app.** { *; }
-keep interface android.support.v4.app.** { *; }
-keep class androidx.appcompat.** { *; }
-keep interface androidx.appcompat.** { *; }
-keep class com.google.android.material.** { *; }

# Handle Kotlin metadata warnings if necessary (uncomment if errors persist)
#-keep class kotlin.Metadata { *; }
