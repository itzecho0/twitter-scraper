import { Link } from "react-router-dom";
import type { Post } from "../../data/mockData";
import { Button } from "./Button";

type PostCardProps = {
  post: Post;
  showRemove?: boolean;
  onRemove?: (postId: string) => void;
};

export function PostCard({ post, showRemove, onRemove }: PostCardProps) {
  return (
    <article className="overflow-hidden rounded-2xl border border-surface-variant bg-surface-container-lowest transition hover:shadow-card">
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-container text-sm font-semibold text-primary">
              {post.avatar}
            </div>
            <div>
              <p className="font-display text-xl font-medium text-primary">{post.author}</p>
              <p className="font-label text-[12px] uppercase tracking-[0.05em] text-on-surface-variant">
                {post.username} • {post.relativeTime}
              </p>
            </div>
          </div>
        </div>
        <p className="mt-5 border-l-2 border-secondary pl-4 text-base leading-7 text-on-surface">
          {post.preview}
        </p>
        {post.image ? (
          <div className="mt-6 overflow-hidden rounded-xl bg-surface-container">
            <img
              src={post.image}
              alt={post.imageAlt ?? post.author}
              className="h-56 w-full object-cover sm:h-72"
            />
          </div>
        ) : null}
        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-surface-variant pt-4">
          <Link to={`/generate/${post.id}`}>
            <Button
              icon={<span className="material-symbols-outlined text-base">auto_awesome</span>}
            >
              Generate with AI
            </Button>
          </Link>
          <Link to={`/post/${post.id}`}>
            <Button variant="secondary">View Details</Button>
          </Link>
          {showRemove && onRemove ? (
            <Button variant="ghost" onClick={() => onRemove(post.id)}>
              Remove from Saved
            </Button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
