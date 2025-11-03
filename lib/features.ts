import { Friend, FriendStats, Match, MatchPlayer } from "@prisma/client";

export interface FeatureVector {
  wrTogether: number;
  friendKdaLast3: number;
  deathsGap: number;
  roleComboScore: number;
  partySizeNorm: number;
}

export async function computeFeatures(
  friend: Friend & { stats: FriendStats | null },
  recentMatches: (Match & {
    players: (MatchPlayer & { friend: Friend | null })[];
  })[]
): Promise<FeatureVector> {
  const stats = friend.stats;
  const wrTogether =
    stats && stats.gamesTogether > 0
      ? stats.winsTogether / stats.gamesTogether
      : 0.5;

  const friendMatches = recentMatches
    .flatMap((m) =>
      m.players.filter((p) => p.friendId === friend.id && p.k !== null)
    )
    .slice(0, 3);

  let friendKdaLast3 = 0;
  if (friendMatches.length > 0) {
    const totalK = friendMatches.reduce((sum, p) => sum + (p.k ?? 0), 0);
    const totalD = friendMatches.reduce((sum, p) => sum + (p.d ?? 0), 0);
    const totalA = friendMatches.reduce((sum, p) => sum + (p.a ?? 0), 0);
    const kda = (totalK + totalA * 0.5) / Math.max(totalD, 1);
    friendKdaLast3 = Math.min(kda / 6, 1);
  }

  let deathsGap = 0;
  if (recentMatches.length > 0) {
    const ownerDeaths = recentMatches
      .flatMap((m) =>
        m.players.filter((p) => p.isOwnerParty && p.d !== null).map((p) => p.d!)
      )
      .slice(0, 5);
    const friendDeaths = friendMatches.map((p) => p.d ?? 0).slice(0, 5);

    if (ownerDeaths.length > 0 && friendDeaths.length > 0) {
      const avgOwnerDeaths =
        ownerDeaths.reduce((sum, d) => sum + d, 0) / ownerDeaths.length;
      const avgFriendDeaths =
        friendDeaths.reduce((sum, d) => sum + d, 0) / friendDeaths.length;
      deathsGap = (avgOwnerDeaths - avgFriendDeaths) / 10;
      deathsGap = Math.max(-1, Math.min(1, deathsGap));
    }
  }

  const roleComboScore = 0;

  const partySizeNorm = recentMatches[0]?.partySize
    ? recentMatches[0].partySize / 5
    : 0.6;

  return {
    wrTogether,
    friendKdaLast3,
    deathsGap,
    roleComboScore,
    partySizeNorm,
  };
}
