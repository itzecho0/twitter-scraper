import { useEffect, useState, type ReactNode } from "react";
import { Button } from "../components/ui/Button";
import { ConfirmationModal } from "../components/ui/ConfirmationModal";
import { PageHeader } from "../components/ui/PageHeader";
import { useToast } from "../components/ui/ToastContext";
import { defaultBrandSettings, getBrandSettings, runDb, saveBrandSettings } from "../storage/db";

type SectionId = "brand" | "sources" | "ai" | "preferences";

type SettingsSectionProps = {
  id: SectionId;
  title: string;
  open: boolean;
  onToggle: (id: SectionId) => void;
  children: ReactNode;
};

function SettingsSection({ id, title, open, onToggle, children }: SettingsSectionProps) {
  return (
    <section className="rounded-2xl border border-surface-variant bg-surface-container-lowest p-5 shadow-sm sm:p-6">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-4 text-left"
        onClick={() => onToggle(id)}
        aria-expanded={open}
      >
        <h2 className="font-display text-2xl font-semibold text-primary">{title}</h2>
        <span className="material-symbols-outlined text-on-surface-variant">
          {open ? "expand_less" : "expand_more"}
        </span>
      </button>
      {open ? <div className="mt-5">{children}</div> : null}
    </section>
  );
}

