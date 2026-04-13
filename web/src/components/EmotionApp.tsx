"use client";

import { useCallback, useRef, useEffect } from "react";
import type { ChatMessage, MessageType, PredictionData } from "@/lib/types";
import { useStateMachine } from "@/hooks/useStateMachine";
import { useEmotionLoop } from "@/hooks/useEmotionLoop";
import WebcamFeed from "./WebcamFeed";
import ChatPanel from "./ChatPanel";
import StatusBar from "./StatusBar";

const POLL_INTERVAL_MS = 300;

let messageIdCounter = 0;
function nextId() {
  return `msg-${++messageIdCounter}-${Date.now()}`;
}

async function fetchAIMessage(
  mode: "joke" | "reaction" | "soothe" | "observe",
  messages: ChatMessage[]
): Promise<{ message: string; type: MessageType }> {
  const conversationHistory = messages.map((m) => ({
    role: "assistant" as const,
    content: m.text,
  }));

  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode, conversationHistory }),
  });

  if (!res.ok) {
    throw new Error(`Chat API error: ${res.status}`);
  }

  return res.json();
}

export default function EmotionApp() {
  const { state, addMessage, updatePrediction, startCooldown, isJokeTimedOut } =
    useStateMachine();

  const fetchingRef = useRef(false);
  const stableRef = useRef<string | null>(null);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const triggerAI = useCallback(
    async (mode: "joke" | "reaction" | "soothe" | "observe", emotionTag?: string) => {
      if (fetchingRef.current) return;
      fetchingRef.current = true;

      try {
        const currentMessages = stateRef.current.messages;
        const result = await fetchAIMessage(mode, currentMessages);
        const msg: ChatMessage = {
          id: nextId(),
          text: result.message,
          type: result.type,
          timestamp: Date.now(),
          emotionTag,
        };
        addMessage(msg);

        if (mode === "soothe") {
          startCooldown();
        }
      } catch (err) {
        console.error("AI trigger failed:", err);
      } finally {
        fetchingRef.current = false;
      }
    },
    [addMessage, startCooldown]
  );

  const handlePredictionResult = useCallback(
    (prediction: PredictionData, stableEmotion: string | null) => {
      updatePrediction(prediction, stableEmotion);
      stableRef.current = stableEmotion;
    },
    [updatePrediction]
  );

  const { handleFrame } = useEmotionLoop(handlePredictionResult);

  const decisionCheck = useCallback(() => {
    const stable = stableRef.current;
    const current = stateRef.current;

    if (fetchingRef.current) return;

    if (current.appState === "idle") {
      if (stable === "Neutral") {
        triggerAI("joke", "Neutral");
      }
    } else if (current.appState === "showing_joke") {
      if (stable === "Happy") {
        triggerAI("reaction", "Happy").then(() => startCooldown());
      } else if (
        current.jokeShownAt &&
        Date.now() - current.jokeShownAt > 10000
      ) {
        triggerAI("soothe", stable ?? "Neutral");
      }
    }
  }, [triggerAI]);

  const onFrameWithDecision = useCallback(
    (blob: Blob) => {
      handleFrame(blob).then(() => {
        decisionCheck();
      });
    },
    [handleFrame, decisionCheck]
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-1 min-h-0">
        <div className="flex-1 p-3">
          <WebcamFeed
            prediction={state.latestPrediction}
            onFrame={onFrameWithDecision}
            intervalMs={POLL_INTERVAL_MS}
            enabled={true}
          />
        </div>

        <div className="w-[380px] flex-shrink-0 border-l border-neutral-800 bg-neutral-900/50">
          <ChatPanel messages={state.messages} />
        </div>
      </div>

      <StatusBar
        emotion={state.stableEmotion}
        confidence={state.latestPrediction?.confidence ?? null}
        appState={state.appState}
      />
    </div>
  );
}
