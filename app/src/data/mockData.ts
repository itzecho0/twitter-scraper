export type Post = {
  id: string;
  heading: string;
  body: string;
  authorName: string;
  username: string;
  profileImage?: string;
  postedAt: string;
  relativeTime: string;
  postImage?: string;
  sourceUrl: string;
  saved?: boolean;
};

export type HistoryItem = {
  id: string;
  postId: string;
  title: string;
  updatedAt: string;
  status: "Draft" | "Ready" | "Posted" | "Archived";
  excerpt: string;
  version: string;
};

export const posts: Post[] = [
  {
    id: "neural-ops-rag",
    heading: "Ranking retrieval chunks by task intent improved our RAG quality",
    body:
      "RAG quality jumped after we stopped overloading prompts and started ranking chunks by task intent first. Our best win was splitting retrieval into 'context to cite' and 'context to think with' instead of feeding every chunk to the model. The second change was forcing summaries into a fixed evidence template before generation. Lower token use, better grounding, and far fewer vague answers in production.",
    authorName: "Mina Chen",
    username: "@mina_builds",
    postedAt: "2026-07-18T08:12:00+05:30",
    relativeTime: "18m ago",
    postImage:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
    sourceUrl: "https://x.com/mina_builds/status/1946413201001",
    saved: true
  },
  {
    id: "gpu-pipeline",
    heading: "Inspect preprocessing before buying more GPU capacity for inference",
    body:
      "If your inference queue is stalling, inspect serialization and image preprocessing before buying more GPU. We found half the latency lived outside the model: PNG decoding, duplicate embeddings, and one retry loop that silently blocked batches. The fix was a boring systems pass, not a bigger cluster. Worth checking before scaling spend.",
    authorName: "Devon Alvarez",
    username: "@devoninfra",
    postedAt: "2026-07-18T07:36:00+05:30",
    relativeTime: "54m ago",
    sourceUrl: "https://x.com/devoninfra/status/1946407710442"
  },
  {
    id: "threads-voice",
    heading: "Brand voice improves when negative examples guide the system",
    body:
      "Brand voice systems work better when you store examples of what to avoid, not only what 'good' looks like. We now maintain a small anti-pattern library: overclaiming, generic CTA endings, fake authority phrasing, and sentence rhythms that feel like canned AI. That single addition tightened tone more than any prompt flourish.",
    authorName: "Ava Nwosu",
    username: "@avawritesai",
    postedAt: "2026-07-18T06:01:00+05:30",
    relativeTime: "2h ago",
    postImage:
      "https://images.unsplash.com/photo-1516321165247-4aa89a48be28?auto=format&fit=crop&w=1200&q=80",
    sourceUrl: "https://x.com/avawritesai/status/1946391134127",
    saved: true
  },
  {
    id: "agent-observability",
    heading: "Human-readable tool reasons make AI agents easier to maintain",
    body:
      "Agents become maintainable when every tool call has a human-readable reason attached to it in logs. We added 'why this was chosen' messages next to every retrieval, scrape, and generation step. Debugging went from archaeology to product work. Teams trust agent output more when they can see the chain of intent, not just the result.",
    authorName: "Priya Raman",
    username: "@priyastack",
    postedAt: "2026-07-18T04:49:00+05:30",
    relativeTime: "3h ago",
    sourceUrl: "https://x.com/priyastack/status/1946378870104"
  }
];

export const historyItems: HistoryItem[] = [
  {
    id: "hist-1",
    postId: "neural-ops-rag",
    title: "RAG grounding thread for technical founders",
    updatedAt: "Updated 12m ago",
    status: "Draft",
    excerpt:
      "Most teams don’t have a retrieval problem. They have a context packing problem...",
    version: "v3"
  },
  {
    id: "hist-2",
    postId: "threads-voice",
    title: "Brand voice anti-patterns carousel copy",
    updatedAt: "Updated 1h ago",
    status: "Ready",
    excerpt:
      "If your AI copy sounds polished but forgettable, your negative examples are probably missing...",
    version: "v5"
  },
  {
    id: "hist-3",
    postId: "agent-observability",
    title: "Observability post for operators",
    updatedAt: "Updated yesterday",
    status: "Posted",
    excerpt:
      "The moment our logs started including intent, product and engineering could debug together...",
    version: "v2"
  },
  {
    id: "hist-4",
    postId: "gpu-pipeline",
    title: "Latency checklist",
    updatedAt: "Updated 2 days ago",
    status: "Archived",
    excerpt:
      "Before scaling hardware, map every non-model step in the request path and benchmark it...",
    version: "v1"
  }
];

export const generationSeed = {
  content:
    "Most AI content teams are tuning prompts when they should be tuning evidence flow.\n\nWe recently cleaned up a retrieval pipeline by separating context the model should quote from context it should only reason over. That one change cut token load, reduced vague answers, and made our outputs feel much more grounded.\n\nIf your generated posts still sound slick but thin, look upstream. Better retrieval structure beats louder prompting almost every time.",
  refinements: [
    "Make it punchier",
    "More founder-focused",
    "Add one practical takeaway",
    "Shorter opening hook"
  ],
  messages: [
    {
      id: "m1",
      role: "assistant" as const,
      text: "Draft one is ready. I kept the tone practical and operator-friendly."
    },
    {
      id: "m2",
      role: "user" as const,
      text: "Tighten the opening and make it feel more native to Threads."
    },
    {
      id: "m3",
      role: "assistant" as const,
      text: "Try a first line with tension, then land one concrete systems lesson by the second paragraph."
    }
  ]
};
