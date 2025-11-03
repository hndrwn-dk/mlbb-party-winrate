import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import { computeFeatures } from "@/lib/features";
import { predictBaseline } from "@/lib/baseline";
import { predictExplain } from "@/lib/openai";
import { z } from "zod";

const PredictExplainSchema = z.object({
  friendId: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const body = await request.json();
    const { friendId } = PredictExplainSchema.parse(body);

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

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          ...baseline,
          summary: "OpenAI API key not configured",
          reasons: [],
          doThis: [],
          avoidThis: [],
          heroIdeas: [],
          funCaption: "",
        },
        { status: 200 }
      );
    }

    const explanation = await predictExplain(
      friend,
      features,
      baseline,
      recentMatches
    );

    return NextResponse.json(explanation);
  } catch (error) {
    console.error("Predict-explain error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Predict-explain failed" },
      { status: 500 }
    );
  }
}
