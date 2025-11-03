import { predictBaseline } from "../lib/baseline";
import type { Friend, FriendStats } from "@prisma/client";
import type { FeatureVector } from "../lib/features";

describe("predictBaseline", () => {
  const mockFriend: Friend & { stats: FriendStats | null } = {
    id: "test-id",
    userId: "user-id",
    gameUserId: "player123",
    displayName: "Test",
    createdAt: new Date(),
    stats: {
      id: "stats-id",
      friendId: "test-id",
      gamesTogether: 10,
      winsTogether: 7,
      avgK: 5.2,
      avgD: 3.1,
      avgA: 8.5,
      synergyScore: 0.7,
      confidence: 0.65,
      lastComputedAt: new Date(),
    },
  };

  const mockFeatures: FeatureVector = {
    wrTogether: 0.7,
    friendKdaLast3: 0.8,
    deathsGap: -0.2,
    roleComboScore: 0.1,
    partySizeNorm: 0.8,
  };

  it("should return prob between 0.1 and 0.9", () => {
    const result = predictBaseline(mockFriend, mockFeatures);
    expect(result.prob).toBeGreaterThanOrEqual(0.1);
    expect(result.prob).toBeLessThanOrEqual(0.9);
  });

  it("should return confidence between 0 and 1", () => {
    const result = predictBaseline(mockFriend, mockFeatures);
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);
  });

  it("should handle thin data (< 5 games)", () => {
    const thinFriend = {
      ...mockFriend,
      stats: {
        ...mockFriend.stats!,
        gamesTogether: 3,
      },
    };

    const result = predictBaseline(thinFriend, mockFeatures);
    expect(result.prob).toBe(0.5);
    expect(result.confidence).toBe(0.2);
  });

  it("should handle null stats", () => {
    const noStatsFriend = {
      ...mockFriend,
      stats: null,
    };

    const result = predictBaseline(noStatsFriend, mockFeatures);
    expect(result.prob).toBe(0.5);
    expect(result.confidence).toBe(0.2);
  });

  it("should be monotonic with winrate", () => {
    const highWr = { ...mockFeatures, wrTogether: 0.9 };
    const lowWr = { ...mockFeatures, wrTogether: 0.3 };

    const highResult = predictBaseline(mockFriend, highWr);
    const lowResult = predictBaseline(mockFriend, lowWr);

    expect(highResult.prob).toBeGreaterThan(lowResult.prob);
  });
});
