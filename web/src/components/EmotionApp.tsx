"use client";

import { useCallback, useRef, useEffect } from "react";
import type { ChatMessage, MessageType, PredictionData } from "@/lib/types";
import { useStateMachine, computeMoodLevel } from "@/hooks/useStateMachine";
import { useEmotionLoop } from "@/hooks/useEmotionLoop";
import WebcamFeed from "./WebcamFeed";
import ChatPanel from "./ChatPanel";
import StatusBar from "./StatusBar";
import GameEndOverlay from "./GameEndOverlay";

const POLL_INTERVAL_MS = 100;
const HAPPY_BOOST_MS = 10_000;

let messageIdCounter = 0;
function nextId() {
  return `msg-${++messageIdCounter}-${Date.now()}`;
}

async function fetchAIMessage(
  mode: "joke" | "reaction" | "soothe" | "observe" | "switch_style",
  messages: ChatMessage[],
  moodLevel: string,
): Promise<{ message: string; type: MessageType }> {
  const conversationHistory = messages.map((m) => ({
    role: "assistant" as const,
    content: m.text,
  }));

  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode, conversationHistory, moodLevel }),
  });

  if (!res.ok) {
    throw new Error(`Chat API error: ${res.status}`);
  }

  return res.json();
}

export default function EmotionApp() {
  const {
    state,
    addMessage,
    updatePrediction,
    startCooldown,
    markJokeFailed,
    markJokeLanded,
    boostMood,
  } = useStateMachine();

  const fetchingRef = useRef(false);
  const stableRef = useRef<string | null>(null);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const triggerAI = useCallback(
    async (
      mode: "joke" | "reaction" | "soothe" | "observe" | "switch_style",
      emotionTag?: string,
    ) => {
      if (fetchingRef.current) return;
      fetchingRef.current = true;

      try {
        const currentState = stateRef.current;
        const currentMood = computeMoodLevel(currentState);
        const result = await fetchAIMessage(
          mode,
          currentState.messages,
          currentMood,
        );
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
    [addMessage, startCooldown],
  );

  const handlePredictionResult = useCallback(
    (prediction: PredictionData, stableEmotion: string | null) => {
      updatePrediction(prediction, stableEmotion);
      stableRef.current = stableEmotion;
    },
    [updatePrediction],
  );

  const { handleFrame } = useEmotionLoop(handlePredictionResult);

  const gameEnd = state.moodScore >= 100 ? "won" : state.moodScore <= 0 ? "critical" : null;

  const decisionCheck = useCallback(() => {
    const stable = stableRef.current;
    const current = stateRef.current;

    if (current.moodScore >= 100 || current.moodScore <= 0) return;

    if (
      stable === "Happy" &&
      current.happySince &&
      Date.now() - current.happySince >= HAPPY_BOOST_MS
    ) {
      boostMood();
    }

    if (fetchingRef.current) return;

    if (current.appState === "idle") {
      if (stable === "Neutral") {
        const mode =
          current.failedJokeStreak > 0 && current.failedJokeStreak % 3 === 0
            ? "switch_style"
            : "joke";
        triggerAI(mode, "Neutral");
      }
    } else if (current.appState === "showing_joke") {
      if (stable === "Happy") {
        markJokeLanded();
        triggerAI("reaction", "Happy").then(() => startCooldown());
      } else if (
        current.jokeShownAt &&
        Date.now() - current.jokeShownAt > 5000
      ) {
        markJokeFailed();
        triggerAI("soothe", stable ?? "Neutral");
      }
    }
  }, [triggerAI, boostMood, markJokeFailed, markJokeLanded, startCooldown]);

  const onFrameWithDecision = useCallback(
    (blob: Blob) => {
      handleFrame(blob).then(() => {
        decisionCheck();
      });
    },
    [handleFrame, decisionCheck],
  );

  return (
    <div className="flex h-full flex-col">
      {gameEnd && <GameEndOverlay type={gameEnd} />}

      <div className="flex flex-1 min-h-0">
        <div className="flex-1 p-3">
          <WebcamFeed
            prediction={state.latestPrediction}
            onFrame={onFrameWithDecision}
            intervalMs={POLL_INTERVAL_MS}
            enabled={!gameEnd}
          />
        </div>

        <div className="w-[500px] flex-shrink-0 border-l border-neutral-800 bg-neutral-900/50">
          <ChatPanel
            messages={state.messages}
            moodLevel={computeMoodLevel(state)}
            moodScore={state.moodScore}
          />
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
