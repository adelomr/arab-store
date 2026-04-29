package com.arabstore.app;

import android.annotation.SuppressLint;
import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;
import com.bumptech.glide.Glide;
import com.arabstore.app.BuildConfig;
import com.google.android.gms.common.api.ApiException;
import com.google.android.libraries.identity.googleid.GetGoogleIdOption;
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential;
import com.google.android.material.button.MaterialButton;
import com.google.android.material.imageview.ShapeableImageView;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.auth.AuthCredential;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseUser;
import com.google.firebase.auth.GoogleAuthProvider;
import com.google.firebase.firestore.FirebaseFirestore;
import com.google.firebase.firestore.QueryDocumentSnapshot;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;
import org.json.JSONObject;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.AdView;
import com.google.android.gms.ads.MobileAds;
import androidx.credentials.CredentialManager;
import androidx.credentials.GetCredentialRequest;
import androidx.credentials.GetCredentialResponse;
import androidx.credentials.CustomCredential;
import androidx.credentials.exceptions.GetCredentialException;
import java.util.concurrent.Executor;
import java.util.concurrent.Executors;

public class MainActivity extends AppCompatActivity {

    private AppAdapter adapter;
    private List<AppModel> appList;
    private ProgressBar progressBar;
    private SwipeRefreshLayout swipeRefreshLayout;
    private FirebaseFirestore db;
    private FirebaseAuth mAuth;

    // UI Components
    private MaterialButton btnLogin;
    private ShapeableImageView userAvatar;

    @SuppressLint("UnspecifiedRegisterReceiverFlag")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Apply theme before super.onCreate and setContentView
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
        setContentView(R.layout.activity_main);

        mAuth = FirebaseAuth.getInstance();
        db = FirebaseFirestore.getInstance();

        initUI();
        loadApps();
        updateUI(mAuth.getCurrentUser());

        MobileAds.initialize(this, initializationStatus -> {
        });

