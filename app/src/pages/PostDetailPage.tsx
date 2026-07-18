import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { PageHeader } from "../components/ui/PageHeader";
import { useToast } from "../components/ui/ToastContext";
import { posts } from "../data/mockData";
import { getSavedPostIds, removeSavedPost, runDb, savePost } from "../storage/db";

export function PostDetailPage() {
  const { id } = useParams();
  const { showToast } = useToast();
  const post = posts.find((entry) => entry.id === id);
  const [saved, setSaved] = useState(Boolean(post?.saved));
  const [savedLoaded, setSavedLoaded] = useState(false);

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

  if (!post) {
    return <Navigate to="/discover" replace />;
  }

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
            <a href="https://x.com/" target="_blank" rel="noreferrer">
              <Button variant="secondary">Open on X</Button>
            </a>
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
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-container text-lg font-semibold text-primary">
                {post.avatar}
              </div>
              <div>
                <h2 className="font-display text-2xl font-semibold text-primary">{post.author}</h2>
                <p className="font-label text-[12px] uppercase tracking-[0.05em] text-on-surface-variant">
                  {post.username} • {post.relativeTime}
                </p>
                <p className="mt-2 text-sm text-on-surface-variant">{post.fullDate}</p>
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-surface-variant bg-surface p-6">
            <p className="text-lg leading-8 text-on-surface">{post.content}</p>
          </div>

          {post.image ? (
            <div className="mt-8 overflow-hidden rounded-2xl bg-surface-container">
              <img
                src={post.image}
                alt={post.imageAlt ?? post.author}
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
            <div>
              <p className="font-label text-[12px] uppercase tracking-[0.05em] text-on-surface-variant">
                URL
              </p>
              <p className="mt-2 break-all text-base text-on-surface">{post.sourceUrl}</p>
            </div>
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
