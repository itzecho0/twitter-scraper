import type { Post } from "../data/mockData";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export type FetchPostsOptions = {
  search?: string;
  filter?: string;
  limit?: number;
};

export async function fetchPosts({
  search,
  filter = "latest",
  limit = 20
}: FetchPostsOptions = {}) {
  const params = new URLSearchParams();

  if (search?.trim()) {
    params.set("search", search.trim());
  }

  params.set("filter", filter);
  params.set("limit", String(limit));

  const response = await fetch(`${API_BASE_URL}/api/posts?${params.toString()}`);
  if (!response.ok) {
    const detail = await response.json().catch(() => null);
    throw new Error(detail?.detail ?? "Could not load X posts.");
  }

  return (await response.json()) as Post[];
}
