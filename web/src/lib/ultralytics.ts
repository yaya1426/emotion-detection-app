import type { PredictionData } from "./types";

const MODEL_API_URL = process.env.MODEL_API_URL ?? "http://localhost:8000";

export async function predictEmotion(
  imageBlob: Blob,
  fileName: string
): Promise<PredictionData> {
  const form = new FormData();
  form.append("file", imageBlob, fileName);
  form.append("conf", "0.25");
  form.append("iou", "0.7");
  form.append("imgsz", "640");

  const response = await fetch(`${MODEL_API_URL}/predict`, {
    method: "POST",
    body: form,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Model API error ${response.status}: ${text}`);
  }

  const data: PredictionData = await response.json();
  return data;
}
