"use client";

import { useReducer, useCallback, useRef, useEffect } from "react";
import type { EmotionState, EmotionAction, ChatMessage } from "@/lib/types";

const COOLDOWN_MS = 5000;
const JOKE_TIMEOUT_MS = 10000;

const initialState: EmotionState = {
  appState: "idle",
  stableEmotion: null,
  latestPrediction: null,
  messages: [],
  jokeShownAt: null,
  failedJokeStreak: 0,
};

function reducer(state: EmotionState, action: EmotionAction): EmotionState {
  switch (action.type) {
    case "PREDICTION":
      return {
        ...state,
        latestPrediction: action.prediction,
        stableEmotion: action.stableEmotion,
      };
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
      };
    case "JOKE_LANDED":
      return {
        ...state,
        failedJokeStreak: 0,
      };
    default:
      return state;
  }
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
  };
}
