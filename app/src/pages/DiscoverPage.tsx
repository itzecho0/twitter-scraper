import { useMemo, useState } from "react";
import { FilterControl } from "../components/ui/FilterControl";
import { Input } from "../components/ui/Input";
import { PageHeader } from "../components/ui/PageHeader";
import { PostCard } from "../components/ui/PostCard";
import { posts } from "../data/mockData";

export function DiscoverPage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("Latest");
  const [filterOpen, setFilterOpen] = useState(false);

  const filteredPosts = useMemo(() => {
    const base = posts.filter((post) =>
      `${post.author} ${post.username} ${post.preview} ${post.content}`
        .toLowerCase()
        .includes(query.toLowerCase())
    );

    if (filter === "Saved First") {
      return [...base].sort((a, b) => Number(Boolean(b.saved)) - Number(Boolean(a.saved)));
    }

    if (filter === "Images Only") {
      return base.filter((post) => Boolean(post.image));
    }

    return base;
  }, [filter, query]);

  return (
    <section>
      <PageHeader
        title="Discover Insights"
        description="A responsive feed of technology posts ready for review, saving, and AI-assisted drafting."
      />
      <div className="mb-8 flex flex-col gap-4 sm:flex-row">
        <div className="flex-1">
          <Input
            icon="search"
            placeholder="Search prompts, models, and concepts..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <FilterControl
          value={filter}
          open={filterOpen}
          options={["Latest", "Saved First", "Images Only"]}
          onOpenChange={setFilterOpen}
          onSelect={setFilter}
        />
      </div>
      <div className="space-y-6 lg:space-y-8">
        {filteredPosts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  );
}
