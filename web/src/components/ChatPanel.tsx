"use client";

import { useEffect, useRef } from "react";
import type { ChatMessage } from "@/lib/types";
import ChatBubble from "./ChatBubble";

interface ChatPanelProps {
  messages: ChatMessage[];
}

export default function ChatPanel({ messages }: ChatPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  return (
    <div className="flex h-full flex-col font-[family-name:var(--font-cairo)]" dir="rtl">
      <div className="border-b border-neutral-800 px-5 py-4">
        <h2 className="text-lg font-bold text-neutral-200">صاحبك الكوميديان</h2>
        <p className="text-sm text-neutral-500">بيبصلك وبيحس بيك...</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <p className="text-center text-xl text-neutral-600">
              بيبصلك...<br />
              <span className="text-base">هيبدأ يتكلم معاك على حسب وشك</span>
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
