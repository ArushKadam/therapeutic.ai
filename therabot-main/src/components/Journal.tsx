
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  BookOpen,
  Pencil,
  Brain,
  Sparkles,
  ArrowUpRight,
  CalendarDays,
  PenLine,
  RefreshCw,
} from "lucide-react";
import { journalService, type JournalEntry } from "@/services/supabase";
import JournalEntryEditor from "./JournalEntryEditor";
import JournalPromptSelector from "./JournalPromptSelector";
import type { JournalPrompt } from "@/services/journalPrompts";

const Journal = () => {
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPromptSelectorOpen, setIsPromptSelectorOpen] = useState(false);

  const fetchEntries = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const entries = await journalService.list();

      setJournalEntries(
        [...entries].sort(
          (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
        )
      );
    } catch (err) {
      console.error("Error fetching journal entries:", err);
      setError(
        err instanceof Error
          ? `Failed to load journal entries: ${err.message}`
          : "Failed to load journal entries."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchEntries();
  }, [fetchEntries]);

  const handleNewEntry = () => {
    setSelectedEntry(null);
    setIsEditorOpen(true);
    setIsPromptSelectorOpen(false);
  };

  const handlePromptMe = () => {
    setIsPromptSelectorOpen(true);
  };

  const handleSelectPrompt = (prompt: JournalPrompt) => {
    const tempEntry = {
      id: null,
      title: `Journal Entry - ${prompt.category}`,
      content: `Prompt: ${prompt.text}\n\n`,
      created_at: new Date().toISOString(),
      user_id: "",
      mood: null,
      ai_analysis: null,
      _isPromptBased: true,
    };

    setSelectedEntry(tempEntry as unknown as JournalEntry);
    setIsEditorOpen(true);
    setIsPromptSelectorOpen(false);
  };

  const handleEditEntry = (entry: JournalEntry) => {
    setSelectedEntry(entry);
    setIsEditorOpen(true);
  };

  const handleCloseEditor = () => {
    setIsEditorOpen(false);
    setSelectedEntry(null);
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      await fetchEntries();
    } catch (err) {
      console.error("Error refreshing entries:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatShortDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <>
      <div
        className="min-h-full w-full bg-[#F5F0E9] text-[#302A26]"
        style={{
          fontFamily:
            "Inter, ui-sans-serif, system-ui, sans-serif",
        }}
      >
        <div className="mx-auto max-w-[1440px] px-5 py-8 sm:px-9 lg:px-12 lg:py-11">

          {/* PAGE HEADER */}
          <motion.header
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="border-b border-[#DCD1C6] pb-9"
          >
            <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.28em] text-[#937E6B]">
              JOURNAL / YOUR REFLECTIONS
            </div>

            <div className="flex flex-wrap items-end justify-between gap-5">
              <div>
                <h1 className="text-3xl font-black tracking-[-0.055em] sm:text-4xl lg:text-[46px]">
                  Today's Reflection.
                </h1>

                <p className="mt-2 text-sm text-[#7F7268]">
                  A quiet space for your thoughts.
                </p>
              </div>

              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.13em] text-[#75675C]">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
                <CalendarDays size={17} strokeWidth={1.7} />
              </div>
            </div>
          </motion.header>

          {/* WRITING OPTIONS */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.08 }}
            className="border-b border-[#DCD1C6] py-10"
          >
            <div className="mb-7">
              <h2 className="text-xl font-extrabold tracking-tight">
                Make room for your thoughts.
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#87776C]">
                Choose to write freely or get inspired with thoughtful prompts.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">

              {/* PROMPT ME */}
              <button
                onClick={handlePromptMe}
                className="group flex min-h-[190px] flex-col justify-between rounded-2xl border border-[#DED3C7] bg-[#E9DFD4] p-6 text-left transition-all duration-300 hover:border-[#B9A593] hover:bg-[#E3D7CA]"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F5F0E9]">
                    <Sparkles
                      size={21}
                      strokeWidth={1.6}
                      className="text-[#937E6B]"
                    />
                  </div>

                  <ArrowUpRight
                    size={19}
                    className="text-[#937E6B] transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1"
                  />
                </div>

                <div>
                  <h3 className="text-xl font-extrabold tracking-tight">
                    Prompt Me
                  </h3>
                  <p className="mt-2 text-xs leading-5 text-[#87776C]">
                    Find inspiration through a thoughtful question.
                  </p>
                </div>
              </button>

              {/* WRITE FREELY */}
              <button
                onClick={handleNewEntry}
                className="group flex min-h-[190px] flex-col justify-between rounded-2xl border border-[#DED3C7] bg-[#FAF7F2] p-6 text-left transition-all duration-300 hover:border-[#B9A593] hover:bg-[#F0E9E0]"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E9DFD4]">
                    <PenLine
                      size={21}
                      strokeWidth={1.6}
                      className="text-[#937E6B]"
                    />
                  </div>

                  <ArrowUpRight
                    size={19}
                    className="text-[#937E6B] transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1"
                  />
                </div>

                <div>
                  <h3 className="text-xl font-extrabold tracking-tight">
                    Write Freely
                  </h3>
                  <p className="mt-2 text-xs leading-5 text-[#87776C]">
                    No prompts, no expectations. Just your thoughts.
                  </p>
                </div>
              </button>
            </div>
          </motion.section>

          {/* JOURNAL HISTORY */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.16 }}
            className="py-10"
          >
            <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="flex items-center gap-3 text-xl font-extrabold tracking-tight">
                  <BookOpen
                    size={21}
                    strokeWidth={1.7}
                    className="text-[#937E6B]"
                  />
                  Journal History
                </h2>

                <p className="mt-2 pl-8 text-xs text-[#87776C]">
                  A collection of your personal reflections.
                </p>
              </div>

              {!loading && !error && journalEntries.length > 0 && (
                <span className="rounded-full bg-[#E9DFD4] px-4 py-2 text-[11px] font-semibold text-[#796353]">
                  {journalEntries.length}{" "}
                  {journalEntries.length === 1 ? "Entry" : "Entries"}
                </span>
              )}
            </div>

            {/* ERROR STATE */}
            {error ? (
              <div className="rounded-2xl border border-[#D7B7AD] bg-[#F3E5E0] px-6 py-12 text-center">
                <h3 className="text-lg font-bold text-[#9B4943]">
                  Unable to load your journal.
                </h3>

                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#87776C]">
                  {error}
                </p>

                <button
                  onClick={() => void fetchEntries()}
                  className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#302A26] px-5 py-3 text-sm font-semibold text-[#F5F0E9] transition hover:bg-[#4A3D34]"
                >
                  <RefreshCw size={15} />
                  Try Again
                </button>
              </div>
            ) : loading || isSaving ? (

              /* LOADING STATE */
              <div className="flex min-h-[300px] items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto mb-5 h-8 w-8 animate-spin rounded-full border-2 border-[#DCD1C6] border-t-[#937E6B]" />

                  <p className="text-sm text-[#87776C]">
                    {isSaving
                      ? "Saving your reflection..."
                      : "Loading your reflections..."}
                  </p>
                </div>
              </div>

            ) : journalEntries.length > 0 ? (

              /* SAVED JOURNAL ENTRIES */
              <div className="space-y-3">
                {journalEntries.map((entry, index) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.3,
                      delay: Math.min(index * 0.05, 0.3),
                    }}
                    className="group rounded-xl border border-[#DED3C7] bg-[#FAF7F2] p-6 transition-all duration-300 hover:border-[#B9A593] hover:bg-[#F1EAE1]"
                  >
                    <div className="flex items-start justify-between gap-5">
                      <div className="min-w-0 flex-1">

                        <div className="mb-3 flex flex-wrap items-center gap-3">
                          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#937E6B]">
                            {formatShortDate(entry.created_at)}
                          </span>

                          {entry.mood && (
                            <span className="rounded-full border border-[#D8C9B9] px-3 py-1 text-[10px] font-semibold capitalize text-[#796353]">
                              {entry.mood}
                            </span>
                          )}
                        </div>

                        <h3 className="text-lg font-extrabold tracking-tight">
                          {entry.title}
                        </h3>

                        <p className="mt-2 text-xs text-[#87776C]">
                          {formatDate(entry.created_at)}
                        </p>

                        <p className="mt-4 line-clamp-3 whitespace-pre-wrap break-words text-sm leading-7 text-[#66584E]">
                          {entry.content}
                        </p>
                      </div>

                      <button
                        onClick={() => handleEditEntry(entry)}
                        aria-label={`Edit ${entry.title}`}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#DED3C7] text-[#937E6B] transition hover:bg-[#E9DFD4]"
                      >
                        <Pencil size={16} strokeWidth={1.7} />
                      </button>
                    </div>

                    {/* AI ANALYSIS */}
                    {entry.ai_analysis && (
                      <div className="mt-6 border-t border-[#DED3C7] pt-5">
                        <div className="mb-3 flex items-center gap-2">
                          <Brain
                            size={16}
                            className="text-[#937E6B]"
                          />

                          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#937E6B]">
                            AI Analysis
                          </span>

                          <span className="ml-auto rounded-full bg-[#E9DFD4] px-3 py-1 text-[10px] font-semibold text-[#796353]">
                            Mood Detected
                          </span>
                        </div>

                        <p className="text-xs leading-6 text-[#66584E]">
                          {entry.ai_analysis}
                        </p>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>

            ) : (

              /* EMPTY JOURNAL STATE */
              <div className="flex min-h-[350px] flex-col items-center justify-center rounded-2xl border border-[#DED3C7] bg-[#F0E9E0] px-6 py-12 text-center">

                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E5D9CD]">
                  <BookOpen
                    size={28}
                    strokeWidth={1.4}
                    className="text-[#937E6B]"
                  />
                </div>

                <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.25em] text-[#937E6B]">
                  YOUR STORY STARTS HERE
                </p>

                <h3 className="text-2xl font-black tracking-tight sm:text-3xl">
                  A blank page, just for you.
                </h3>

                <p className="mt-3 max-w-sm text-sm leading-7 text-[#87776C]">
                  You haven't written anything yet.
                  Take a moment to reflect, however you'd like.
                </p>

                <button
                  onClick={handleNewEntry}
                  className="mt-7 flex items-center gap-2 rounded-lg bg-[#302A26] px-6 py-3 text-sm font-semibold text-[#F5F0E9] transition-colors hover:bg-[#4A3D34]"
                >
                  <Plus size={17} />
                  Start Writing
                </button>
              </div>
            )}
          </motion.section>
        </div>
      </div>

      {/* EXISTING JOURNAL EDITOR */}
      <JournalEntryEditor
        entry={selectedEntry}
        isOpen={isEditorOpen}
        onClose={handleCloseEditor}
        onSave={handleSave}
      />

      {/* EXISTING PROMPT SELECTOR */}
      {isPromptSelectorOpen && (
        <JournalPromptSelector
          onSelectPrompt={handleSelectPrompt}
          onWriteFreely={handleNewEntry}
          onClose={() => setIsPromptSelectorOpen(false)}
          startWithPrompt={true}
        />
      )}
    </>
  );
};

export default Journal;
