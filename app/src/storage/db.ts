import Dexie, { type Table } from "dexie";
import { generationSeed, posts, type HistoryItem, type Post } from "../data/mockData";

export type ContentStatus = "Draft" | "Ready" | "Posted" | "Archived";

export type SavedPostRecord = {
  postId: string;
  savedAt: string;
};

export type GenerationRecord = {
  id: string;
  postId: string;
  title: string;
  status: ContentStatus;
  currentRevisionId: string;
  updatedAt: string;
};

export type RevisionRecord = {
  id: string;
  generationId: string;
  version: number;
  content: string;
  createdAt: string;
  reason: string;
};

export type ConversationMessageRecord = {
  id: string;
  generationId: string;
  role: "assistant" | "user";
  text: string;
  createdAt: string;
};

export type BrandSettings = {
  brandPrompt: string;
  searchKeywords: string;
  sources: Record<string, boolean>;
  preferences: Record<string, boolean>;
  draftStyle: string;
  strictness: number;
};

export type SettingsRecord = {
  key: "brand";
  value: BrandSettings;
  updatedAt: string;
};

export type MetaRecord = {
  key: string;
  value: boolean | string | number;
};

export type SourcePostRecord = Post & {
  cachedAt: string;
};

type LegacySourcePost = Partial<Post> & {
  author?: string;
  fullDate?: string;
  preview?: string;
  content?: string;
  image?: string;
};

function normalizeStoredPost(value: LegacySourcePost | undefined): Post | null {
  if (!value?.id) {
    return null;
  }

  const body = value.body ?? value.content ?? value.preview ?? "";
  const authorName = value.authorName ?? value.author ?? "Unknown";
  return {
    id: value.id,
    heading: value.heading ?? value.preview ?? body.split(/(?<=[.!?])\s+/, 1)[0] ?? "Recent post from X",
    body,
    authorName,
    username: value.username ?? "@unknown",
    profileImage: value.profileImage,
    postedAt: value.postedAt ?? value.fullDate ?? "",
    relativeTime: value.relativeTime ?? "Recent",
    postImage: value.postImage ?? value.image,
    sourceUrl: value.sourceUrl ?? "https://x.com/",
    saved: value.saved
  };
}

export const defaultBrandSettings: BrandSettings = {
  brandPrompt:
    "Write like a thoughtful technology operator. Prefer direct language, concrete lessons, credible nuance, and practical takeaways. Avoid exaggerated claims, filler hype, and generic productivity phrasing.",
  searchKeywords: "OpenAI",
  sources: {
    "X technology feed": true,
    "Founder watchlist": true,
    "Saved post collection": true,
    "Manual research queue": true
  },
  preferences: {
    "Compact cards": true,
    "Open details in same tab": true,
    "Auto-scroll AI chat": true,
    "Show desktop shadows": true
  },
  draftStyle: "Concise operator",
  strictness: 70
};

class RonakAppDatabase extends Dexie {
  savedPosts!: Table<SavedPostRecord, string>;
  generations!: Table<GenerationRecord, string>;
  revisions!: Table<RevisionRecord, string>;
  conversationMessages!: Table<ConversationMessageRecord, string>;
  settings!: Table<SettingsRecord, string>;
  meta!: Table<MetaRecord, string>;
  sourcePosts!: Table<SourcePostRecord, string>;

  constructor() {
    super("ronak_frontend_app");
    this.version(1).stores({
      savedPosts: "postId, savedAt",
      generations: "id, &postId, status, updatedAt",
      revisions: "id, generationId, version, createdAt",
      conversationMessages: "id, generationId, createdAt",
      settings: "key",
      meta: "key"
    });
    this.version(2).stores({
      savedPosts: "postId, savedAt",
      generations: "id, &postId, status, updatedAt",
      revisions: "id, generationId, version, createdAt",
      conversationMessages: "id, generationId, createdAt",
      settings: "key",
      meta: "key",
      sourcePosts: "id, cachedAt, username"
    });
  }
}

