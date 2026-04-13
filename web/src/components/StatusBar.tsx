"use client";

import type { AppState } from "@/lib/types";

interface StatusBarProps {
  emotion: string | null;
  confidence: number | null;
  appState: AppState;
}

const STATE_LABELS: Record<AppState, string> = {
  idle: "Observing",
  showing_joke: "Waiting for reaction",
  cooldown: "Cooldown",
};

export default function StatusBar({ emotion, confidence, appState }: StatusBarProps) {
  return (
    <div className="flex items-center gap-4 border-t border-neutral-800 bg-neutral-900/80 px-4 py-2 text-xs">
      <div className="flex items-center gap-1.5">
        <span
          className={`h-2 w-2 rounded-full ${
            emotion ? "bg-green-500 animate-pulse" : "bg-neutral-600"
          }`}
        />
        <span className="text-neutral-400">
          {emotion ?? "No face"}
        </span>
      </div>

      {confidence !== null && (
        <span className="text-neutral-500">
          {Math.round(confidence * 100)}%
        </span>
      )}

      <span className="ml-auto text-neutral-500">
        {STATE_LABELS[appState]}
      </span>
    </div>
  );
}
