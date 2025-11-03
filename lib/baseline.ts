import { Friend, FriendStats } from "@prisma/client";
import type { FeatureVector } from "./features";

interface BaselineResult {
  prob: number;
  confidence: number;
}

export function predictBaseline(
  friend: Friend & { stats: FriendStats | null },
  features: FeatureVector
): BaselineResult {
  const stats = friend.stats;

  if (!stats || stats.gamesTogether < 5) {
    return {
      prob: 0.5,
      confidence: 0.2,
    };
  }

  const wr = features.wrTogether;
  const kda = features.friendKdaLast3;
  const deathGap = features.deathsGap;
  const roleScore = features.roleComboScore;
  const partyNorm = features.partySizeNorm;

  const logit =
    -0.5 +
    1.2 * wr +
    0.3 * kda +
    0.2 * deathGap +
    0.1 * roleScore +
    0.15 * partyNorm;

  const prob = 1 / (1 + Math.exp(-logit));
  const clampedProb = Math.max(0.1, Math.min(0.9, prob));

  const confidence = Math.min(
    0.35 + (stats.gamesTogether / 50) * 0.5,
    0.9
  );

  return {
    prob: clampedProb,
    confidence,
  };
}
