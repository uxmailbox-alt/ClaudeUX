"use client";

import { useState, useEffect } from "react";
import { MessageCircle } from "lucide-react";
import ChatPanel from "./ChatPanel";

export default function GlobalChat() {
  const [isOpen, setIsOpen] = useState(false);

  // Listen for open-chat events fired by any page
  useEffect(() => {
    const handler = () => setIsOpen(true);
    window.addEventListener("open-chat", handler);
    return () => window.removeEventListener("open-chat", handler);
  }, []);

  return (
    <>
      {/* Floating bubble */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center cursor-pointer z-40 transition-all hover:brightness-125"
          style={{
            background: "var(--surface-elevated)",
            border: "1px solid var(--border-medium)",
            color: "var(--text-body)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
          }}
          aria-label="Open AI chat"
        >
          <MessageCircle size={22} />
        </button>
      )}

      <ChatPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
