
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUp, Plus, MessageCircle, Pencil, Trash2,
  Check, X, Sparkles, PanelLeftClose, PanelLeftOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  getChatSession,
  sendMessageToGemini,
  generateChatTitle,
  type GeminiSession
} from "@/services/gemini";
import {
  conversationService,
  messageService,
  type Conversation
} from "@/services/supabase";
import { moodOrchestrator } from "@/services/mood-orchestrator";
import { useAuth } from "@/contexts/AuthContext";
import TalkAboutThisButton from "./TalkAboutThisButton";

interface Message {
  id?: string;
  role: "user" | "model";
  content: string;
  conversation_id?: string;
  created_at?: string;
}

const colors = {
  ivory: "#F5F0E9",
  paper: "#FAF7F2",
  taupe: "#E9DFD4",
  espresso: "#302A26",
  muted: "#87776C",
  border: "#DED3C7",
  sage: "#819179",
};

const suggestions = [
  "I've been feeling overwhelmed lately",
  "Help me reflect on my day",
  "I just need someone to talk to",
];

function renderAssistantMessage(content: string) {
  return content.split(/(https:\/\/findahelpline\.com\/?|\b988\b|\b911\b)/g).map((part, index) => {
    if (part === '988' || part === '911') {
      return <a key={`${part}-${index}`} className="underline underline-offset-2" href={`tel:${part}`}>{part}</a>;
    }
    if (part.startsWith('https://findahelpline.com')) {
      return <a key={`helpline-${index}`} className="underline underline-offset-2" href="https://findahelpline.com/" target="_blank" rel="noreferrer">findahelpline.com</a>;
    }
    return part;
  });
}

