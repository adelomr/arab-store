package com.arabstore.app;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import com.google.android.material.dialog.MaterialAlertDialogBuilder;

import java.util.concurrent.Executors;

public class SplashActivity extends AppCompatActivity {

    private static final String TAG = "SplashActivity";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        android.content.SharedPreferences prefs = getSharedPreferences("settings", MODE_PRIVATE);
        boolean isDarkMode = prefs.getBoolean("dark_mode", false);
        if (isDarkMode) {
            androidx.appcompat.app.AppCompatDelegate
                    .setDefaultNightMode(androidx.appcompat.app.AppCompatDelegate.MODE_NIGHT_YES);
        } else {
            androidx.appcompat.app.AppCompatDelegate
                    .setDefaultNightMode(androidx.appcompat.app.AppCompatDelegate.MODE_NIGHT_NO);
        }
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_splash);

        checkForUpdates();
    }

    private void checkForUpdates() {
        com.google.firebase.firestore.FirebaseFirestore db = com.google.firebase.firestore.FirebaseFirestore.getInstance();
        db.collection("apps").whereEqualTo("packageName", "com.arabstore.app")
                .get()
                .addOnSuccessListener(queryDocumentSnapshots -> {
                    if (!queryDocumentSnapshots.isEmpty()) {
                        com.google.firebase.firestore.DocumentSnapshot doc = queryDocumentSnapshots.getDocuments().get(0);
                        AppModel app = doc.toObject(AppModel.class);
                        if (app != null) {
                            int latestBuild = app.getVersionCode();
                            String releaseNotes = app.getChangelog() != null ? app.getChangelog() : "تحديث جديد متوفر";
                            String downloadUrl = app.getDownloadUrl();
                            
                            int currentBuild = BuildConfig.VERSION_CODE;

                            if (latestBuild > currentBuild && downloadUrl != null && !downloadUrl.isEmpty()) {
                                showUpdateDialog(releaseNotes, downloadUrl, false);
                            } else {
                                proceedToMain();
                            }
                        } else {
                            proceedToMain();
                        }
                    } else {
                        proceedToMain();
                    }
                })
                .addOnFailureListener(e -> {
                    Log.e(TAG, "Error checking for updates from Firestore", e);
                    proceedToMain();
                });
    }

    private void showUpdateDialog(String notes, String downloadUrl, boolean forceUpdate) {
        MaterialAlertDialogBuilder builder = new MaterialAlertDialogBuilder(this)
                .setTitle("تحديث جديد متوفر")
                .setMessage("يوجد إصدار جديد من متجر العرب!\n\nما الجديد:\n" + notes)
                .setCancelable(false)
                .setPositiveButton("تحديث الآن", (dialog, which) -> {
                    Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(downloadUrl));
                    startActivity(intent);
                    // Keep the app open on the update page or close it?
                    // For force update, we stay here.
                    if (forceUpdate) {
                        // User must update. We don't finish() yet, or we finish and user goes to browser.
                        // If they come back, Splash will run again.
                        finish();
                    }
                });

        if (!forceUpdate) {
            builder.setNegativeButton("لاحقاً", (dialog, which) -> proceedToMain());
        }

        builder.show();
    }

    private void proceedToMain() {
        runOnUiThread(() -> {
            startActivity(new Intent(SplashActivity.this, MainActivity.class));
            finish();
        });
    }
}

