import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import { computeFeatures } from "@/lib/features";
import { predictBaseline } from "@/lib/baseline";
import { z } from "zod";

const PredictSchema = z.object({
  friendId: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const body = await request.json();
    const { friendId } = PredictSchema.parse(body);

    const friend = await prisma.friend.findFirst({
      where: { id: friendId, userId },
      include: { stats: true },
    });

    if (!friend) {
      return NextResponse.json({ error: "Friend not found" }, { status: 404 });
    }

    const recentMatches = await prisma.match.findMany({
      where: {
        ownerId: userId,
        players: {
          some: {
            friendId: friend.id,
          },
        },
      },
      include: {
        players: {
          include: {
            friend: true,
          },
        },
      },
      orderBy: {
        playedAt: "desc",
      },
      take: 10,
    });

    const features = await computeFeatures(friend, recentMatches);
    const baseline = predictBaseline(friend, features);

    return NextResponse.json({
      winProb: baseline.prob,
      confidence: baseline.confidence,
      reason: `Baseline prediction based on ${friend.stats?.gamesTogether ?? 0} games together`,
    });
  } catch (error) {
    console.error("Predict error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Predict failed" }, { status: 500 });
  }
}