        AdView adView = findViewById(R.id.adView);
        AdRequest adRequest = new AdRequest.Builder().build();
        adView.loadAd(adRequest);
    }

    private void initUI() {
        RecyclerView recyclerView = findViewById(R.id.recycler_apps);
        progressBar = findViewById(R.id.progress_bar);
        swipeRefreshLayout = findViewById(R.id.swipe_refresh);
        btnLogin = findViewById(R.id.btn_login);
        userAvatar = findViewById(R.id.user_avatar);
        com.google.android.material.bottomnavigation.BottomNavigationView bottomNav = findViewById(
                R.id.bottom_navigation);

        appList = new ArrayList<>();
        adapter = new AppAdapter(appList, this);
        
        // Responsive Layout: Use Grid on tablets/landscape, List on phones
        int spanCount = 1;
        int screenWidthDp = getResources().getConfiguration().screenWidthDp;
        if (screenWidthDp >= 720) {
            spanCount = 3; // Large tablets
        } else if (screenWidthDp >= 600) {
            spanCount = 2; // Small tablets
        }

        if (spanCount > 1) {
            recyclerView.setLayoutManager(new androidx.recyclerview.widget.GridLayoutManager(this, spanCount));
        } else {
            recyclerView.setLayoutManager(new LinearLayoutManager(this));
        }
        
        recyclerView.setAdapter(adapter);

        // Pull-to-refresh setup
        swipeRefreshLayout.setColorSchemeResources(
                R.color.google_blue,
                android.R.color.holo_green_dark,
                android.R.color.holo_orange_dark);
        swipeRefreshLayout.setOnRefreshListener(this::loadApps);

        btnLogin.setOnClickListener(v -> signIn());
        userAvatar.setOnClickListener(v -> showSettingsDialog());

        bottomNav.setOnItemSelectedListener(item -> {
            int itemId = item.getItemId();
            if (itemId == R.id.nav_home) {
                loadApps();
                return true;
            } else if (itemId == R.id.nav_apps) {
                // Already showing apps, maybe filter?
                return true;
            } else if (itemId == R.id.nav_search) {
                Toast.makeText(this, "البحث قيد التطوير", Toast.LENGTH_SHORT).show();
                return true;
            }
            return false;
        });
    }

    private void signIn() {
        CredentialManager credentialManager = CredentialManager.create(this);

        GetGoogleIdOption googleIdOption = new GetGoogleIdOption.Builder()
                .setFilterByAuthorizedAccounts(false)
                .setServerClientId("894788637306-q2cnfgp0hrqhgnb5ouvi39upupkff154.apps.googleusercontent.com")
                .setAutoSelectEnabled(true)
                .build();

        GetCredentialRequest request = new GetCredentialRequest.Builder()
                .addCredentialOption(googleIdOption)
                .build();

        Executor executor = Executors.newSingleThreadExecutor();

        credentialManager.getCredentialAsync(this, request, null, executor,
                new androidx.credentials.CredentialManagerCallback<GetCredentialResponse, GetCredentialException>() {
                    @Override
                    public void onResult(GetCredentialResponse result) {
                        androidx.credentials.Credential credential = result.getCredential();
                        if (credential instanceof CustomCredential && credential.getType()
                                .equals(GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL)) {
                            GoogleIdTokenCredential googleIdTokenCredential = GoogleIdTokenCredential
                                    .createFrom(((CustomCredential) credential).getData());
                            firebaseAuthWithGoogle(googleIdTokenCredential.getIdToken());
                        }
                    }

                    @Override
                    public void onError(GetCredentialException e) {
                        runOnUiThread(() -> Toast
                                .makeText(MainActivity.this, "فشل تسجيل الدخول: " + e.getMessage(), Toast.LENGTH_SHORT)
                                .show());
                    }
                });
    }

    private void firebaseAuthWithGoogle(String idToken) {
        AuthCredential credential = GoogleAuthProvider.getCredential(idToken, null);
        mAuth.signInWithCredential(credential)
                .addOnCompleteListener(this, task -> {
                    if (task.isSuccessful()) {
                        FirebaseUser user = mAuth.getCurrentUser();
                        updateUI(user);
                    } else {
                        Toast.makeText(MainActivity.this, "فشل المصادقة مع فيربيز", Toast.LENGTH_SHORT).show();
                    }
                });
    }

    private void updateUI(FirebaseUser user) {
        if (user != null) {
            btnLogin.setVisibility(View.GONE);
            userAvatar.setVisibility(View.VISIBLE);
            if (user.getPhotoUrl() != null) {
                Glide.with(this).load(user.getPhotoUrl()).into(userAvatar);
            }
        } else {
            btnLogin.setVisibility(View.VISIBLE);
            userAvatar.setVisibility(View.GONE);
        }
    }

    private void loadApps() {
        progressBar.setVisibility(View.VISIBLE);
        db.collection("apps")
                .get()
                .addOnCompleteListener(task -> {
                    progressBar.setVisibility(View.GONE);
                    swipeRefreshLayout.setRefreshing(false);
                    if (task.isSuccessful()) {
                        List<AppModel> newList = new ArrayList<>();
                        for (QueryDocumentSnapshot document : task.getResult()) {
                            AppModel app = document.toObject(AppModel.class);
                            if (app.getPackageName() != null && app.getPackageName().equals("com.arabstore.app"))
                                continue;
                            app.setId(document.getId());
                            newList.add(app);
                        }
                        adapter.updateList(newList);
                    } else {
                        String errMsg = task.getException() != null ? task.getException().getMessage()
                                : "Unknown error";
                        Toast.makeText(MainActivity.this, "Error: " + errMsg,
                                Toast.LENGTH_SHORT).show();
                    }
                });
    }

    private void showSettingsDialog() {
        com.google.android.material.bottomsheet.BottomSheetDialog dialog = new com.google.android.material.bottomsheet.BottomSheetDialog(
                this);
        View view = getLayoutInflater().inflate(R.layout.dialog_settings, null, false);
        dialog.setContentView(view);

        ShapeableImageView avatar = view.findViewById(R.id.dialog_user_avatar);
        TextView name = view.findViewById(R.id.dialog_user_name);
        TextView email = view.findViewById(R.id.dialog_user_email);
        com.google.android.material.switchmaterial.SwitchMaterial switchNotif = view
                .findViewById(R.id.switch_notifications);
        com.google.android.material.switchmaterial.SwitchMaterial switchAuto = view
                .findViewById(R.id.switch_auto_update);
        com.google.android.material.switchmaterial.SwitchMaterial switchDarkMode = view
                .findViewById(R.id.switch_dark_mode);
        TextView btnAbout = view.findViewById(R.id.btn_about);
        TextView btnShareStore = view.findViewById(R.id.btn_share_store);
        MaterialButton logout = view.findViewById(R.id.btn_logout);

        FirebaseUser user = mAuth.getCurrentUser();
        if (user != null) {
            name.setText(user.getDisplayName());
            email.setText(user.getEmail());
            if (user.getPhotoUrl() != null) {
                Glide.with(this).load(user.getPhotoUrl()).into(avatar);
            }
        }

        // Load saved settings
        android.content.SharedPreferences prefs = getSharedPreferences("settings", MODE_PRIVATE);
        switchNotif.setChecked(prefs.getBoolean("notif_enabled", true));
        switchAuto.setChecked(prefs.getBoolean("auto_update_enabled", false));

        // Dark mode initialization
        boolean isDarkMode = prefs.getBoolean("dark_mode", false);
        switchDarkMode.setChecked(isDarkMode);

        switchNotif.setOnCheckedChangeListener(
                (buttonView, isChecked) -> prefs.edit().putBoolean("notif_enabled", isChecked).apply());

        switchAuto.setOnCheckedChangeListener(
                (buttonView, isChecked) -> prefs.edit().putBoolean("auto_update_enabled", isChecked).apply());

        switchDarkMode.setOnCheckedChangeListener((buttonView, isChecked) -> {
            prefs.edit().putBoolean("dark_mode", isChecked).apply();
            if (isChecked) {
                androidx.appcompat.app.AppCompatDelegate
                        .setDefaultNightMode(androidx.appcompat.app.AppCompatDelegate.MODE_NIGHT_YES);
            } else {
                androidx.appcompat.app.AppCompatDelegate
                        .setDefaultNightMode(androidx.appcompat.app.AppCompatDelegate.MODE_NIGHT_NO);
            }
            dialog.dismiss();
            recreate();
        });

        btnAbout.setOnClickListener(v -> {
            new com.google.android.material.dialog.MaterialAlertDialogBuilder(this)
                    .setTitle("حول المتجر")
                    .setMessage(
                            "متجر العرب\n\nالإصدار " + BuildConfig.VERSION_NAME + "\n\nمتجر تطبيقات عربي احترافي.\n\nتصميم وبرمجة عادل جودة نوح")
                    .setPositiveButton("حسناً", null)
                    .show();
        });

        btnShareStore.setOnClickListener(v -> {
            Intent sendIntent = new Intent();
            sendIntent.setAction(Intent.ACTION_SEND);
            sendIntent.putExtra(Intent.EXTRA_TEXT,
                    "حمل أحدث التطبيقات الآمنة والموثوقة من متجر العرب مجاناً!\n\nرابط التحميل المباشر:\nhttps://arab-store-c33d9.web.app/store-item.html?id=com.arabstore.app");
            sendIntent.setType("text/plain");

            Intent shareIntent = Intent.createChooser(sendIntent, "مشاركة متجر العرب المتجر عبر...");
            startActivity(shareIntent);
            dialog.dismiss();
        });

        logout.setOnClickListener(v -> {
            mAuth.signOut();
            updateUI(null);
            dialog.dismiss();
            Toast.makeText(this, "تم تسجيل الخروج", Toast.LENGTH_SHORT).show();
        });

        dialog.show();
    }

}
