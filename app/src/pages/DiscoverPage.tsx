import { useEffect, useMemo, useState } from "react";
import { fetchPosts } from "../api/postsClient";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { FilterControl } from "../components/ui/FilterControl";
import { Input } from "../components/ui/Input";
import { LoadingState } from "../components/ui/LoadingState";
import { PageHeader } from "../components/ui/PageHeader";
import { PostCard } from "../components/ui/PostCard";
import { useToast } from "../components/ui/ToastContext";
import { posts, type Post } from "../data/mockData";
import { cacheSourcePosts, getBrandSettings, getSavedPostIds, runDb } from "../storage/db";

export function DiscoverPage() {
  const { showToast } = useToast();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("Latest");
  const [filterOpen, setFilterOpen] = useState(false);
  const [feedPosts, setFeedPosts] = useState<Post[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);

  const loadPosts = async (searchText = query) => {
    setLoading(true);
    setError(null);
    try {
      const settings = await runDb(getBrandSettings, null);
      const effectiveQuery = searchText.trim() || settings?.searchKeywords || undefined;
      const livePosts = await fetchPosts({ search: effectiveQuery, filter: "latest", limit: 20 });
      setFeedPosts(livePosts);
      setUsingFallback(false);
      await runDb(
        () => cacheSourcePosts(livePosts),
        undefined,
        () => showToast("Storage unavailable", "Live posts could not be cached.")
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Backend unavailable.";
      setError(message);
      setFeedPosts(posts);
      setUsingFallback(true);
      showToast("Using mock feed", "The local backend could not load X posts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runDb(
      getSavedPostIds,
      [],
      () => showToast("Storage unavailable", "Saved state could not be loaded.")
    ).then(setSavedIds);
    loadPosts("");
  }, []);

  const filteredPosts = useMemo(() => {
    const base = usingFallback
      ? feedPosts.filter((post) =>
          `${post.authorName} ${post.username} ${post.heading} ${post.body}`
            .toLowerCase()
            .includes(query.toLowerCase())
        )
      : feedPosts;

    if (filter === "Saved First") {
      return [...base].sort((a, b) => Number(savedIds.includes(b.id)) - Number(savedIds.includes(a.id)));
    }

    if (filter === "Images Only") {
      return base.filter((post) => Boolean(post.postImage));
    }

    return base;
  }, [feedPosts, filter, query, savedIds, usingFallback]);

  return (
    <section>
      <PageHeader
        title="Discover Insights"
        description="A responsive feed of technology posts ready for review, saving, and AI-assisted drafting."
        actions={
          <Button
            variant="secondary"
            icon={<span className="material-symbols-outlined text-base">refresh</span>}
            onClick={() => loadPosts(query)}
            disabled={loading}
          >
            Refresh
          </Button>
        }
      />
      <div className="mb-8 flex flex-col gap-4 sm:flex-row">
        <div className="flex-1">
          <Input
            icon="search"
            placeholder="Search prompts, models, and concepts..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                loadPosts(query);
              }
            }}
          />
        </div>
        <Button variant="secondary" onClick={() => loadPosts(query)} disabled={loading}>
          Search
        </Button>
        <FilterControl
          value={filter}
          open={filterOpen}
          options={["Latest", "Saved First", "Images Only"]}
          onOpenChange={setFilterOpen}
          onSelect={setFilter}
        />
      </div>
      {loading ? (
        <LoadingState
          message="Loading recent X posts..."
          detail="Searching the local FastAPI backend through Apify."
        />
      ) : (
        <>
          {error ? (
            <div className="mb-6 rounded-2xl border border-error/40 bg-error-container px-4 py-3 text-sm leading-6 text-on-error-container">
              <p>{usingFallback ? `${error} Showing mock development posts instead.` : error}</p>
              <Button variant="secondary" className="mt-3" onClick={() => loadPosts(query)}>
                Retry
              </Button>
            </div>
          ) : null}

          {filteredPosts.length === 0 ? (
            <EmptyState
              icon="travel_explore"
              title="No posts found"
              description="Try a broader technology keyword or refresh once X has newer matching posts."
              actionLabel="Refresh"
              onAction={() => loadPosts(query)}
            />
          ) : (
            <div className="space-y-6 lg:space-y-8">
              {filteredPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
