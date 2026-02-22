// ============================================================
// AI Coach Page — Chat interface powered by GPT-4o
// Uses Vercel AI SDK v6 useChat + glass message bubbles
// ============================================================

"use client";

import { useEffect, useRef, useState, useCallback, type FormEvent } from "react";
import { useChat, type UIMessage } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Send, Bot, Sparkles, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CoachPage() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [input, setInput] = useState("");
  const [loadedHistory, setLoadedHistory] = useState(false);

  const {
    messages,
    sendMessage,
    status,
    setMessages,
    error,
  } = useChat({
    transport: new DefaultChatTransport({ api: "/api/coach" }),
  });

  const isStreaming = status === "streaming" || status === "submitted";

  // Load previous messages from DB
  useEffect(() => {
    if (loadedHistory) return;
    (async () => {
      try {
        const res = await fetch("/api/coach");
        if (res.ok) {
          const history = await res.json();
          if (history.length > 0) {
            const mapped: UIMessage[] = history.map(
              (m: { id: string; role: string; content: string }) => ({
                id: m.id,
                role: m.role as "user" | "assistant",
                content: m.content,
                parts: [{ type: "text" as const, text: m.content }],
              })
            );
            setMessages(mapped);
          }
        }
      } catch {
        // silent
      }
      setLoadedHistory(true);
    })();
  }, [loadedHistory, setMessages]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input after load
  useEffect(() => {
    if (loadedHistory) inputRef.current?.focus();
  }, [loadedHistory]);

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      if (!input.trim() || isStreaming) return;
      sendMessage({ text: input.trim() });
      setInput("");
    },
    [input, isStreaming, sendMessage]
  );

  // Helper to extract text from a UIMessage
  const getMessageText = (msg: UIMessage): string => {
    if (msg.parts) {
      return msg.parts
        .filter((p): p is { type: "text"; text: string } => p.type === "text")
        .map((p) => p.text)
        .join("");
    }
    return "";
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col p-6 md:p-8">
      {/* ── Header ────────────────────────────────────────── */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight text-white/90">
          AI Coach
        </h1>
        <p className="mt-1 text-sm text-white/40">
          Powered by GPT-4o — your cosmic habit-building guide
        </p>
      </div>

      {/* ── Chat Area ─────────────────────────────────────── */}
      <div className="glass flex flex-1 flex-col rounded-2xl overflow-hidden border border-white/[0.06]">
        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide scroll-smooth">
          {/* Welcome if no messages */}
          {messages.length === 0 && loadedHistory && (
            <div className="flex gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#a78bfa] to-[#d946ef] shadow-[0_0_12px_rgba(167,139,250,0.3)]">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="glass rounded-2xl rounded-tl-sm px-4 py-3 max-w-lg border border-white/[0.06] shadow-[0_0_20px_rgba(167,139,250,0.06)]">
                <p className="text-sm leading-relaxed text-white/70">
                  Welcome, Seeker. I am Lumina — your cosmic habit guide.
                  I can see the patterns in your crystal sanctuary. Ask me
                  about your streaks, habits, or let me help you build new ones.
                </p>
                <ul className="mt-3 space-y-1.5 text-sm text-white/45">
                  <li className="flex items-center gap-2">
                    <Sparkles className="h-3 w-3 text-[#a78bfa]" />
                    Analyze your habit patterns
                  </li>
                  <li className="flex items-center gap-2">
                    <Sparkles className="h-3 w-3 text-[#a78bfa]" />
                    Suggest optimal habit stacking
                  </li>
                  <li className="flex items-center gap-2">
                    <Sparkles className="h-3 w-3 text-[#a78bfa]" />
                    Help you design your ideal routine
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Error fallback */}
          {error && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-500/20">
                <Bot className="h-3.5 w-3.5 text-red-400" />
              </div>
              <div className="glass rounded-2xl rounded-tl-sm px-4 py-3 max-w-lg border border-red-500/15">
                <p className="text-sm text-red-300/80 leading-relaxed">
                  The cosmic connection flickered. Please try again — Lumina is realigning the stars.
                </p>
                <p className="text-[10px] text-white/20 mt-1">
                  {error.message || "Network error"}
                </p>
              </div>
            </div>
          )}

          {/* Chat messages */}
          {messages.map((message: UIMessage) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === "user" ? "flex-row-reverse" : ""
              }`}
            >
              {/* Avatar */}
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                  message.role === "user"
                    ? "bg-white/[0.06]"
                    : "bg-gradient-to-br from-[#a78bfa] to-[#d946ef] shadow-[0_0_10px_rgba(167,139,250,0.25)]"
                }`}
              >
                {message.role === "user" ? (
                  <User className="h-3.5 w-3.5 text-white/50" />
                ) : (
                  <Bot className="h-3.5 w-3.5 text-white" />
                )}
              </div>

              {/* Bubble with glass glow */}
              <div
                className={`max-w-lg rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  message.role === "user"
                    ? "rounded-tr-sm bg-[#a78bfa]/15 text-white/80 border border-[#a78bfa]/20 shadow-[0_0_15px_rgba(167,139,250,0.08)]"
                    : "rounded-tl-sm glass text-white/70 border border-white/[0.06] shadow-[0_0_20px_rgba(167,139,250,0.05)]"
                }`}
              >
                {getMessageText(message)}
              </div>
            </div>
          ))}

          {/* Typing indicator with "Thinking..." label + glow */}
          {isStreaming && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#a78bfa] to-[#d946ef] shadow-[0_0_12px_rgba(167,139,250,0.4)]">
                <Bot className="h-3.5 w-3.5 text-white" />
              </div>
              <div className="glass rounded-2xl rounded-tl-sm px-4 py-3 border border-[#a78bfa]/10 shadow-[0_0_25px_rgba(167,139,250,0.08)]">
                <p className="text-[11px] text-[#a78bfa]/80 mb-2 font-semibold tracking-wide">Lumina is consulting the stars...</p>
                <div className="flex gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-[#a78bfa] animate-bounce shadow-[0_0_8px_rgba(167,139,250,0.6),0_0_16px_rgba(167,139,250,0.3)]" style={{ animationDelay: "0ms", animationDuration: "0.7s" }} />
                  <div className="h-2.5 w-2.5 rounded-full bg-[#d946ef] animate-bounce shadow-[0_0_8px_rgba(217,70,239,0.6),0_0_16px_rgba(217,70,239,0.3)]" style={{ animationDelay: "150ms", animationDuration: "0.7s" }} />
                  <div className="h-2.5 w-2.5 rounded-full bg-[#22d3ee] animate-bounce shadow-[0_0_8px_rgba(34,211,238,0.6),0_0_16px_rgba(34,211,238,0.3)]" style={{ animationDelay: "300ms", animationDuration: "0.7s" }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Input ─────────────────────────────────────── */}
        <div className="border-t border-white/[0.06] p-4">
          <form onSubmit={handleSubmit} className="flex items-center gap-3">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask your cosmic guide anything..."
              className="flex-1 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm text-white/80 placeholder:text-white/20 focus:border-[#a78bfa]/30 focus:outline-none focus:ring-1 focus:ring-[#a78bfa]/20 transition-colors"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || isStreaming}
              className="h-10 w-10 shrink-0 bg-gradient-to-r from-[#a78bfa] to-[#d946ef] text-white shadow-[0_0_15px_rgba(167,139,250,0.3)] hover:shadow-[0_0_25px_rgba(167,139,250,0.5)] disabled:opacity-40 transition-all"
            >
              {isStreaming ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
          <p className="mt-2 text-center text-[10px] text-white/20">
            Lumina uses GPT-4o · Responses may vary
          </p>
        </div>
      </div>
    </div>
  );
}
