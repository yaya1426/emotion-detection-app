import { NextRequest, NextResponse } from "next/server";
import { predictEmotion } from "@/lib/ultralytics";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: "Missing file in form data" },
        { status: 400 }
      );
    }

    const fileName =
      file instanceof File ? file.name : "frame.jpg";
    const prediction = await predictEmotion(file, fileName);

    return NextResponse.json(prediction);
  } catch (error) {
    console.error("Predict API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
