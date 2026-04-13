import { NextRequest, NextResponse } from "next/server";
import { generateChatMessage, type ChatMode } from "@/lib/openai";

interface ChatRequestBody {
  mode: ChatMode;
  conversationHistory: { role: "assistant"; content: string }[];
  moodLevel?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequestBody = await request.json();

    if (!body.mode) {
      return NextResponse.json(
        { error: "Missing mode" },
        { status: 400 }
      );
    }

    const result = await generateChatMessage(
      body.mode,
      body.conversationHistory ?? [],
      body.moodLevel ?? "good"
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
