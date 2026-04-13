export interface PredictionBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface PredictionData {
  emotion: string | null;
  confidence: number | null;
  box: PredictionBox | null;
  imageWidth: number;
  imageHeight: number;
}

export type MessageType = "joke" | "reaction" | "soothe" | "observe" | "switch_style";

export interface ChatMessage {
  id: string;
  text: string;
  type: MessageType;
  timestamp: number;
  emotionTag?: string;
}

export type AppState = "idle" | "showing_joke" | "cooldown";

export type MoodLevel = "great" | "good" | "meh" | "low" | "needs_help";

export interface EmotionState {
  appState: AppState;
  stableEmotion: string | null;
  latestPrediction: PredictionData | null;
  messages: ChatMessage[];
  jokeShownAt: number | null;
  failedJokeStreak: number;
  moodScore: number;
  happySince: number | null;
}

export type EmotionAction =
  | { type: "PREDICTION"; prediction: PredictionData | null; stableEmotion: string | null }
  | { type: "AI_MESSAGE"; message: ChatMessage }
  | { type: "START_COOLDOWN" }
  | { type: "COOLDOWN_DONE" }
  | { type: "JOKE_FAILED" }
  | { type: "JOKE_LANDED" }
  | { type: "MOOD_BOOST" };