const TextChat = () => {
  const { user } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] =
    useState<string | null>(null);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [chatSession, setChatSession] = useState<GeminiSession | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [chatSessionStartTime, setChatSessionStartTime] =
    useState<number | null>(null);
  const [historyOpen, setHistoryOpen] = useState(true);
  const [chatError, setChatError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const activeIdRef = useRef<string | null>(null);
  const requestVersionRef = useRef(0);
  const chatSessionRef = useRef<GeminiSession | null>(null);
  const historyRef = useRef<Message[]>([]);

  const createSession = useCallback(async () => {
    const response = await fetch("/SYSTEM_PROMPT.md");
    if (!response.ok) throw new Error("Failed to load system prompt");
    const prompt = await response.text();
    const session = getChatSession(prompt);
    chatSessionRef.current = session;
    setChatSession(session);
    return session;
  }, []);

  const listConversations = useCallback(async () => {
    if (!user) return;
    try {
      const result = await conversationService.list();
      setConversations(result);
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
    }
  }, [user]);

  useEffect(() => {
    let cancelled = false;

    const initialize = async () => {
      if (!user) {
        setIsInitializing(false);
        return;
      }

      setIsInitializing(true);

      try {
        const response = await fetch("/SYSTEM_PROMPT.md");
        if (!response.ok) throw new Error("Failed to load system prompt");

        const prompt = await response.text();
        const session = getChatSession(prompt);
        const result = await conversationService.list();

        if (!cancelled) {
          chatSessionRef.current = session;
          setChatSession(session);
          setConversations(result);
        }
      } catch (error) {
        console.error("Chat initialization failed:", error);
        if (!cancelled) {
          setChatError("Unable to initialize chat. Please refresh.");
        }
      } finally {
        if (!cancelled) setIsInitializing(false);
      }
    };

    initialize();

    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    if (!isLoading && !isInitializing) {
      textareaRef.current?.focus();
    }
  }, [isLoading, isInitializing]);

  const handleNewConversation = async () => {
    if (isLoading) return;

    requestVersionRef.current += 1;
    activeIdRef.current = null;
    historyRef.current = [];
    setActiveConversationId(null);
    setMessages([]);
    setCurrentMessage("");
    setChatSessionStartTime(null);
    setChatError(null);

    try {
      await createSession();
    } catch (error) {
      console.error("Failed to create chat session:", error);
      setChatError("Unable to start a new chat.");
    }
  };

  const handleStartRename = (conversation: Conversation) => {
    setEditingId(conversation.id);
    setEditingTitle(conversation.title);
  };

  const handleCancelRename = () => {
    setEditingId(null);
    setEditingTitle("");
  };

  const handleSaveRename = async () => {
    if (!editingId || !editingTitle.trim()) return;

    try {
      await conversationService.updateTitle(
        editingId,
        editingTitle.trim()
      );
      await listConversations();
      handleCancelRename();
    } catch (error) {
      console.error("Rename failed:", error);
      setChatError("Unable to rename conversation.");
    }
  };

  const handleDeleteConversation = async (id: string) => {
    if (isLoading) return;

    if (!window.confirm("Delete this conversation permanently?")) {
      return;
    }

    try {
      await conversationService.delete(id);

      if (activeIdRef.current === id) {
        await handleNewConversation();
      }

      await listConversations();
    } catch (error) {
      console.error("Delete failed:", error);
      setChatError("Unable to delete conversation.");
    }
  };

  const loadConversation = async (id: string) => {
    if (isLoading) return;

    const version = ++requestVersionRef.current;
    activeIdRef.current = id;
    setActiveConversationId(id);
    setChatError(null);
    setMessages([]);
    historyRef.current = [];
    setIsInitializing(true);

    try {
      const dbMessages = await messageService.list(id);

      if (version !== requestVersionRef.current) return;

      const loaded: Message[] = dbMessages.map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        conversation_id: msg.conversation_id,
        created_at: msg.created_at,
      }));

      setMessages(loaded);
      historyRef.current = loaded;

      // A fresh session avoids carrying context from another chat.
      // The saved messages remain visible in the conversation.
      await createSession();

      if (version !== requestVersionRef.current) return;

      const first = loaded.find((msg) => msg.created_at);
      setChatSessionStartTime(
        first?.created_at
          ? new Date(first.created_at).getTime()
          : null
      );
    } catch (error) {
      console.error("Failed to load conversation:", error);
      if (version === requestVersionRef.current) {
        setChatError("Unable to load this conversation.");
      }
    } finally {
      if (version === requestVersionRef.current) {
        setIsInitializing(false);
      }
    }
  };

  const handleSendMessage = async (text?: string) => {
    const content = (text ?? currentMessage).trim();

    if (!content || isLoading || isInitializing || !chatSession) {
      return;
    }

    const version = requestVersionRef.current;
    const userMessage: Message = {
      role: "user",
      content,
    };

    setMessages((prev) => [...prev, userMessage]);
    setCurrentMessage("");
    setIsLoading(true);
    setChatError(null);

    let conversationId = activeIdRef.current;
    let newConversationCreated = false;
    let firstMessageTime = chatSessionStartTime;

    try {
      if (!conversationId) {
        let title = content.slice(0, 45);

        try {
          title = await generateChatTitle(content);
        } catch (error) {
          console.error("Title generation failed:", error);
        }

        const conversation = await conversationService.create(title);
        conversationId = conversation.id;
        activeIdRef.current = conversationId;
        setActiveConversationId(conversationId);
        newConversationCreated = true;
        firstMessageTime = Date.now();
        setChatSessionStartTime(firstMessageTime);
      }

      await messageService.create(
        conversationId,
        userMessage.role,
        userMessage.content
      );
    } catch (error) {
      console.error("Failed to save message:", error);
      setChatError("Could not save your message. Check your connection.");
      setIsLoading(false);
      return;
    }

    try {
      const responseText = await sendMessageToGemini(
        chatSession,
        content
      );

      const saved = await messageService.create(
        conversationId,
        "model",
        responseText
      );

      const aiMessage: Message = {
        id: saved.id,
        role: saved.role,
        content: saved.content,
        conversation_id: saved.conversation_id,
        created_at: saved.created_at,
      };

      if (version === requestVersionRef.current) {
        setMessages((prev) => [...prev, aiMessage]);
      }

      const durationMinutes = firstMessageTime
        ? Math.max(
            1,
            Math.round((Date.now() - firstMessageTime) / 60000)
          )
        : 1;

      // Mood analysis should never prevent chat from working.
      try {
        await moodOrchestrator.handleRealtimeMoodUpdate(
          "chat",
          conversationId,
          content,
          responseText,
          durationMinutes
        );
      } catch (error) {
        console.error("Mood analysis failed:", error);
      }

      try {
        await conversationService.updateTimestamp(conversationId);
      } catch (error) {
        console.error("Timestamp update failed:", error);
      }

      if (newConversationCreated) {
        await listConversations();
      }
    } catch (error) {
      console.error("Gemini response failed:", error);

      if (version === requestVersionRef.current) {
        setChatError(
          "TETHR couldn't connect right now. Please try again."
        );
      }
    } finally {
      if (version === requestVersionRef.current) {
        setIsLoading(false);
      }
    }
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSendMessage();
    }
  };

  return (
    <div
      className="flex h-full min-h-[600px] w-full overflow-hidden rounded-xl"
      style={{
        background: colors.ivory,
        color: colors.espresso,
        fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
      }}
    >
      {/* CONVERSATION HISTORY */}
      <AnimatePresence initial={false}>
        {historyOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="hidden shrink-0 overflow-hidden border-r md:flex md:flex-col"
            style={{
              borderColor: colors.border,
              background: "#F0E9E0",
            }}
          >
            <div className="w-[280px] p-6">
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#937E6B]">
                    Your space
                  </p>
                  <h2 className="mt-2 text-xl font-black tracking-tight">
                    Conversations
                  </h2>
                </div>
                <button
                  onClick={() => setHistoryOpen(false)}
                  className="rounded-lg p-2 text-[#87776C] hover:bg-[#E2D7CB]"
                  aria-label="Hide conversation history"
                >
                  <PanelLeftClose size={18} />
                </button>
              </div>

              <button
                onClick={() => void handleNewConversation()}
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#302A26] px-4 py-3 text-sm font-semibold text-[#F5F0E9] transition hover:bg-[#4A3D34] disabled:opacity-50"
              >
                <Plus size={17} />
                New conversation
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 pb-6">
              <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#937E6B]">
                Recent
              </p>

              {isInitializing ? (
                <p className="px-3 text-sm text-[#87776C]">
                  Loading conversations...
                </p>
              ) : conversations.length === 0 ? (
                <p className="px-3 text-sm leading-6 text-[#87776C]">
                  Your conversations will appear here.
                </p>
              ) : (
                <div className="space-y-1">
                  {conversations.map((convo) => {
                    const active =
                      activeConversationId === convo.id;

                    return (
                      <div
                        key={convo.id}
                        className="group relative"
                      >
                        {editingId === convo.id ? (
                          <div className="flex items-center gap-1 rounded-lg bg-[#E5D9CD] p-2">
                            <Input
                              autoFocus
                              value={editingTitle}
                              onChange={(e) =>
                                setEditingTitle(e.target.value)
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  void handleSaveRename();
                                }
                                if (e.key === "Escape") {
                                  handleCancelRename();
                                }
                              }}
                              className="h-8 min-w-0 flex-1 border-[#D4C5B6] bg-[#FAF7F2] text-xs text-[#302A26]"
                            />
                            <button
                              onClick={() => void handleSaveRename()}
                              aria-label="Save name"
                            >
                              <Check size={15} />
                            </button>
                            <button
                              onClick={handleCancelRename}
                              aria-label="Cancel rename"
                            >
                              <X size={15} />
                            </button>
                          </div>
                        ) : (
                          <div
                            className={`flex items-center rounded-lg transition-colors ${
                              active
                                ? "bg-[#DED0C1]"
                                : "hover:bg-[#E8DED3]"
                            }`}
                          >
                            <button
                              onClick={() =>
                                void loadConversation(convo.id)
                              }
                              className="flex min-w-0 flex-1 items-center gap-3 px-3 py-3 text-left"
                            >
                              <MessageCircle
                                size={16}
                                className="shrink-0 text-[#87776C]"
                              />
                              <span className="truncate text-xs font-medium">
                                {convo.title}
                              </span>
                            </button>

                            <div className="flex items-center gap-1 pr-2 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
                              <button
                                onClick={() =>
                                  handleStartRename(convo)
                                }
                                className="rounded p-1 hover:bg-[#D4C5B6]"
                                aria-label="Rename conversation"
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                onClick={() =>
                                  void handleDeleteConversation(convo.id)
                                }
                                className="rounded p-1 hover:bg-[#D4C5B6]"
                                aria-label="Delete conversation"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="w-[280px] border-t border-[#DED3C7] p-5">
              <p className="text-[11px] leading-5 text-[#87776C]">
                A quiet place for your thoughts, reflections, and conversations.
              </p>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* MAIN CHAT */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* HEADER */}
        <header className="flex shrink-0 items-center justify-between border-b border-[#DED3C7] px-5 py-5 sm:px-8">
          <div className="flex items-center gap-3">
            {!historyOpen && (
              <button
                onClick={() => setHistoryOpen(true)}
                className="rounded-lg p-2 hover:bg-[#E9DFD4]"
                aria-label="Show conversation history"
              >
                <PanelLeftOpen size={19} />
              </button>
            )}

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#937E6B]">
                TETHR / CONVERSATIONS
              </p>
              <h1 className="mt-1 text-xl font-black tracking-tight sm:text-2xl">
                A space to talk.
              </h1>
            </div>
          </div>

          <button
            onClick={() => void handleNewConversation()}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-lg border border-[#D8CABC] px-3 py-2 text-xs font-semibold transition hover:bg-[#E9DFD4] disabled:opacity-50"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">New chat</span>
          </button>
        </header>

        {/* MESSAGES */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 py-8 sm:px-10">
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center text-center"
            >
              <div className="mb-7 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#DED3C7] bg-[#E9DFD4]">
                <MessageCircle
                  size={29}
                  strokeWidth={1.4}
                  color="#937E6B"
                />
              </div>

              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.3em] text-[#937E6B]">
                Your space to reconnect
              </p>

              <h2 className="text-3xl font-black tracking-[-0.045em] sm:text-4xl">
                What's on your mind?
              </h2>

              <p className="mt-4 max-w-sm text-sm leading-7 text-[#87776C]">
                Sometimes it helps to put your thoughts into words.
                Start wherever feels right.
              </p>

              <div className="mt-10 grid w-full gap-3">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setCurrentMessage(suggestion);
                      textareaRef.current?.focus();
                    }}
                    className="group flex items-center justify-between rounded-xl border border-[#DED3C7] bg-[#FAF7F2] px-5 py-4 text-left text-sm text-[#665448] transition hover:border-[#B9A593] hover:bg-[#EDE4DA]"
                  >
                    <span>{suggestion}</span>
                    <ArrowUp
                      size={15}
                      className="rotate-45 text-[#937E6B] transition-transform group-hover:translate-x-1"
                    />
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <div className="mx-auto w-full max-w-3xl space-y-7">
              <AnimatePresence initial={false}>
                {messages.map((message, index) => (
                  <motion.div
                    key={message.id || `message-${index}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className={`flex ${
                      message.role === "user"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    {message.role === "model" && (
                      <div className="mr-3 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#E9DFD4]">
                        <Sparkles size={16} color="#937E6B" />
                      </div>
                    )}

                    <div className="flex max-w-[85%] flex-col items-start gap-1 sm:max-w-[75%]">
                      <div
                        className={`w-full rounded-2xl px-5 py-4 text-sm leading-7 ${
                          message.role === "user"
                            ? "rounded-br-md bg-[#302A26] text-[#F5F0E9]"
                            : "rounded-bl-md border border-[#DED3C7] bg-[#FAF7F2] text-[#302A26]"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">
                          {message.role === 'model' ? renderAssistantMessage(message.content) : message.content}
                        </p>
                      </div>
                      {message.id && !message.id.startsWith("error-") && (
                        <TalkAboutThisButton
                          sourceType="chat_message"
                          sourceId={message.id}
                          content={message.content}
                          className="h-8 px-2 text-[10px] text-[#796353]"
                        />
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {isLoading && (
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E9DFD4]">
                    <Sparkles size={16} color="#937E6B" />
                  </div>

                  <div className="flex gap-1.5 rounded-xl border border-[#DED3C7] bg-[#FAF7F2] px-5 py-4">
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        className="h-2 w-2 rounded-full bg-[#937E6B]"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{
                          duration: 1.2,
                          repeat: Infinity,
                          delay: i * 0.2,
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* INPUT */}
        <div className="shrink-0 border-t border-[#DED3C7] bg-[#F5F0E9] px-5 py-5 sm:px-10">
          <div className="mx-auto max-w-3xl">
            {chatError && (
              <div className="mb-3 rounded-lg border border-[#D7B7AD] bg-[#F3E5E0] px-4 py-3 text-xs text-[#9B4943]">
                {chatError}
              </div>
            )}

            <div className="flex items-end gap-3 rounded-2xl border border-[#D8CABC] bg-[#FAF7F2] px-4 py-3 transition-colors focus-within:border-[#A8917E]">
              <Textarea
                ref={textareaRef}
                value={currentMessage}
                onChange={(e) =>
                  setCurrentMessage(e.target.value)
                }
                onKeyDown={handleKeyDown}
                placeholder="Write what's on your mind..."
                rows={1}
                disabled={isLoading || isInitializing}
                className="max-h-36 min-h-[30px] flex-1 resize-none border-0 bg-transparent px-1 py-2 text-sm leading-6 text-[#302A26] shadow-none outline-none placeholder:text-[#A09286] focus-visible:ring-0 focus-visible:ring-offset-0"
              />

              <Button
                onClick={() => void handleSendMessage()}
                disabled={
                  isLoading ||
                  isInitializing ||
                  !currentMessage.trim()
                }
                size="icon"
                className="h-10 w-10 shrink-0 rounded-xl bg-[#302A26] text-[#F5F0E9] hover:bg-[#4A3D34] disabled:bg-[#DED3C7] disabled:text-[#A09286]"
                aria-label="Send message"
              >
                <ArrowUp size={19} />
              </Button>
            </div>

            <p className="mt-3 text-center text-[10px] tracking-wide text-[#A09286]">
              A space for reflection. TETHR is not a replacement for professional care.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextChat;
