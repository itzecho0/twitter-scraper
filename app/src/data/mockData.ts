export type Post = {
  id: string;
  author: string;
  username: string;
  relativeTime: string;
  fullDate: string;
  avatar: string;
  preview: string;
  content: string;
  image?: string;
  imageAlt?: string;
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
    author: "Mina Chen",
    username: "@mina_builds",
    relativeTime: "18m ago",
    fullDate: "July 18, 2026 at 8:12 AM",
    avatar: "MC",
    preview:
      "RAG quality jumped after we stopped overloading prompts and started ranking chunks by task intent first.",
    content:
      "RAG quality jumped after we stopped overloading prompts and started ranking chunks by task intent first. Our best win was splitting retrieval into 'context to cite' and 'context to think with' instead of feeding every chunk to the model. The second change was forcing summaries into a fixed evidence template before generation. Lower token use, better grounding, and far fewer vague answers in production.",
    image:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Team reviewing dashboards on a glass wall in a bright workspace",
    sourceUrl: "https://x.com/mina_builds/status/1946413201001",
    saved: true
  },
  {
    id: "gpu-pipeline",
    author: "Devon Alvarez",
    username: "@devoninfra",
    relativeTime: "54m ago",
    fullDate: "July 18, 2026 at 7:36 AM",
    avatar: "DA",
    preview:
      "If your inference queue is stalling, inspect serialization and image preprocessing before buying more GPU.",
    content:
      "If your inference queue is stalling, inspect serialization and image preprocessing before buying more GPU. We found half the latency lived outside the model: PNG decoding, duplicate embeddings, and one retry loop that silently blocked batches. The fix was a boring systems pass, not a bigger cluster. Worth checking before scaling spend.",
    sourceUrl: "https://x.com/devoninfra/status/1946407710442"
  },
  {
    id: "threads-voice",
    author: "Ava Nwosu",
    username: "@avawritesai",
    relativeTime: "2h ago",
    fullDate: "July 18, 2026 at 6:01 AM",
    avatar: "AN",
    preview:
      "Brand voice systems work better when you store examples of what to avoid, not only what 'good' looks like.",
    content:
      "Brand voice systems work better when you store examples of what to avoid, not only what 'good' looks like. We now maintain a small anti-pattern library: overclaiming, generic CTA endings, fake authority phrasing, and sentence rhythms that feel like canned AI. That single addition tightened tone more than any prompt flourish.",
    image:
      "https://images.unsplash.com/photo-1516321165247-4aa89a48be28?auto=format&fit=crop&w=1200&q=80",
    imageAlt: "Notebook with writing notes beside a laptop and phone",
    sourceUrl: "https://x.com/avawritesai/status/1946391134127",
    saved: true
  },
  {
    id: "agent-observability",
    author: "Priya Raman",
    username: "@priyastack",
    relativeTime: "3h ago",
    fullDate: "July 18, 2026 at 4:49 AM",
    avatar: "PR",
    preview:
      "Agents become maintainable when every tool call has a human-readable reason attached to it in logs.",
    content:
      "Agents become maintainable when every tool call has a human-readable reason attached to it in logs. We added 'why this was chosen' messages next to every retrieval, scrape, and generation step. Debugging went from archaeology to product work. Teams trust agent output more when they can see the chain of intent, not just the result.",
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
