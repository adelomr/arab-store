package com.arabstore.app;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.RatingBar;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.DiffUtil;
import androidx.recyclerview.widget.RecyclerView;

import com.bumptech.glide.Glide;
import com.google.android.material.imageview.ShapeableImageView;

import java.text.SimpleDateFormat;
import java.util.List;
import java.util.Locale;

public class ReviewAdapter extends RecyclerView.Adapter<ReviewAdapter.ReviewViewHolder> {

    private final List<ReviewModel> reviewList;
    private final Context context;
    private final String currentUserId;
    private final OnReviewActionClickListener actionListener;
    private final SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy/MM/dd", Locale.getDefault());

    public interface OnReviewActionClickListener {
        void onReviewClicked(ReviewModel review);
    }

    public ReviewAdapter(List<ReviewModel> reviewList, Context context, String currentUserId,
            OnReviewActionClickListener actionListener) {
        this.reviewList = reviewList;
        this.context = context;
        this.currentUserId = currentUserId;
        this.actionListener = actionListener;
    }

    @NonNull
    @Override
    public ReviewViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(context).inflate(R.layout.item_review, parent, false);
        return new ReviewViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ReviewViewHolder holder, int position) {
        ReviewModel review = reviewList.get(position);
        holder.userName.setText(review.getUserName());
        holder.reviewText.setText(review.getText());
        holder.ratingBar.setRating(review.getRating());

        if (review.getCreatedAt() != null) {
            holder.reviewDate.setText(dateFormat.format(review.getCreatedAt()));
        }

        Glide.with(context)
                .load(review.getUserPhoto())
                .placeholder(R.mipmap.ic_launcher)
                .into(holder.userAvatar);

        if (currentUserId != null && currentUserId.equals(review.getUserId())) {
            holder.itemView.setOnClickListener(v -> {
                if (actionListener != null) {
                    actionListener.onReviewClicked(review);
                }
            });
            // highlight row lightly to indicate it's clickable
            if (holder.itemView instanceof com.google.android.material.card.MaterialCardView) {
                ((com.google.android.material.card.MaterialCardView) holder.itemView)
                        .setStrokeColor(
                                androidx.core.content.ContextCompat.getColorStateList(context, R.color.google_blue));
                ((com.google.android.material.card.MaterialCardView) holder.itemView).setStrokeWidth(4);
            }
        } else {
            holder.itemView.setOnClickListener(null);
            if (holder.itemView instanceof com.google.android.material.card.MaterialCardView) {
                ((com.google.android.material.card.MaterialCardView) holder.itemView)
                        .setStrokeColor(
                                androidx.core.content.ContextCompat.getColorStateList(context, R.color.borderColor));
                ((com.google.android.material.card.MaterialCardView) holder.itemView).setStrokeWidth(1);
            }
        }
    }

    @Override
    public int getItemCount() {
        return reviewList.size();
    }

    public void updateList(List<ReviewModel> newList) {
        DiffUtil.DiffResult diffResult = DiffUtil.calculateDiff(new DiffUtil.Callback() {
            @Override
            public int getOldListSize() {
                return reviewList.size();
            }

            @Override
            public int getNewListSize() {
                return newList.size();
            }

            @Override
            public boolean areItemsTheSame(int oldItemPosition, int newItemPosition) {
                return reviewList.get(oldItemPosition).getUserId().equals(newList.get(newItemPosition).getUserId());
            }

            @Override
            public boolean areContentsTheSame(int oldItemPosition, int newItemPosition) {
                ReviewModel oldRev = reviewList.get(oldItemPosition);
                ReviewModel newRev = newList.get(newItemPosition);
                return oldRev.getRating() == newRev.getRating() &&
                        (oldRev.getText() != null && oldRev.getText().equals(newRev.getText())) &&
                        (oldRev.getUserName() != null && oldRev.getUserName().equals(newRev.getUserName()));
            }
        });

        reviewList.clear();
        reviewList.addAll(newList);
        diffResult.dispatchUpdatesTo(this);
    }

    public static class ReviewViewHolder extends RecyclerView.ViewHolder {
        ShapeableImageView userAvatar;
        TextView userName, reviewDate, reviewText;
        RatingBar ratingBar;

        public ReviewViewHolder(@NonNull View itemView) {
            super(itemView);
            userAvatar = itemView.findViewById(R.id.review_user_avatar);
            userName = itemView.findViewById(R.id.review_user_name);
            reviewDate = itemView.findViewById(R.id.review_date);
            reviewText = itemView.findViewById(R.id.review_text);
            ratingBar = itemView.findViewById(R.id.review_rating_bar);
        }
    }
}
