package com.arabstore.app;

import android.annotation.SuppressLint;
import android.app.DownloadManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.Settings;
import android.util.Log;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.RatingBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.FileProvider;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.bumptech.glide.Glide;
import com.google.android.material.button.MaterialButton;
import com.google.android.material.progressindicator.CircularProgressIndicator;
import com.google.android.material.textfield.TextInputEditText;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseUser;
import com.google.firebase.firestore.FieldValue;
import com.google.firebase.firestore.FirebaseFirestore;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.AdView;
import com.google.firebase.firestore.Query;
import com.google.firebase.firestore.QueryDocumentSnapshot;

import java.io.File;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class AppDetailsActivity extends AppCompatActivity {

    private ImageView iconImage, btnShareApp;
    private TextView nameText, developerText, descriptionText;
    private MaterialButton installButton;
    private AppModel appModel;
    private FirebaseFirestore db;
    private long downloadId = -1;
    private ReviewAdapter reviewAdapter;
    private ScreenshotAdapter screenshotAdapter;
    private List<ReviewModel> reviewList;
    private List<String> screenshotList;

    private LinearLayout layoutAddReview;
    private TextView textInstallToReview;
    private RatingBar ratingBarInput;
    private TextInputEditText commentInput;
    private MaterialButton btnSubmitReview;

    private LinearLayout layoutDownloadProgress;
    private CircularProgressIndicator downloadProgress;
    private TextView textDownloadPercent;

    private boolean isDownloading = false;

    private final BroadcastReceiver onDownloadComplete = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            long id = intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1);
            if (downloadId != -1 && downloadId == id) {
                isDownloading = false;
                layoutDownloadProgress.setVisibility(android.view.View.GONE);
                installButton.setVisibility(android.view.View.VISIBLE);
                installButton.setText("فتح");
                installButton.setOnClickListener(v -> openApp(appModel.getPackageName()));
                installApk();
            }
        }
    };

    @SuppressLint("UnspecifiedRegisterReceiverFlag")
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
        setContentView(R.layout.activity_app_details);

        db = FirebaseFirestore.getInstance();
        appModel = (AppModel) getIntent().getSerializableExtra("app");

        iconImage = findViewById(R.id.detail_icon);
        nameText = findViewById(R.id.detail_name);
        descriptionText = findViewById(R.id.detail_full_desc);
        installButton = findViewById(R.id.btn_download);
        btnShareApp = findViewById(R.id.btn_share_app);

        layoutDownloadProgress = findViewById(R.id.layout_download_progress);
        downloadProgress = findViewById(R.id.download_progress);
        textDownloadPercent = findViewById(R.id.text_download_percent);

        layoutAddReview = findViewById(R.id.layout_add_review);
        textInstallToReview = findViewById(R.id.text_install_to_review);
        ratingBarInput = findViewById(R.id.rating_bar_input);
        commentInput = findViewById(R.id.comment_input);
        btnSubmitReview = findViewById(R.id.btn_submit_review);

        // Reviews
        RecyclerView reviewsRecyclerView = findViewById(R.id.recycler_reviews);
        reviewList = new ArrayList<>();
        FirebaseUser currentUser = FirebaseAuth.getInstance().getCurrentUser();
        String currentUserId = currentUser != null ? currentUser.getUid() : null;
        reviewAdapter = new ReviewAdapter(reviewList, this, currentUserId, this::showReviewOptionsDialog);
        reviewsRecyclerView.setLayoutManager(new LinearLayoutManager(this));
        reviewsRecyclerView.setAdapter(reviewAdapter);

        // Screenshots
        RecyclerView screenshotsRecyclerView = findViewById(R.id.recycler_screenshots);
        screenshotList = new ArrayList<>();
        screenshotAdapter = new ScreenshotAdapter(screenshotList);
        screenshotsRecyclerView.setLayoutManager(new LinearLayoutManager(this, LinearLayoutManager.HORIZONTAL, false));
        screenshotsRecyclerView.setAdapter(screenshotAdapter);

        if (appModel != null) {
            updateUI();
            loadReviews();
        } else {
            String appId = getIntent().getStringExtra("appId");
            if (appId != null)
                loadAppDetails(appId);
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(onDownloadComplete,
                    new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE),
                    Context.RECEIVER_EXPORTED);
        } else {
            registerReceiver(onDownloadComplete,
                    new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE));
        }

        AdView adView = findViewById(R.id.adView);
        AdRequest adRequest = new AdRequest.Builder().build();
        adView.loadAd(adRequest);
    }

    private void loadAppDetails(String packageName) {
        db.collection("apps").whereEqualTo("packageName", packageName)
                .get()
                .addOnSuccessListener(queryDocumentSnapshots -> {
                    if (!queryDocumentSnapshots.isEmpty()) {
                        appModel = queryDocumentSnapshots.getDocuments().get(0).toObject(AppModel.class);
                        appModel.setId(queryDocumentSnapshots.getDocuments().get(0).getId());
                        updateUI();
                        loadReviews();
                        checkIfUserReviewed();
                    }
                });
    }

    private void loadReviews() {
        db.collection("apps").document(appModel.getId()).collection("reviews")
                .orderBy("createdAt", Query.Direction.DESCENDING)
                .get()
                .addOnCompleteListener(task -> {
                    if (task.isSuccessful()) {
                        List<ReviewModel> newList = new ArrayList<>();
                        for (QueryDocumentSnapshot document : task.getResult()) {
                            ReviewModel review = document.toObject(ReviewModel.class);
                            newList.add(review);
                        }
                        reviewAdapter.updateList(newList);
                    }
                });
    }

    private void updateUI() {
        nameText.setText(appModel.getName());
        descriptionText.setText(appModel.getFullDesc());

        Glide.with(this).load(appModel.getIconUrl()).into(iconImage);
        if (appModel.getScreenshots() != null && !appModel.getScreenshots().isEmpty()) {
            screenshotAdapter.updateList(appModel.getScreenshots());
        }

        btnShareApp.setOnClickListener(v -> {
            Intent sendIntent = new Intent();
            sendIntent.setAction(Intent.ACTION_SEND);
            String shareMessage = "تحقق من تطبيق " + appModel.getName() + " على متجر العرب!\n\n" +
                    "https://arab-store-c33d9.web.app/store-item.html?id=" + appModel.getId();
            sendIntent.putExtra(Intent.EXTRA_TEXT, shareMessage);
            sendIntent.setType("text/plain");
            startActivity(Intent.createChooser(sendIntent, "مشاركـة التطبيق"));
        });

        if (isAppInstalled(appModel.getPackageName())) {
            installButton.setText("فتح");
            installButton.setOnClickListener(v -> openApp(appModel.getPackageName()));
        } else {
            installButton.setText("تثبيت");
            installButton.setOnClickListener(v -> startDownload());
        }

        setupReviewInput();
    }

    private boolean isAppInstalled(String packageName) {
        try {
            getPackageManager().getPackageInfo(packageName, PackageManager.GET_ACTIVITIES);
            return true;
        } catch (PackageManager.NameNotFoundException e) {
            return false;
        }
    }

    private void setupReviewInput() {
        FirebaseUser user = FirebaseAuth.getInstance().getCurrentUser();
        boolean isInstalled = isAppInstalled(appModel.getPackageName());

        checkIfUserReviewed();
    }

    private void checkIfUserReviewed() {
        FirebaseUser user = FirebaseAuth.getInstance().getCurrentUser();
        boolean isInstalled = isAppInstalled(appModel.getPackageName());

        if (user != null && isInstalled) {
            db.collection("apps").document(appModel.getId()).collection("reviews")
                    .document(user.getUid())
                    .get()
                    .addOnSuccessListener(documentSnapshot -> {
                        if (documentSnapshot.exists()) {
                            layoutAddReview.setVisibility(android.view.View.GONE);
                            textInstallToReview.setVisibility(android.view.View.GONE);
                        } else {
                            layoutAddReview.setVisibility(android.view.View.VISIBLE);
                            textInstallToReview.setVisibility(android.view.View.GONE);
                            btnSubmitReview.setText("إرسال التقييم");
                            btnSubmitReview.setOnClickListener(v -> submitReview(user));
                        }
                    });
        } else if (user != null) {
            layoutAddReview.setVisibility(android.view.View.GONE);
            textInstallToReview.setVisibility(android.view.View.VISIBLE);
        } else {
            layoutAddReview.setVisibility(android.view.View.GONE);
            textInstallToReview.setVisibility(android.view.View.GONE);
        }
    }

    private void submitReview(FirebaseUser user) {
        float rating = ratingBarInput.getRating();
        String comment = commentInput.getText() != null ? commentInput.getText().toString().trim() : "";

        if (rating == 0) {
            Toast.makeText(this, "الرجاء اختيار التقييم", Toast.LENGTH_SHORT).show();
            return;
        }

        btnSubmitReview.setEnabled(false);

        ReviewModel review = new ReviewModel();
        review.setUserId(user.getUid());
        review.setUserName(user.getDisplayName() != null ? user.getDisplayName() : "مستخدم");
        review.setUserPhoto(user.getPhotoUrl() != null ? user.getPhotoUrl().toString() : "");
        review.setRating(rating);
        review.setText(comment);
        review.setCreatedAt(new Date());

        db.collection("apps").document(appModel.getId()).collection("reviews")
                .document(user.getUid())
                .set(review)
                .addOnSuccessListener(aVoid -> {
                    Toast.makeText(this, "تم حفظ التقييم بنجاح", Toast.LENGTH_SHORT).show();
                    ratingBarInput.setRating(0);
                    commentInput.setText("");
                    btnSubmitReview.setEnabled(true);

                    recalculateOverallRating();
                    loadReviews();
                    checkIfUserReviewed();
                })
                .addOnFailureListener(e -> {
                    Toast.makeText(this, "فشل حفظ التقييم", Toast.LENGTH_SHORT).show();
                    btnSubmitReview.setEnabled(true);
                });
    }

    private void showReviewOptionsDialog(ReviewModel review) {
        String[] options = { "تعديل", "حذف" };
        new androidx.appcompat.app.AlertDialog.Builder(this)
                .setTitle("خيارات التقييم")
                .setItems(options, (dialog, which) -> {
                    if (which == 0) {
                        editReview(review);
                    } else if (which == 1) {
                        deleteReview(review);
                    }
                })
                .show();
    }

    private void editReview(ReviewModel review) {
        layoutAddReview.setVisibility(android.view.View.VISIBLE);
        ratingBarInput.setRating(review.getRating());
        commentInput.setText(review.getText());
        btnSubmitReview.setText("تحديث التقييم");

        textInstallToReview.setVisibility(android.view.View.GONE);

        btnSubmitReview.setOnClickListener(v -> submitReview(FirebaseAuth.getInstance().getCurrentUser()));
        layoutAddReview.getParent().requestChildFocus(layoutAddReview, layoutAddReview);
    }

    private void deleteReview(ReviewModel review) {
        db.collection("apps").document(appModel.getId()).collection("reviews")
                .document(review.getUserId())
                .delete()
                .addOnSuccessListener(aVoid -> {
                    Toast.makeText(this, "تم حذف التقييم", Toast.LENGTH_SHORT).show();
                    recalculateOverallRating();
                    loadReviews();
                    checkIfUserReviewed();
                })
                .addOnFailureListener(e -> Toast.makeText(this, "فشل حذف التقييم", Toast.LENGTH_SHORT).show());
    }

    private void recalculateOverallRating() {
        db.collection("apps").document(appModel.getId()).collection("reviews")
                .get()
                .addOnSuccessListener(queryDocumentSnapshots -> {
                    long newCount = queryDocumentSnapshots.size();
                    float totalRating = 0;

                    for (QueryDocumentSnapshot doc : queryDocumentSnapshots) {
                        Double rating = doc.getDouble("rating");
                        if (rating != null) {
                            totalRating += rating.floatValue();
                        }
                    }

                    float newAverage = newCount > 0 ? (totalRating / newCount) : 0;

                    Map<String, Object> updates = new HashMap<>();
                    updates.put("ratingCount", newCount);
                    updates.put("rating", newAverage);

                    db.collection("apps").document(appModel.getId()).update(updates);
                });
    }

    private void openApp(String packageName) {
        Intent intent = getPackageManager().getLaunchIntentForPackage(packageName);
        if (intent != null)
            startActivity(intent);
    }

    private void startDownload() {
        if (appModel.getDownloadUrl() == null || appModel.getDownloadUrl().isEmpty()) {
            Toast.makeText(this, "رابط التحميل غير متوفر", Toast.LENGTH_SHORT).show();
            return;
        }

        File file = new File(getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS),
                appModel.getName() + ".apk");
        if (file.exists())
            file.delete();

        DownloadManager.Request request = new DownloadManager.Request(
                Uri.parse(appModel.getDownloadUrl()))
                .setTitle("جاري تحميل " + appModel.getName())
                .setDescription("تحميل ملف APK...")
                .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                .setDestinationUri(Uri.fromFile(file))
                .setAllowedOverMetered(true)
                .setAllowedOverRoaming(true);

        DownloadManager downloadManager = (DownloadManager) getSystemService(DOWNLOAD_SERVICE);
        downloadId = downloadManager.enqueue(request);
        Toast.makeText(this, "بدأ التحميل...", Toast.LENGTH_SHORT).show();

        installButton.setVisibility(android.view.View.GONE);
        layoutDownloadProgress.setVisibility(android.view.View.VISIBLE);
        downloadProgress.setProgress(0);
        textDownloadPercent.setText("0%");
        isDownloading = true;

        trackDeviceInstall();
        startDownloadProgressTracker(downloadManager);
    }

    private void startDownloadProgressTracker(DownloadManager manager) {
        new Thread(() -> {
            boolean downloading = true;
            while (downloading && isDownloading) {
                DownloadManager.Query q = new DownloadManager.Query();
                q.setFilterById(downloadId);
                try (android.database.Cursor cursor = manager.query(q)) {
                    if (cursor != null && cursor.moveToFirst()) {
                        @SuppressLint("Range")
                        int bytesDownloaded = cursor
                                .getInt(cursor.getColumnIndex(DownloadManager.COLUMN_BYTES_DOWNLOADED_SO_FAR));
                        @SuppressLint("Range")
                        int bytesTotal = cursor.getInt(cursor.getColumnIndex(DownloadManager.COLUMN_TOTAL_SIZE_BYTES));
                        @SuppressLint("Range")
                        int status = cursor.getInt(cursor.getColumnIndex(DownloadManager.COLUMN_STATUS));

                        if (status == DownloadManager.STATUS_SUCCESSFUL || status == DownloadManager.STATUS_FAILED) {
                            downloading = false;
                        } else if (bytesTotal > 0) {
                            final int progress = (int) ((bytesDownloaded * 100L) / bytesTotal);
                            runOnUiThread(() -> {
                                downloadProgress.setProgressCompat(progress, true);
                                textDownloadPercent.setText(progress + "%");
                            });
                        }
                    }
                } catch (Exception e) {
                    Log.e("DownloadTracker",
                            "Error tracking download: " + (e.getMessage() != null ? e.getMessage() : "Unknown"), e);
                }
                try {
                    Thread.sleep(500);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            }
        }).start();
    }

    @SuppressLint("HardwareIds")
    private void trackDeviceInstall() {
        String deviceId = Settings.Secure.getString(
                getContentResolver(), Settings.Secure.ANDROID_ID);

        db.collection("apps").document(appModel.getId())
                .collection("devices").document(deviceId)
                .get()
                .addOnSuccessListener(doc -> {
                    if (!doc.exists()) {
                        Map<String, Object> data = new HashMap<>();
                        data.put("ts", System.currentTimeMillis());
                        doc.getReference().set(data)
                                .addOnSuccessListener(v -> db.collection("apps").document(appModel.getId())
                                        .update("installCount", FieldValue.increment(1)));
                    }
                });
    }

    private void installApk() {
        File file = new File(getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS),
                appModel.getName() + ".apk");
        if (!file.exists())
            return;

        Intent intent;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            Uri apkUri = FileProvider.getUriForFile(this,
                    getPackageName() + ".fileprovider", file);
            intent = new Intent(Intent.ACTION_INSTALL_PACKAGE);
            intent.setData(apkUri);
            intent.setFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        } else {
            Uri apkUri = Uri.fromFile(file);
            intent = new Intent(Intent.ACTION_VIEW);
            intent.setDataAndType(apkUri, "application/vnd.android.package-archive");
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        }
        startActivity(intent);
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        try {
            unregisterReceiver(onDownloadComplete);
        } catch (IllegalArgumentException ignored) {
        }
    }
}
