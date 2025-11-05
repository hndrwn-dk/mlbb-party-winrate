import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/guard";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const userId = await requireUserId();
    
    const uploads = await prisma.upload.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        url: true,
        processed: true,
        createdAt: true,
        parseNotes: true,
      },
    });

    return NextResponse.json({ uploads });
  } catch (error) {
    console.error("Get uploads error:", error);
    return NextResponse.json(
      { error: "Failed to fetch uploads" },
      { status: 500 }
    );
  }
}

