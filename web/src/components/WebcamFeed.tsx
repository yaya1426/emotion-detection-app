"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import type { PredictionData } from "@/lib/types";

interface WebcamFeedProps {
  prediction: PredictionData | null;
  onFrame: (blob: Blob) => void;
  intervalMs: number;
  enabled: boolean;
}

const EMOTION_COLORS: Record<string, string> = {
  Happy: "#22c55e",
  Neutral: "#3b82f6",
  Sad: "#f59e0b",
  Angry: "#ef4444",
  Surprise: "#a855f7",
  Fear: "#f97316",
  Disgust: "#84cc16",
};

function getEmotionColor(emotion: string | null): string {
  if (!emotion) return "#6b7280";
  return EMOTION_COLORS[emotion] ?? "#6b7280";
}

export default function WebcamFeed({
  prediction,
  onFrame,
  intervalMs,
  enabled,
}: WebcamFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inFlightRef = useRef(false);
  const [cameraReady, setCameraReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setCameraReady(true);
        }
      } catch (err) {
        console.error("Camera access denied:", err);
      }
    }

    startCamera();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = captureCanvasRef.current;
    if (!video || !canvas || video.readyState < 2) return;
    if (inFlightRef.current) return;

    const w = 640;
    const h = Math.round((video.videoHeight / video.videoWidth) * w) || 480;
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          inFlightRef.current = true;
          onFrame(blob);
          setTimeout(() => {
            inFlightRef.current = false;
          }, 200);
        }
      },
      "image/jpeg",
      0.7
    );
  }, [onFrame]);

  useEffect(() => {
    if (!enabled || !cameraReady) return;

    intervalRef.current = setInterval(captureFrame, intervalMs);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, cameraReady, captureFrame, intervalMs]);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function draw() {
      if (!video || !canvas || !ctx) return;

      canvas.width = video.clientWidth;
      canvas.height = video.clientHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (prediction?.box && prediction.imageWidth > 0 && prediction.imageHeight > 0) {
        const scaleX = canvas.width / prediction.imageWidth;
        const scaleY = canvas.height / prediction.imageHeight;

        // Mirror the x-coordinates so the box aligns with the CSS-mirrored video
        const rawX1 = prediction.box.x1 * scaleX;
        const rawX2 = prediction.box.x2 * scaleX;
        const x = canvas.width - rawX2;
        const y = prediction.box.y1 * scaleY;
        const w = rawX2 - rawX1;
        const h = (prediction.box.y2 - prediction.box.y1) * scaleY;

        const color = getEmotionColor(prediction.emotion);

        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.strokeRect(x, y, w, h);

        if (prediction.emotion) {
          const label = `${prediction.emotion} ${Math.round((prediction.confidence ?? 0) * 100)}%`;
          ctx.font = "bold 14px sans-serif";
          const metrics = ctx.measureText(label);
          const labelH = 22;
          const labelY = Math.max(y - labelH, 0);

          ctx.fillStyle = color;
          ctx.fillRect(x, labelY, metrics.width + 12, labelH);

          ctx.fillStyle = "#fff";
          ctx.fillText(label, x + 6, labelY + 16);
        }
      }
    }

    draw();
  }, [prediction]);

  return (
    <div className="relative w-full h-full overflow-hidden rounded-2xl bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover mirror"
        style={{ transform: "scaleX(-1)" }}
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />
      <canvas ref={captureCanvasRef} className="hidden" />
      {!cameraReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-900/80">
          <p className="text-neutral-400">Starting camera...</p>
        </div>
      )}
    </div>
  );
}
