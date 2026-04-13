"use client";

import type { ChatMessage } from "@/lib/types";

const BUBBLE_STYLE = {
  bg: "bg-blue-950/60",
  border: "border-blue-800/40",
  badge: "bg-blue-800/50",
  badgeText: "text-blue-300",
};

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ChatBubble({ message }: { message: ChatMessage }) {
  const style = BUBBLE_STYLE;

  return (
    <div className={`animate-fade-in rounded-2xl border px-6 py-5 ${style.bg} ${style.border}`}>
      <p className="text-2xl leading-loose text-neutral-50">{message.text}</p>
      <div className="mt-3 flex items-center gap-3">
        {message.emotionTag && (
          <span
            className={`rounded-full px-3 py-1 text-sm font-semibold ${style.badge} ${style.badgeText}`}
          >
            {message.emotionTag}
          </span>
        )}
        <span className="text-sm text-neutral-500">
          {formatTime(message.timestamp)}
        </span>
      </div>
    </div>
  );
}
