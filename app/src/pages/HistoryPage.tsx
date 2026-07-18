import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { ConfirmationModal } from "../components/ui/ConfirmationModal";
import { EmptyState } from "../components/ui/EmptyState";
import { PageHeader } from "../components/ui/PageHeader";
import { StatusBadge } from "../components/ui/StatusBadge";
import { useToast } from "../components/ui/ToastContext";
import type { HistoryItem } from "../data/mockData";
import {
  deleteGeneration,
  getHistoryItems,
  runDb,
  updateGenerationStatus,
  type ContentStatus
} from "../storage/db";
import { copyText } from "../utils/clipboard";

const statuses: ContentStatus[] = ["Draft", "Ready", "Posted", "Archived"];

export function HistoryPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [pendingDelete, setPendingDelete] = useState<HistoryItem | null>(null);

  const loadHistory = () => {
    runDb(
      getHistoryItems,
      [],
      () => showToast("Storage unavailable", "History could not be loaded.")
    ).then(setItems);
  };

  useEffect(loadHistory, [showToast]);

  const cycleStatus = (itemId: string) => {
    const currentItem = items.find((item) => item.id === itemId);
    if (!currentItem) {
      return;
    }

    const currentIndex = statuses.indexOf(currentItem.status);
    const nextStatus = statuses[(currentIndex + 1) % statuses.length];
    setItems((current) =>
      current.map((item) => {
        if (item.id !== itemId) {
          return item;
        }

        return { ...item, status: nextStatus };
      })
    );
    runDb(
      () => updateGenerationStatus(itemId, nextStatus),
      undefined,
      () => showToast("Storage unavailable", "Status could not be persisted.")
    );
    showToast("Status updated", `Changed to ${nextStatus}.`);
  };

  const handleCopy = async (item: HistoryItem) => {
    await copyText(item.excerpt);
    showToast("Copied", `${item.title} copied to the clipboard.`);
  };

  return (
    <section>
      <PageHeader
        title="History"
        description="Generated draft records with mock lifecycle status, quick actions, and responsive list behaviour."
      />
      {items.length === 0 ? (
        <EmptyState
          icon="history"
          title="No generation history yet"
          description="Once you generate content, each version will show up here so you can resume, copy, or archive it."
        />
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-surface-variant bg-surface-container-lowest p-5 shadow-sm sm:p-6"
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <StatusBadge status={item.status} />
                    <span className="font-label text-[11px] uppercase tracking-[0.05em] text-on-surface-variant">
                      {item.version}
                    </span>
                    <span className="font-label text-[11px] uppercase tracking-[0.05em] text-on-surface-variant">
                      {item.updatedAt}
                    </span>
                  </div>
                  <h2 className="font-display text-2xl font-semibold text-primary">{item.title}</h2>
                  <p className="max-w-3xl text-base leading-7 text-on-surface-variant">{item.excerpt}</p>
                </div>

                <div className="flex flex-wrap gap-3 lg:justify-end">
                  <Link to={`/generate/${item.postId}`}>
                    <Button>Continue Editing</Button>
                  </Link>
                  <Button variant="secondary" onClick={() => handleCopy(item)}>
                    Copy
                  </Button>
                  <Button variant="secondary" onClick={() => cycleStatus(item.id)}>
                    Change Status
                  </Button>
                  <Button variant="danger" onClick={() => setPendingDelete(item)}>
                    Delete
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <ConfirmationModal
        open={Boolean(pendingDelete)}
        title="Delete history item?"
        description="This removes the mock history record from the current frontend session."
        confirmLabel="Delete"
        onConfirm={() => {
          if (pendingDelete) {
            setItems((current) => current.filter((item) => item.id !== pendingDelete.id));
            runDb(
              () => deleteGeneration(pendingDelete.id),
              undefined,
              () => showToast("Storage unavailable", "History item could not be deleted.")
            );
            showToast("History item deleted", pendingDelete.title);
          }
          setPendingDelete(null);
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </section>
  );
}