export function SettingsPage() {
  const { showToast } = useToast();
  const [resetOpen, setResetOpen] = useState(false);
  const [testOpen, setTestOpen] = useState(false);
  const [openSections, setOpenSections] = useState<Record<SectionId, boolean>>({
    brand: true,
    sources: true,
    ai: true,
    preferences: true
  });
  const [brandPrompt, setBrandPrompt] = useState(defaultBrandSettings.brandPrompt);
  const [sourceState, setSourceState] = useState<Record<string, boolean>>(defaultBrandSettings.sources);
  const [preferences, setPreferences] = useState<Record<string, boolean>>(defaultBrandSettings.preferences);
  const [draftStyle, setDraftStyle] = useState(defaultBrandSettings.draftStyle);
  const [strictness, setStrictness] = useState(defaultBrandSettings.strictness);
  const [testInput, setTestInput] = useState("Turn an infrastructure lesson into a practical Threads post.");
  const [testOutput, setTestOutput] = useState("");

  const toggleSection = (id: SectionId) => {
    setOpenSections((current) => ({ ...current, [id]: !current[id] }));
  };

  useEffect(() => {
    runDb(
      getBrandSettings,
      defaultBrandSettings,
      () => showToast("Storage unavailable", "Settings could not be loaded.")
    ).then((settings) => {
      setBrandPrompt(settings.brandPrompt);
      setSourceState(settings.sources);
      setPreferences(settings.preferences);
      setDraftStyle(settings.draftStyle);
      setStrictness(settings.strictness);
    });
  }, [showToast]);

  const persistSettings = async () => {
    await runDb(
      () =>
        saveBrandSettings({
          brandPrompt,
          sources: sourceState,
          preferences,
          draftStyle,
          strictness
        }),
      undefined,
      () => showToast("Storage unavailable", "Settings could not be saved.")
    );
  };

  const resetPreferences = () => {
    setBrandPrompt(defaultBrandSettings.brandPrompt);
    setSourceState(defaultBrandSettings.sources);
    setPreferences(defaultBrandSettings.preferences);
    setDraftStyle(defaultBrandSettings.draftStyle);
    setStrictness(defaultBrandSettings.strictness);
    runDb(
      () => saveBrandSettings(defaultBrandSettings),
      undefined,
      () => showToast("Storage unavailable", "Settings reset could not be saved.")
    );
    setResetOpen(false);
    showToast("Preferences reset", "Default settings were saved to IndexedDB.");
  };

  const runBrandVoiceTest = () => {
    setTestOutput(
      `Mock output: ${testInput} The strongest version keeps one sharp lesson, one concrete example, and one clean takeaway. Style: ${draftStyle}. Strictness: ${strictness}%.`
    );
  };

  return (
    <section>
      <PageHeader
        title="Settings"
        description="Frontend-only configuration surfaces for brand voice, source selection, AI behaviour, and application preferences."
        actions={
          <>
            <Button variant="secondary" onClick={() => setTestOpen(true)}>
              Test Brand Voice
            </Button>
            <Button
              onClick={() => {
                persistSettings();
                showToast("Changes saved", "Settings were saved to IndexedDB.");
              }}
            >
              Save Changes
            </Button>
            <Button variant="danger" onClick={() => setResetOpen(true)}>
              Reset
            </Button>
          </>
        }
      />

      <div className="space-y-6">
        <SettingsSection id="brand" title="Brand Voice" open={openSections.brand} onToggle={toggleSection}>
          <p className="text-base text-on-surface-variant">
            Keep the brand style grounded, technical, and useful without sounding generic.
          </p>
          <label className="mt-5 block">
            <span className="font-label text-[12px] uppercase tracking-[0.05em] text-on-surface-variant">
              Brand System Prompt
            </span>
            <textarea
              className="mt-3 min-h-[220px] w-full rounded-2xl border border-surface-variant bg-surface px-4 py-4 text-base leading-7 text-on-surface outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/15"
              value={brandPrompt}
              onChange={(event) => setBrandPrompt(event.target.value)}
            />
          </label>
        </SettingsSection>

        <SettingsSection id="sources" title="Content Sources" open={openSections.sources} onToggle={toggleSection}>
          <div className="grid gap-4 md:grid-cols-2">
            {Object.entries(sourceState).map(([source, enabled]) => (
              <label
                key={source}
                className="flex items-center justify-between rounded-2xl border border-surface-variant bg-surface px-4 py-4"
              >
                <span className="text-base text-on-surface">{source}</span>
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(event) =>
                    setSourceState((current) => ({ ...current, [source]: event.target.checked }))
                  }
                  className="h-5 w-5 accent-[#4648d4]"
                />
              </label>
            ))}
          </div>
        </SettingsSection>

        <SettingsSection id="ai" title="AI Configuration" open={openSections.ai} onToggle={toggleSection}>
          <div className="grid gap-4 lg:grid-cols-2">
            <label className="rounded-2xl border border-surface-variant bg-surface px-4 py-4">
              <span className="font-label text-[12px] uppercase tracking-[0.05em] text-on-surface-variant">
                Draft style
              </span>
              <select
                className="mt-3 w-full rounded-xl border border-surface-variant bg-surface-container-lowest px-4 py-3 text-base text-on-surface outline-none focus:border-secondary"
                value={draftStyle}
                onChange={(event) => setDraftStyle(event.target.value)}
              >
                <option>Concise operator</option>
                <option>Founder storyteller</option>
                <option>Educational thread</option>
              </select>
            </label>
            <label className="rounded-2xl border border-surface-variant bg-surface px-4 py-4">
              <span className="font-label text-[12px] uppercase tracking-[0.05em] text-on-surface-variant">
                Output strictness: {strictness}%
              </span>
              <input
                type="range"
                min="0"
                max="100"
                value={strictness}
                onChange={(event) => setStrictness(Number(event.target.value))}
                className="mt-5 w-full accent-[#4648d4]"
              />
            </label>
          </div>
        </SettingsSection>

        <SettingsSection
          id="preferences"
          title="Application Preferences"
          open={openSections.preferences}
          onToggle={toggleSection}
        >
          <div className="grid gap-4 md:grid-cols-2">
            {Object.entries(preferences).map(([preference, enabled]) => (
              <label
                key={preference}
                className="flex items-center justify-between rounded-2xl border border-surface-variant bg-surface px-4 py-4"
              >
                <span className="text-base text-on-surface">{preference}</span>
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(event) =>
                    setPreferences((current) => ({ ...current, [preference]: event.target.checked }))
                  }
                  className="h-5 w-5 accent-[#4648d4]"
                />
              </label>
            ))}
          </div>
        </SettingsSection>
      </div>

      {testOpen ? (
        <div className="fixed inset-0 z-50 flex items-end bg-primary/45 px-4 py-6 sm:items-center sm:justify-center">
          <div className="w-full max-w-2xl rounded-2xl border border-surface-variant bg-surface-container-lowest p-6 shadow-card">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-display text-2xl font-semibold text-primary">Test Brand Voice</h3>
                <p className="mt-2 text-base leading-7 text-on-surface-variant">
                  Generate a mock response using the current frontend settings.
                </p>
              </div>
              <Button variant="ghost" onClick={() => setTestOpen(false)} aria-label="Close test brand voice">
                <span className="material-symbols-outlined">close</span>
              </Button>
            </div>
            <textarea
              className="mt-5 min-h-28 w-full rounded-2xl border border-surface-variant bg-surface px-4 py-4 text-base leading-7 text-on-surface outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/15"
              value={testInput}
              onChange={(event) => setTestInput(event.target.value)}
            />
            <div className="mt-4 flex flex-wrap gap-3">
              <Button onClick={runBrandVoiceTest}>Run Test</Button>
              <Button variant="secondary" onClick={() => setTestOutput("")}>
                Clear Output
              </Button>
            </div>
            {testOutput ? (
              <div className="mt-5 rounded-2xl border border-surface-variant bg-surface p-4 text-base leading-7 text-on-surface">
                {testOutput}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <ConfirmationModal
        open={resetOpen}
        title="Reset mock preferences?"
        description="This only resets the frontend preview state. No backend or stored data is connected yet."
        confirmLabel="Reset"
        onConfirm={resetPreferences}
        onCancel={() => setResetOpen(false)}
      />
    </section>
  );
}
