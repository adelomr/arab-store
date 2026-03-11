package com.arabstore.app;

import android.content.Context;
import android.content.Intent;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.DiffUtil;
import androidx.recyclerview.widget.RecyclerView;

import com.bumptech.glide.Glide;

import java.util.List;

public class AppAdapter extends RecyclerView.Adapter<AppAdapter.AppViewHolder> {

    private final List<AppModel> appList;
    private final Context context;

    public AppAdapter(List<AppModel> appList, Context context) {
        this.appList = appList;
        this.context = context;
    }

    @NonNull
    @Override
    public AppViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(context).inflate(R.layout.item_app, parent, false);
        return new AppViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull AppViewHolder holder, int position) {
        AppModel app = appList.get(position);
        holder.appName.setText(app.getName());

        // Description
        String desc = app.getShortDesc();
        if (desc != null && !desc.isEmpty()) {
            holder.appDescription.setText(desc);
            holder.appDescription.setVisibility(View.VISIBLE);
        } else {
            holder.appDescription.setVisibility(View.GONE);
        }

        // Size
        String size = app.getSize();
        if (size != null && !size.isEmpty()) {
            holder.appSize.setText(size);
        } else {
            holder.appSize.setText("—");
        }

        // Rating
        float rating = app.getRating();
        holder.appRating.setText(String.format("%.1f", rating));

        // Icon
        Glide.with(context)
                .load(app.getIconUrl())
                .placeholder(R.mipmap.ic_launcher)
                .into(holder.appIcon);

        holder.itemView.setOnClickListener(v -> {
            Intent intent = new Intent(context, AppDetailsActivity.class);
            intent.putExtra("app", app);
            context.startActivity(intent);
        });
    }

    @Override
    public int getItemCount() {
        return appList.size();
    }

    public void updateList(List<AppModel> newList) {
        DiffUtil.DiffResult diffResult = DiffUtil.calculateDiff(new DiffUtil.Callback() {
            @Override
            public int getOldListSize() {
                return appList.size();
            }

            @Override
            public int getNewListSize() {
                return newList.size();
            }

            @Override
            public boolean areItemsTheSame(int oldItemPosition, int newItemPosition) {
                return appList.get(oldItemPosition).getId().equals(newList.get(newItemPosition).getId());
            }

            @Override
            public boolean areContentsTheSame(int oldItemPosition, int newItemPosition) {
                AppModel oldApp = appList.get(oldItemPosition);
                AppModel newApp = newList.get(newItemPosition);
                return oldApp.getName().equals(newApp.getName()) &&
                        oldApp.getRating() == newApp.getRating() &&
                        (oldApp.getIconUrl() != null && oldApp.getIconUrl().equals(newApp.getIconUrl()));
            }
        });

        appList.clear();
        appList.addAll(newList);
        diffResult.dispatchUpdatesTo(this);
    }

    public static class AppViewHolder extends RecyclerView.ViewHolder {
        ImageView appIcon;
        TextView appName, appDescription, appSize, appRating;

        public AppViewHolder(@NonNull View itemView) {
            super(itemView);
            appIcon = itemView.findViewById(R.id.item_icon);
            appName = itemView.findViewById(R.id.item_name);
            appDescription = itemView.findViewById(R.id.item_description);
            appSize = itemView.findViewById(R.id.item_size);
            appRating = itemView.findViewById(R.id.item_rating);
        }
    }
}
