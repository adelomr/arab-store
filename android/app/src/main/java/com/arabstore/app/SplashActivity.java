package com.arabstore.app;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import com.google.android.material.dialog.MaterialAlertDialogBuilder;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.Executors;

public class SplashActivity extends AppCompatActivity {

    private static final String TAG = "SplashActivity";
    private static final String UPDATE_JSON_URL = "https://arab-store-c33d9.web.app/update.json";

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
        Executors.newSingleThreadExecutor().execute(() -> {
            try {
                URL url = new URL(UPDATE_JSON_URL);
                HttpURLConnection connection = (HttpURLConnection) url.openConnection();
                try {
                    connection.setRequestMethod("GET");
                    connection.setConnectTimeout(5000);
                    connection.setReadTimeout(5000);

                    try (BufferedReader reader = new BufferedReader(
                            new InputStreamReader(connection.getInputStream()))) {
                        StringBuilder response = new StringBuilder();
                        String line;
                        while ((line = reader.readLine()) != null) {
                            response.append(line);
                        }

                        JSONObject json = new JSONObject(response.toString());
                        int latestBuild = json.optInt("build_number", 0);
                        String releaseNotes = json.optString("release_notes", "تحديث جديد متوفر");
                        String downloadUrl = json.optString("download_url", "");
                        boolean forceUpdate = json.optBoolean("force_update", false);

                        int currentBuild = BuildConfig.VERSION_CODE;

                        if (latestBuild > currentBuild && !downloadUrl.isEmpty()) {
                            runOnUiThread(() -> showUpdateDialog(releaseNotes, downloadUrl, forceUpdate));
                        } else {
                            proceedToMain();
                        }
                    }
                } finally {
                    connection.disconnect();
                }
            } catch (Exception e) {
                Log.e(TAG, "Error checking for updates", e);
                // In case of error (e.g. no internet), proceed to main app
                proceedToMain();
            }
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