export const db = new RonakAppDatabase();

export function nowIso() {
  return new Date().toISOString();
}

export function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function relativeUpdatedLabel(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.max(0, Math.round(diff / 60000));

  if (minutes < 1) {
    return "Updated just now";
  }

  if (minutes < 60) {
    return `Updated ${minutes}m ago`;
  }

  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return `Updated ${hours}h ago`;
  }

  return `Updated ${Math.round(hours / 24)}d ago`;
}

export function toHistoryItem(generation: GenerationRecord, revision?: RevisionRecord): HistoryItem {
  return {
    id: generation.id,
    postId: generation.postId,
    title: generation.title,
    updatedAt: relativeUpdatedLabel(generation.updatedAt),
    status: generation.status,
    excerpt: revision?.content.slice(0, 130) ?? "",
    version: `v${revision?.version ?? 1}`
  };
}

export async function ensureDatabaseDefaults() {
  await db.transaction("rw", db.settings, db.meta, db.savedPosts, async () => {
    const settings = await db.settings.get("brand");
    if (!settings) {
      await db.settings.put({
        key: "brand",
        value: defaultBrandSettings,
        updatedAt: nowIso()
      });
    }

    const savedSeeded = await db.meta.get("savedPostsSeeded");
    if (!savedSeeded) {
      await db.savedPosts.bulkPut(
        posts
          .filter((post) => post.saved)
          .map((post) => ({
            postId: post.id,
            savedAt: nowIso()
          }))
      );
      await db.meta.put({ key: "savedPostsSeeded", value: true });
    }
  });
}

export async function runDb<T>(operation: () => Promise<T>, fallback: T, onError?: (error: unknown) => void) {
  try {
    await ensureDatabaseDefaults();
    return await operation();
  } catch (error) {
    onError?.(error);
    return fallback;
  }
}

export async function getSavedPostIds() {
  const rows = await db.savedPosts.toArray();
  return rows.map((row) => row.postId);
}

export async function savePost(postId: string) {
  await db.savedPosts.put({ postId, savedAt: nowIso() });
}

export async function removeSavedPost(postId: string) {
  await db.savedPosts.delete(postId);
}

export async function getBrandSettings() {
  const settings = await db.settings.get("brand");
  return {
    ...defaultBrandSettings,
    ...settings?.value,
    sources: {
      ...defaultBrandSettings.sources,
      ...settings?.value?.sources
    },
    preferences: {
      ...defaultBrandSettings.preferences,
      ...settings?.value?.preferences
    }
  };
}

export async function saveBrandSettings(value: BrandSettings) {
  await db.settings.put({ key: "brand", value, updatedAt: nowIso() });
}

export async function cacheSourcePosts(items: Post[]) {
  const cachedAt = nowIso();
  await db.sourcePosts.bulkPut(items.map((post) => ({ ...post, cachedAt })));
}

export async function getCachedPost(postId: string) {
  return normalizeStoredPost(await db.sourcePosts.get(postId));
}

export async function getKnownPost(postId: string) {
  return (await getCachedPost(postId)) ?? posts.find((post) => post.id === postId) ?? null;
}

export async function getKnownPosts(postIds: string[]) {
  const cachedRows = (await db.sourcePosts.bulkGet(postIds)).map((post) => normalizeStoredPost(post));
  const mockRows = posts.filter((post) => postIds.includes(post.id));
  const byId = new Map<string, Post>();

  mockRows.forEach((post) => byId.set(post.id, post));
  cachedRows.forEach((post) => {
    if (post) {
      byId.set(post.id, post);
    }
  });

  return postIds.map((postId) => byId.get(postId)).filter((post): post is Post => Boolean(post));
}

export async function getGenerationByPostId(postId: string) {
  return db.generations.where("postId").equals(postId).first();
}

export async function getRevision(id: string) {
  return db.revisions.get(id);
}

