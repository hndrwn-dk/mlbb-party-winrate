import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/guard";
import { uploadBlob } from "@/lib/blob";
import { prisma } from "@/lib/prisma";
export async function POST(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size exceeds 10MB limit" },
        { status: 400 }
      );
    }

    // Check if BLOB_READ_WRITE_TOKEN is configured
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error("BLOB_READ_WRITE_TOKEN is not configured");
      return NextResponse.json(
        { error: "Blob storage not configured. Please set BLOB_READ_WRITE_TOKEN environment variable." },
        { status: 500 }
      );
    }

    const blobUrl = await uploadBlob(file);
    
    const upload = await prisma.upload.create({
      data: {
        userId,
        url: blobUrl,
        processed: false,
      },
    });

    return NextResponse.json({
      uploadUrl: upload.url,
      blobUrl,
      uploadId: upload.id,
    });
  } catch (error) {
    console.error("Upload error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { 
        error: "Failed to upload file",
        details: process.env.NODE_ENV === "development" ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}
