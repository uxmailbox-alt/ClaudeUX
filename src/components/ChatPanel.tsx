"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send, ChevronLeft } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const SUGGESTIONS = [
  "What's Yair's leadership style and how does he scale design teams?",
  "How has Yair driven AI adoption across the design organization?",
  "What are Yair's honest skill gaps and where might he not be the right fit?",
];

export default function ChatPanel({ isOpen, onClose }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 200);
  }, [isOpen]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  const sendMessage = async (text?: string) => {
    const userMessage = (text || input).trim();
    if (!userMessage || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, { role: "user", content: userMessage }],
        }),
      });
      const data = await response.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.message }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I had trouble with that. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const hasMessages = messages.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative w-full max-w-[720px] h-[min(85vh,700px)] flex flex-col rounded-lg border-2 overflow-hidden"
        style={{
          backgroundColor: "var(--surface-elevated)",
          borderColor: "var(--border-medium)",
          boxShadow: "0px 16px 30px rgba(0,0,0,0.4), 0px 24px 104px rgba(0,0,0,0.4)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-2 shrink-0"
          style={{ borderBottom: "1px solid var(--border-medium)", height: 50 }}
        >
          <div className="flex items-center gap-3">
            {hasMessages && (
              <button
                onClick={() => setMessages([])}
                className="p-1 rounded hover:bg-white/[0.08] transition-colors cursor-pointer"
              >
                <ChevronLeft size={18} style={{ color: "var(--text-secondary)" }} />
              </button>
            )}
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ backgroundColor: "var(--bg-accent)", color: "var(--text-on-accent)" }}
            >
              Y
            </div>
            <span className="text-base" style={{ color: "var(--text-body)" }}>
              Ask AI about Yair Golan
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-white/[0.08] transition-colors cursor-pointer"
          >
            <X size={14} style={{ color: "var(--text-secondary)" }} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 flex flex-col items-center overflow-y-auto chat-messages px-4">
          {!hasMessages ? (
            <div className="flex-1 flex flex-col items-center justify-center w-full max-w-[600px] gap-4">
              <div className="text-center mb-2">
                <h2 className="text-2xl font-light font-display mb-2" style={{ color: "var(--text-heading)" }}>
                  What would you like to know?
                </h2>
                <p className="text-base leading-relaxed max-w-xs mx-auto" style={{ color: "var(--text-secondary)" }}>
                  Ask anything about Yair&apos;s experience, skills, or fit for your role. Get honest, detailed answers.
                </p>
              </div>
              <div className="w-full flex flex-col gap-2 mt-2">
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(s)}
                    className="w-full text-left p-4 rounded-2xl text-sm leading-relaxed transition-colors cursor-pointer hover:brightness-125"
                    style={{ backgroundColor: "var(--bg-warm)", color: "var(--text-body)" }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="w-full max-w-[600px] flex flex-col gap-3 py-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className="max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed"
                    style={{
                      backgroundColor: msg.role === "user" ? "var(--surface-card)" : "var(--bg-warm)",
                      color: "var(--text-body)",
                      borderBottomRightRadius: msg.role === "user" ? 4 : undefined,
                      borderBottomLeftRadius: msg.role === "assistant" ? 4 : undefined,
                    }}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div
                    className="px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1.5"
                    style={{ backgroundColor: "var(--bg-warm)" }}
                  >
                    <span className="typing-dot w-2 h-2 rounded-full" style={{ background: "var(--text-secondary)" }} />
                    <span className="typing-dot w-2 h-2 rounded-full" style={{ background: "var(--text-secondary)" }} />
                    <span className="typing-dot w-2 h-2 rounded-full" style={{ background: "var(--text-secondary)" }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="shrink-0 px-4 pb-4 pt-2 flex flex-col items-center">
          <div
            className="w-full max-w-[600px] flex items-center rounded-2xl border px-4"
            style={{ backgroundColor: "var(--bg-warm)", borderColor: "var(--border-medium)", height: 66 }}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ask a follow up question"
              disabled={loading}
              className="flex-1 bg-transparent text-sm outline-none placeholder:italic"
              style={{ color: "var(--text-body)", caretColor: "var(--text-body)" }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              className="ml-2 w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer shrink-0"
              style={{
                backgroundColor: input.trim() && !loading ? "var(--border-medium)" : "var(--surface-card)",
              }}
            >
              <Send size={16} style={{ color: input.trim() && !loading ? "var(--text-body)" : "var(--text-muted)" }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
