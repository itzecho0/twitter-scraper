import type { Post } from "../data/mockData";

export type AiDraftResponse = {
  draft: string;
  model: string;
  mode: "generate" | "refine" | "regenerate";
};

type SourcePostPayload = {
  id: Post["id"];
  author: string;
  username: Post["username"];
  preview: string;
  content: string;
};

type GeneratePayload = {
  sourcePost: SourcePostPayload;
  brandSystemPrompt: string;
};

type RefinePayload = GeneratePayload & {
  currentDraft: string;
  userInstruction: string;
};

type RegeneratePayload = GeneratePayload & {
  currentDraft?: string;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

async function postJson<TPayload, TResponse>(path: string, payload: TPayload): Promise<TResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      typeof body?.detail === "string"
        ? body.detail
        : "The AI backend could not complete the request.";
    throw new Error(message);
  }

  return body as TResponse;
}

export function generateDraft(payload: GeneratePayload) {
  return postJson<GeneratePayload, AiDraftResponse>("/api/generate", payload);
}

export function refineDraft(payload: RefinePayload) {
  return postJson<RefinePayload, AiDraftResponse>("/api/refine", payload);
}

export function regenerateDraft(payload: RegeneratePayload) {
  return postJson<RegeneratePayload, AiDraftResponse>("/api/regenerate", payload);
}
