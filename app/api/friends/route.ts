import { NextRequest, NextResponse } from "next/server";
import { requireUserId } from "@/lib/guard";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const userId = await requireUserId();

    const friends = await prisma.friend.findMany({
      where: { userId },
      include: { stats: true },
    });

    const result = friends
      .map((friend) => {
        const stats = friend.stats;
        const synergyScore = stats?.synergyScore ?? 0;
        const confidence = stats?.confidence ?? 0;

        let tag: "green" | "yellow" | "red" = "yellow";
        if (synergyScore >= 0.6 && confidence >= 0.5) {
          tag = "green";
        } else if (synergyScore < 0.4 || confidence < 0.3) {
          tag = "red";
        }

        return {
          friendId: friend.id,
          gameUserId: friend.gameUserId,
          displayName: friend.displayName,
          synergyScore,
          confidence,
          tag,
        };
      })
      .sort((a, b) => b.synergyScore - a.synergyScore);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Friends error:", error);
    return NextResponse.json({ error: "Failed to fetch friends" }, { status: 500 });
  }
}
