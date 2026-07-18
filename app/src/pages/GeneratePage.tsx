import { useEffect, useMemo, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { generateDraft, refineDraft, regenerateDraft } from "../api/aiClient";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { LoadingState } from "../components/ui/LoadingState";
import { PageHeader } from "../components/ui/PageHeader";
import { StatusBadge } from "../components/ui/StatusBadge";
import { useToast } from "../components/ui/ToastContext";
import { generationSeed, type Post } from "../data/mockData";
import {
  addConversationMessage,
  addRevision,
  createGeneration,
  getBrandSettings,
  getConversation,
  getGenerationByPostId,
  getKnownPost,
  getRevision,
  getRevisions,
  restorePreviousRevision,
  runDb,
  updateGenerationStatus,
  updateRevisionContent,
  type ContentStatus,
  type GenerationRecord,
  type RevisionRecord
} from "../storage/db";
import { copyText } from "../utils/clipboard";

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
};

function sourcePayload(post: Post) {
  return {
    id: post.id,
    author: post.authorName,
    username: post.username,
    preview: post.heading,
    content: post.body
  };
}

export function GeneratePage() {
  const { id } = useParams();
  const { showToast } = useToast();
  const [post, setPost] = useState<Post | null>(null);
  const [postLoaded, setPostLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [aiBusy, setAiBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [generation, setGeneration] = useState<GenerationRecord | null>(null);
  const [revisions, setRevisions] = useState<RevisionRecord[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<ContentStatus>("Draft");
  const [version, setVersion] = useState(1);
  const [activeRevisionId, setActiveRevisionId] = useState<string | null>(null);

  const quickControls = useMemo(() => generationSeed.refinements, []);

  const loadOrGenerate = async () => {
    if (!id) {
      return;
    }

    setIsLoading(true);
    setPostLoaded(false);
    setError(null);
    setDraft("");
    setGeneration(null);
    setRevisions([]);
    setChatMessages([]);
    setStatus("Draft");
    setVersion(1);
    setActiveRevisionId(null);

    const data = await runDb(
      async () => {
        const loadedPost = await getKnownPost(id);
        if (!loadedPost) {
          return null;
        }

        const existingGeneration = await getGenerationByPostId(id);
        if (existingGeneration) {
          const existingRevisions = await getRevisions(existingGeneration.id);
          const existingMessages = await getConversation(existingGeneration.id);
          return {
            post: loadedPost,
            generation: existingGeneration,
            revisions: existingRevisions,
            messages: existingMessages,
            currentRevision: await getRevision(existingGeneration.currentRevisionId)
          };
        }

        const settings = await getBrandSettings();
        const response = await generateDraft({
          sourcePost: sourcePayload(loadedPost),
          brandSystemPrompt: settings.brandPrompt
        });
        const created = await createGeneration(id, response.draft, `Initial AI draft via ${response.model}`);
        return {
          ...created,
          post: loadedPost,
          currentRevision: await getRevision(created.generation.currentRevisionId)
        };
      },
      null,
      (error) => {
        const message = error instanceof Error ? error.message : "Generation could not be loaded.";
        setError(message);
        showToast("Generation failed", message);
      }
    );

    if (!data) {
      setPost(null);
      setPostLoaded(true);
      setIsLoading(false);
      return;
    }

    const currentRevision = data.currentRevision ?? data.revisions[data.revisions.length - 1];
    setPost(data.post);
    setPostLoaded(true);
    setGeneration(data.generation);
    setRevisions(data.revisions);
    setDraft(currentRevision?.content ?? "");
    setVersion(currentRevision?.version ?? 1);
    setActiveRevisionId(currentRevision?.id ?? null);
    setStatus(data.generation.status);
    setChatMessages(data.messages.length > 0 ? data.messages : []);
    setIsLoading(false);
  };

  useEffect(() => {
    loadOrGenerate();
  }, [id]);

  useEffect(() => {
    if (!generation || !activeRevisionId || isLoading) {
      return;
    }

    const timer = window.setTimeout(() => {
      runDb(
        () => updateRevisionContent(activeRevisionId, generation.id, draft),
        undefined,
        () => showToast("Storage unavailable", "Draft edit could not be saved.")
      );
    }, 450);

    return () => window.clearTimeout(timer);
  }, [activeRevisionId, draft, generation, isLoading, showToast]);

  if (postLoaded && !post) {
    return <Navigate to="/discover" replace />;
  }

  if (!post) {
    return <LoadingState message="Loading selected post..." detail="Preparing the source post for generation." />;
  }

  const characterCount = draft.length;

  const applyRevision = async (content: string, reason: string) => {
    if (!generation) {
      return null;
    }

    const revision = await runDb(
      () => addRevision(generation.id, content, reason),
      null,
      () => showToast("Storage unavailable", "Revision could not be saved.")
    );

    if (!revision) {
      return null;
    }

    setDraft(revision.content);
    setRevisions((current) => [...current, revision]);
    setVersion(revision.version);
    setActiveRevisionId(revision.id);
    setStatus("Draft");
    setGeneration((current) =>
      current
        ? { ...current, status: "Draft", currentRevisionId: revision.id, updatedAt: revision.createdAt }
        : current
    );
    return revision;
  };

  const syncGenerationStatus = (nextStatus: ContentStatus) => {
    setStatus(nextStatus);
    if (!generation) {
      return;
    }

    setGeneration((current) => (current ? { ...current, status: nextStatus } : current));
    runDb(
      () => updateGenerationStatus(generation.id, nextStatus),
      undefined,
      () => showToast("Storage unavailable", "Status could not be saved.")
    );
  };

  const pushMessage = async (role: ChatMessage["role"], text: string) => {
    if (generation) {
      const stored = await runDb(
        () => addConversationMessage(generation.id, role, text),
        null,
        () => showToast("Storage unavailable", "Conversation message could not be saved.")
      );
      if (stored) {
        setChatMessages((current) => [...current, stored]);
        return;
      }
    }

    setChatMessages((current) => [...current, { id: `m-${Date.now()}`, role, text }]);
  };

  const runAiAction = async (
    label: string,
    action: (brandPrompt: string) => Promise<{ draft: string; model: string }>,
    reason: string
  ) => {
    if (!generation) {
      return;
    }

    setAiBusy(true);
    setError(null);
    try {
      const settings = await runDb(
        getBrandSettings,
        null,
        () => showToast("Storage unavailable", "Brand settings could not be loaded.")
      );
      if (!settings) {
        throw new Error("Brand settings could not be loaded.");
      }

      const response = await action(settings.brandPrompt);
      await applyRevision(response.draft, `${reason} via ${response.model}`);
      await pushMessage("assistant", response.draft);
      showToast(label, "A new AI revision was saved to IndexedDB.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "The AI backend request failed.";
      setError(message);
      showToast("AI request failed", message);
    } finally {
      setAiBusy(false);
    }
  };

  const handleRegenerate = () => {
    runAiAction(
      "Regenerated",
      (brandPrompt) =>
        regenerateDraft({
          sourcePost: sourcePayload(post),
          brandSystemPrompt: brandPrompt,
          currentDraft: draft
        }),
      "Regenerated AI content"
    );
  };

  const handleUndo = () => {
    if (!generation || revisions.length <= 1) {
      return;
    }

    runDb(
      () => restorePreviousRevision(generation.id),
      null,
      () => showToast("Storage unavailable", "Undo could not be saved.")
    ).then((previous) => {
      if (!previous) {
        return;
      }

      setRevisions((current) => current.slice(0, -1));
      setDraft(previous.content);
      setVersion(previous.version);
      setActiveRevisionId(previous.id);
      setStatus("Draft");
      setGeneration((current) =>
        current ? { ...current, status: "Draft", currentRevisionId: previous.id } : current
      );
      showToast("Undo applied", "Restored the previous saved revision.");
    });
  };

  const handleRefinement = (refinement: string) => {
    runAiAction(
      "Refinement applied",
      (brandPrompt) =>
        refineDraft({
          sourcePost: sourcePayload(post),
          brandSystemPrompt: brandPrompt,
          currentDraft: draft,
          userInstruction: refinement
        }),
      refinement
    );
  };

  const handleCopy = async () => {
    await copyText(draft);
    showToast("Copied", "Generated content copied to the clipboard.");
  };

  const handleSave = () => {
    if (generation && activeRevisionId) {
      runDb(
        () => updateRevisionContent(activeRevisionId, generation.id, draft),
        undefined,
        () => showToast("Storage unavailable", "Draft could not be saved.")
      );
    }
    showToast("Draft saved", "Saved to IndexedDB.");
  };

  const handleNewVersion = () => {
    runAiAction(
      "New version created",
      (brandPrompt) =>
        regenerateDraft({
          sourcePost: sourcePayload(post),
          brandSystemPrompt: brandPrompt,
          currentDraft: draft
        }),
      "New AI version"
    );
  };

  const handleSend = async () => {
    const instruction = message.trim();
    if (!instruction) {
      return;
    }

    await pushMessage("user", instruction);
    setMessage("");
    runAiAction(
      "AI chat response",
      (brandPrompt) =>
        refineDraft({
          sourcePost: sourcePayload(post),
          brandSystemPrompt: brandPrompt,
          currentDraft: draft,
          userInstruction: instruction
        }),
      `AI chat instruction: ${instruction}`
    );
  };

  return (
    <section>
      <PageHeader
        title="AI Content Generation"
        description="AI-backed drafting workflow based on the selected source post."
      />

      {isLoading ? (
        <LoadingState
          message="Creating content in your brand voice..."
          detail="Calling the backend AI API and preparing the first saved revision."
        />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.9fr)]">
          <div className="space-y-6">
            <div className="rounded-2xl border border-surface-variant bg-surface-container-lowest p-5 shadow-sm sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-label text-[12px] uppercase tracking-[0.05em] text-on-surface-variant">
                    Draft workspace - version {version}
                  </p>
                  <p className="mt-2 text-base text-on-surface-variant">
                    Editable Threads copy with responsive actions and AI refinement tools.
                  </p>
                </div>
                <div className="rounded-full bg-surface-container px-3 py-1.5 font-label text-[11px] uppercase tracking-[0.05em] text-on-surface-variant">
                  {characterCount} characters
                </div>
                <StatusBadge status={status} />
              </div>

              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                disabled={aiBusy}
                className="mt-6 min-h-[340px] w-full rounded-2xl border border-surface-variant bg-surface px-4 py-4 text-base leading-7 text-on-surface outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/15 disabled:opacity-70"
              />

              {error ? (
                <div className="mt-4 rounded-xl border border-error/40 bg-error-container px-4 py-3 text-sm leading-6 text-on-error-container">
                  <p>{error}</p>
                  <Button variant="secondary" className="mt-3" onClick={loadOrGenerate} disabled={aiBusy}>
                    Retry
                  </Button>
                </div>
              ) : null}

              <div className="mt-5 flex flex-wrap gap-3">
                <Button variant="secondary" onClick={handleCopy} disabled={aiBusy || !draft}>
                  Copy
                </Button>
                <Button variant="secondary" onClick={handleSave} disabled={aiBusy || !draft}>
                  Save
                </Button>
                <Button variant="secondary" onClick={handleRegenerate} disabled={aiBusy || !generation}>
                  {aiBusy ? "Working..." : "Regenerate"}
                </Button>
                <Button variant="secondary" onClick={handleUndo} disabled={aiBusy || revisions.length <= 1}>
                  Undo
                </Button>
                <Button variant="secondary" onClick={handleNewVersion} disabled={aiBusy || !generation}>
                  New Version
                </Button>
                <Button
                  disabled={aiBusy || !generation}
                  onClick={() => {
                    syncGenerationStatus("Ready");
                    showToast("Marked as ready", "This draft status was saved.");
                  }}
                >
                  Mark as Ready
                </Button>
              </div>
            </div>

            <div className="rounded-2xl border border-surface-variant bg-surface-container-lowest p-5 shadow-sm sm:p-6">
              <p className="font-label text-[12px] uppercase tracking-[0.05em] text-on-surface-variant">
                Quick refinements
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                {quickControls.map((label) => (
                  <Button
                    key={label}
                    variant="secondary"
                    onClick={() => handleRefinement(label)}
                    disabled={aiBusy || !generation || !draft}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <aside className="rounded-2xl border border-surface-variant bg-surface-container-lowest p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-label text-[12px] uppercase tracking-[0.05em] text-on-surface-variant">
                  AI conversation
                </p>
                <p className="mt-2 text-base text-on-surface-variant">
                  Ask for a rewrite, a different angle, or a sharper hook.
                </p>
              </div>
              <span className="material-symbols-outlined text-secondary">forum</span>
            </div>

            <div className="mt-6 space-y-4">
              {chatMessages.length === 0 ? (
                <div className="rounded-2xl bg-surface-container px-4 py-3 text-sm leading-6 text-on-surface-variant">
                  The conversation will appear here after you refine the draft.
                </div>
              ) : (
                chatMessages.map((entry) => (
                  <div
                    key={entry.id}
                    className={`rounded-2xl px-4 py-3 ${
                      entry.role === "assistant"
                        ? "bg-surface-container text-on-surface"
                        : "ml-8 bg-primary text-on-primary"
                    }`}
                  >
                    <p className="font-label text-[11px] uppercase tracking-[0.05em] opacity-70">
                      {entry.role === "assistant" ? "AI Assistant" : "You"}
                    </p>
                    <p className="mt-2 text-sm leading-6">{entry.text}</p>
                  </div>
                ))
              )}
            </div>

            <div className="mt-6 space-y-3">
              <Input
                placeholder="Ask for a rewrite, shorter hook, or stronger CTA..."
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                disabled={aiBusy || !generation || !draft}
              />
              <Button className="w-full" onClick={handleSend} disabled={aiBusy || !generation || !draft}>
                {aiBusy ? "Working..." : "Send message"}
              </Button>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}
