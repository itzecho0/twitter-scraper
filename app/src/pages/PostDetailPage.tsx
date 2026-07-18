import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { LoadingState } from "../components/ui/LoadingState";
import { PageHeader } from "../components/ui/PageHeader";
import { useToast } from "../components/ui/ToastContext";
import type { Post } from "../data/mockData";
import { getKnownPost, getSavedPostIds, removeSavedPost, runDb, savePost } from "../storage/db";
import { formatPostedAt, postInitials } from "../utils/post";

export function PostDetailPage() {
  const { id } = useParams();
  const { showToast } = useToast();
  const [post, setPost] = useState<Post | null>(null);
  const [postLoaded, setPostLoaded] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savedLoaded, setSavedLoaded] = useState(false);

  useEffect(() => {
    if (!id) {
      return;
    }

    setPostLoaded(false);
    runDb(
      () => getKnownPost(id),
      null,
      () => showToast("Storage unavailable", "Post details could not be loaded.")
    ).then((loadedPost) => {
      setPost(loadedPost);
      setPostLoaded(true);
    });
  }, [id, showToast]);

  useEffect(() => {
    if (!post) {
      return;
    }

    setSavedLoaded(false);
    runDb(
      getSavedPostIds,
      [],
      () => showToast("Storage unavailable", "Saved state could not be loaded.")
    ).then((savedIds) => {
      setSaved(savedIds.includes(post.id));
      setSavedLoaded(true);
    });
  }, [post, showToast]);

  if (!postLoaded) {
    return <LoadingState message="Loading post details..." detail="Looking up the selected source post." />;
  }

  if (!post) {
    return <Navigate to="/discover" replace />;
  }

  const hasSourceUrl = Boolean(post.sourceUrl && post.sourceUrl !== "https://x.com/");

  return (
    <section>
      <PageHeader
        title="Detailed Post"
        description="Review the complete source post before saving it or generating a Threads draft."
        actions={
          <>
            <Link to="/discover">
              <Button variant="secondary">Back to Discover</Button>
            </Link>
            <Button
              variant={saved ? "primary" : "secondary"}
              icon={<span className="material-symbols-outlined filled text-base">bookmark</span>}
              disabled={!savedLoaded}
              onClick={async () => {
                const nextSaved = !saved;
                setSaved(nextSaved);
                setSavedLoaded(true);
                await runDb(
                  () => (nextSaved ? savePost(post.id) : removeSavedPost(post.id)),
                  undefined,
                  () => showToast("Storage unavailable", "Saved state could not be updated.")
                );
                showToast(saved ? "Removed from saved" : "Post saved", "This will persist in IndexedDB.");
              }}
            >
              {!savedLoaded ? "Loading" : saved ? "Saved" : "Save Post"}
            </Button>
            {hasSourceUrl ? (
              <a href={post.sourceUrl} target="_blank" rel="noreferrer">
                <Button variant="secondary">Open on X</Button>
              </a>
            ) : null}
            <Link to={`/generate/${post.id}`}>
              <Button icon={<span className="material-symbols-outlined text-base">auto_awesome</span>}>
                Generate with AI
              </Button>
            </Link>
          </>
        }
      />

      <article className="overflow-hidden rounded-2xl border border-surface-variant bg-surface-container-lowest shadow-sm">
        <div className="p-5 sm:p-6 lg:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-surface-container text-lg font-semibold text-primary">
                {post.profileImage ? (
                  <img
                    src={post.profileImage}
                    alt={`${post.authorName} profile`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  postInitials(post.authorName)
                )}
              </div>
              <div>
                <h2 className="font-display text-2xl font-semibold text-primary">{post.authorName}</h2>
                <p className="font-label text-[12px] uppercase tracking-[0.05em] text-on-surface-variant">
                  {post.username} - {post.relativeTime}
                </p>
                {post.postedAt ? (
                  <p className="mt-2 text-sm text-on-surface-variant">{formatPostedAt(post.postedAt)}</p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-surface-variant bg-surface p-6">
            <h1 className="font-display text-3xl font-semibold leading-tight text-primary">{post.heading}</h1>
            <p className="mt-5 whitespace-pre-wrap text-lg leading-8 text-on-surface">{post.body}</p>
          </div>

          {post.postImage ? (
            <div className="mt-8 overflow-hidden rounded-2xl bg-surface-container">
              <img
                src={post.postImage}
                alt={`Image from ${post.authorName}'s X post`}
                className="max-h-[520px] w-full object-cover"
              />
            </div>
          ) : null}

          <div className="mt-8 grid gap-4 rounded-2xl border border-surface-variant bg-surface-container-low p-5 lg:grid-cols-3">
            <div>
              <p className="font-label text-[12px] uppercase tracking-[0.05em] text-on-surface-variant">
                Source
              </p>
              <p className="mt-2 text-base text-on-surface">X post</p>
            </div>
            {hasSourceUrl ? (
              <div>
                <p className="font-label text-[12px] uppercase tracking-[0.05em] text-on-surface-variant">
                  URL
                </p>
                <a
                  href={post.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 block break-all text-base text-secondary underline-offset-4 hover:underline"
                >
                  {post.sourceUrl}
                </a>
              </div>
            ) : null}
            <div>
              <p className="font-label text-[12px] uppercase tracking-[0.05em] text-on-surface-variant">
                Use case
              </p>
              <p className="mt-2 text-base text-on-surface">Source material for brand-safe Threads drafts</p>
            </div>
          </div>
        </div>
      </article>
    </section>
  );
}
