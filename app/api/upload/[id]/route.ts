import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import { del } from "@vercel/blob";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireUserId();
    const { id } = await params;

    const upload = await prisma.upload.findFirst({
      where: { id, userId },
    });

    if (!upload) {
      return NextResponse.json(
        { error: "Upload not found" },
        { status: 404 }
      );
    }

    // Delete the blob from Vercel Blob storage
    try {
      await del(upload.url);
    } catch (blobError) {
      console.error("Failed to delete blob:", blobError);
      // Continue with database deletion even if blob deletion fails
    }

    // Delete from database
    await prisma.upload.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete upload error:", error);
    return NextResponse.json(
      { error: "Failed to delete upload" },
      { status: 500 }
    );
  }
}

