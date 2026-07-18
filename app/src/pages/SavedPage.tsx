import { useEffect, useState } from "react";
import { EmptyState } from "../components/ui/EmptyState";
import { PageHeader } from "../components/ui/PageHeader";
import { PostCard } from "../components/ui/PostCard";
import { useToast } from "../components/ui/ToastContext";
import { posts, type Post } from "../data/mockData";
import { getKnownPosts, getSavedPostIds, removeSavedPost, runDb } from "../storage/db";

export function SavedPage() {
  const { showToast } = useToast();
  const [savedIds, setSavedIds] = useState(posts.filter((post) => post.saved).map((post) => post.id));
  const [savedPosts, setSavedPosts] = useState<Post[]>(posts.filter((post) => post.saved));

  useEffect(() => {
    runDb(
      getSavedPostIds,
      [],
      () => showToast("Storage unavailable", "Saved posts could not be loaded.")
    ).then((ids) => {
      setSavedIds(ids);
      runDb(
        () => getKnownPosts(ids),
        [],
        () => showToast("Storage unavailable", "Saved post details could not be loaded.")
      ).then(setSavedPosts);
    });
  }, [showToast]);

  return (
    <section>
      <PageHeader
        title="Saved Posts"
        description="Pinned source posts that are worth turning into polished Threads drafts."
      />
      {savedPosts.length === 0 ? (
        <EmptyState
          icon="bookmark"
          title="No saved posts yet"
          description="When a source post feels worth revisiting, save it here so you can generate content later without searching the feed again."
        />
      ) : (
        <div className="space-y-6">
          {savedPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              showRemove
              onRemove={(postId) => {
                setSavedIds((current) => current.filter((id) => id !== postId));
                setSavedPosts((current) => current.filter((post) => post.id !== postId));
                runDb(
                  () => removeSavedPost(postId),
                  undefined,
                  () => showToast("Storage unavailable", "Saved post could not be removed.")
                );
                showToast("Removed from saved", "The post was removed from IndexedDB.");
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}
