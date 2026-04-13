"use client";

import { useReducer, useCallback, useRef, useEffect } from "react";
import type { EmotionState, EmotionAction, ChatMessage, MoodLevel } from "@/lib/types";

const COOLDOWN_MS = 5000;
const JOKE_TIMEOUT_MS = 5000;

const INITIAL_MOOD_SCORE = 50;

const initialState: EmotionState = {
  appState: "idle",
  stableEmotion: null,
  latestPrediction: null,
  messages: [],
  jokeShownAt: null,
  failedJokeStreak: 0,
  moodScore: INITIAL_MOOD_SCORE,
  happySince: null,
};

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, score));
}

function reducer(state: EmotionState, action: EmotionAction): EmotionState {
  switch (action.type) {
    case "PREDICTION": {
      const wasHappy = state.stableEmotion === "Happy";
      const isHappy = action.stableEmotion === "Happy";
      let happySince = state.happySince;
      if (isHappy && !wasHappy) {
        happySince = Date.now();
      } else if (!isHappy) {
        happySince = null;
      }
      return {
        ...state,
        latestPrediction: action.prediction,
        stableEmotion: action.stableEmotion,
        happySince,
      };
    }
    case "AI_MESSAGE":
      return {
        ...state,
        appState: "showing_joke",
        jokeShownAt: Date.now(),
        messages: [...state.messages, action.message],
      };
    case "START_COOLDOWN":
      return {
        ...state,
        appState: "cooldown",
        jokeShownAt: null,
      };
    case "COOLDOWN_DONE":
      return {
        ...state,
        appState: "idle",
      };
    case "JOKE_FAILED":
      return {
        ...state,
        failedJokeStreak: state.failedJokeStreak + 1,
        moodScore: clampScore(state.moodScore - 15),
      };
    case "JOKE_LANDED":
      return {
        ...state,
        failedJokeStreak: 0,
        moodScore: clampScore(state.moodScore + 15),
      };
    case "MOOD_BOOST":
      return {
        ...state,
        moodScore: clampScore(state.moodScore + 5),
        happySince: Date.now(),
      };
    default:
      return state;
  }
}

export function computeMoodLevel(state: EmotionState): MoodLevel {
  const { moodScore } = state;
  if (moodScore >= 75) return "great";
  if (moodScore >= 55) return "good";
  if (moodScore >= 35) return "meh";
  if (moodScore >= 15) return "low";
  return "needs_help";
}

export function useStateMachine() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const cooldownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const addMessage = useCallback((message: ChatMessage) => {
    dispatch({ type: "AI_MESSAGE", message });
  }, []);

  const updatePrediction = useCallback(
    (prediction: EmotionState["latestPrediction"], stableEmotion: string | null) => {
      dispatch({ type: "PREDICTION", prediction, stableEmotion });
    },
    []
  );

  const startCooldown = useCallback(() => {
    dispatch({ type: "START_COOLDOWN" });
    cooldownTimerRef.current = setTimeout(() => {
      dispatch({ type: "COOLDOWN_DONE" });
    }, COOLDOWN_MS);
  }, []);

  const markJokeFailed = useCallback(() => {
    dispatch({ type: "JOKE_FAILED" });
  }, []);

  const markJokeLanded = useCallback(() => {
    dispatch({ type: "JOKE_LANDED" });
  }, []);

  const boostMood = useCallback(() => {
    dispatch({ type: "MOOD_BOOST" });
  }, []);

  const isJokeTimedOut = useCallback(() => {
    if (!state.jokeShownAt) return false;
    return Date.now() - state.jokeShownAt > JOKE_TIMEOUT_MS;
  }, [state.jokeShownAt]);

  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
    };
  }, []);

  return {
    state,
    addMessage,
    updatePrediction,
    startCooldown,
    isJokeTimedOut,
    markJokeFailed,
    markJokeLanded,
    boostMood,
  };
}
