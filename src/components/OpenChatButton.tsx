"use client";

import { MessageCircle } from "lucide-react";

export default function OpenChatButton() {
  const open = () => window.dispatchEvent(new Event("open-chat"));

  return (
    <button
      onClick={open}
      className="inline-flex items-center gap-2.5 px-6 py-3 rounded-lg text-sm font-medium hover:brightness-110 transition-all cursor-pointer"
      style={{ backgroundColor: "var(--bg-accent)", color: "var(--text-on-accent)" }}
    >
      <MessageCircle size={16} />
      Ask my AI about me
    </button>
  );
}
