import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/guard";
import { ocrFromImage } from "@/lib/ocr-client";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const body = await request.json();
    const { uploadId } = body;

    if (!uploadId) {
      return NextResponse.json(
        { error: "uploadId required" },
        { status: 400 }
      );
    }

    const upload = await prisma.upload.findFirst({
      where: { id: uploadId, userId },
    });

    if (!upload) {
      return NextResponse.json({ error: "Upload not found" }, { status: 404 });
    }

    if (process.env.ENABLE_SERVER_OCR !== "true") {
      return NextResponse.json(
        { error: "Server OCR disabled" },
        { status: 403 }
      );
    }

    const response = await fetch(upload.url);
    const blob = await response.blob();
    const file = new File([blob], "image.png", { type: "image/png" });
    const rawText = await ocrFromImage(file);

    await prisma.upload.update({
      where: { id: uploadId },
      data: { ocrEngine: "tesseract" },
    });

    return NextResponse.json({
      rawText,
      engine: "tesseract",
    });
  } catch (error) {
    console.error("OCR error:", error);
    return NextResponse.json({ error: "OCR failed" }, { status: 500 });
  }
}
