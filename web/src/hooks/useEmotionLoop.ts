"use client";

import { useCallback, useRef } from "react";
import type { PredictionData } from "@/lib/types";
import { EmotionWindow } from "@/lib/smoothing";

export function useEmotionLoop(
  onResult: (prediction: PredictionData, stableEmotion: string | null) => void
) {
  const windowRef = useRef(new EmotionWindow(5));

  const handleFrame = useCallback(
    async (blob: Blob) => {
      try {
        const form = new FormData();
        form.append("file", blob, "frame.jpg");

        const res = await fetch("/api/predict", {
          method: "POST",
          body: form,
        });

        if (res.status === 429) {
          console.warn("Rate limited -- skipping this frame");
          return;
        }

        if (!res.ok) {
          console.error("Prediction failed:", res.status);
          return;
        }

        const prediction: PredictionData = await res.json();

        if (prediction.emotion) {
          windowRef.current.push(prediction.emotion);
        }

        const stable = windowRef.current.getStable();
        onResult(prediction, stable);
      } catch (err) {
        console.error("Emotion loop error:", err);
      }
    },
    [onResult]
  );

  return { handleFrame };
}