export async function getRevisions(generationId: string) {
  return db.revisions.where("generationId").equals(generationId).sortBy("version");
}

export async function getConversation(generationId: string) {
  return db.conversationMessages.where("generationId").equals(generationId).sortBy("createdAt");
}

export async function createGeneration(postId: string, initialContent: string, reason = "Initial AI draft") {
  const post = await getKnownPost(postId);
  const timestamp = nowIso();
  const generationId = makeId("gen");
  const revisionId = makeId("rev");

  const generation: GenerationRecord = {
    id: generationId,
    postId,
    title: post ? `${post.authorName}'s technology post draft` : "Generated content draft",
    status: "Draft",
    currentRevisionId: revisionId,
    updatedAt: timestamp
  };

  const revision: RevisionRecord = {
    id: revisionId,
    generationId,
    version: 1,
    content: initialContent,
    createdAt: timestamp,
    reason
  };

  const messages: ConversationMessageRecord[] = generationSeed.messages.map((message, index) => ({
    ...message,
    id: makeId(`msg-${index + 1}`),
    generationId,
    createdAt: `${timestamp}-${index}`
  }));

  await db.transaction("rw", db.generations, db.revisions, db.conversationMessages, async () => {
    await db.generations.put(generation);
    await db.revisions.put(revision);
    await db.conversationMessages.bulkPut(messages);
  });

  return { generation, revisions: [revision], messages };
}

export async function updateGenerationStatus(generationId: string, status: ContentStatus) {
  await db.generations.update(generationId, { status, updatedAt: nowIso() });
}

export async function addRevision(generationId: string, content: string, reason: string) {
  const revisions = await getRevisions(generationId);
  const version = (revisions[revisions.length - 1]?.version ?? 0) + 1;
  const timestamp = nowIso();
  const revision: RevisionRecord = {
    id: makeId("rev"),
    generationId,
    version,
    content,
    createdAt: timestamp,
    reason
  };

  await db.transaction("rw", db.revisions, db.generations, async () => {
    await db.revisions.put(revision);
    await db.generations.update(generationId, {
      currentRevisionId: revision.id,
      status: "Draft",
      updatedAt: timestamp
    });
  });

  return revision;
}

export async function updateRevisionContent(revisionId: string, generationId: string, content: string) {
  const timestamp = nowIso();
  await db.transaction("rw", db.revisions, db.generations, async () => {
    await db.revisions.update(revisionId, { content });
    await db.generations.update(generationId, { updatedAt: timestamp });
  });
}

export async function restorePreviousRevision(generationId: string) {
  const revisions = await getRevisions(generationId);
  if (revisions.length <= 1) {
    return null;
  }

  const latest = revisions[revisions.length - 1];
  const previous = revisions[revisions.length - 2];

  if (!latest || !previous) {
    return null;
  }

  await db.transaction("rw", db.revisions, db.generations, async () => {
    await db.revisions.delete(latest.id);
    await db.generations.update(generationId, {
      currentRevisionId: previous.id,
      status: "Draft",
      updatedAt: nowIso()
    });
  });

  return previous;
}

export async function addConversationMessage(
  generationId: string,
  role: ConversationMessageRecord["role"],
  text: string
) {
  const message: ConversationMessageRecord = {
    id: makeId("msg"),
    generationId,
    role,
    text,
    createdAt: nowIso()
  };
  await db.conversationMessages.put(message);
  return message;
}

export async function getHistoryItems() {
  const generations = await db.generations.orderBy("updatedAt").reverse().toArray();
  const rows = await Promise.all(
    generations.map(async (generation) => toHistoryItem(generation, await getRevision(generation.currentRevisionId)))
  );
  return rows;
}

export async function deleteGeneration(generationId: string) {
  await db.transaction("rw", db.generations, db.revisions, db.conversationMessages, async () => {
    await db.generations.delete(generationId);
    await db.revisions.where("generationId").equals(generationId).delete();
    await db.conversationMessages.where("generationId").equals(generationId).delete();
  });
}
