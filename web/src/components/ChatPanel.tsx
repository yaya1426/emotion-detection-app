"use client";

import { useEffect, useRef } from "react";
import type { ChatMessage, MoodLevel } from "@/lib/types";
import ChatBubble from "./ChatBubble";

const MOOD_CONFIG: Record<MoodLevel, { label: string; emoji: string; color: string; bar: string }> = {
  great:      { label: "مبسوط",     emoji: "😄", color: "text-green-400",  bar: "bg-green-400" },
  good:       { label: "كويس",      emoji: "🙂", color: "text-blue-400",   bar: "bg-blue-400" },
  meh:        { label: "عادي",      emoji: "😐", color: "text-yellow-400", bar: "bg-yellow-400" },
  low:        { label: "مش تمام",   emoji: "😕", color: "text-orange-400", bar: "bg-orange-400" },
  needs_help: { label: "محتاج دعم", emoji: "💙", color: "text-red-400",    bar: "bg-red-400" },
};

interface ChatPanelProps {
  messages: ChatMessage[];
  moodLevel: MoodLevel;
  moodScore: number;
}

export default function ChatPanel({ messages, moodLevel, moodScore }: ChatPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const mood = MOOD_CONFIG[moodLevel];

  return (
    <div className="flex h-full flex-col font-[family-name:var(--font-cairo)]" dir="rtl">
      <div className="border-b border-neutral-800 px-5 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-neutral-200">صاحبك الكوميديان</h2>
          <p className="text-sm text-neutral-500">بيبصلك وبيحس بيك...</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2 rounded-full bg-neutral-800/70 px-4 py-1.5">
            <span className="text-lg">{mood.emoji}</span>
            <span className={`text-sm font-semibold ${mood.color}`}>{mood.label}</span>
            <span className="text-xs font-bold text-neutral-300">{moodScore}/100</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-neutral-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${mood.bar}`}
              style={{ width: `${moodScore}%` }}
            />
          </div>
        </div>
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
