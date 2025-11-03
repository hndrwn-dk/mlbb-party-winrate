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
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
