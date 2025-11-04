import { parseScoreboard } from "../lib/parse";

describe("parseScoreboard", () => {
  it("should parse a basic scoreboard", () => {
    const mockText = `
      player1
      Layla
      5/2/8 12000 GPM
      Victory
    `;

    const result = parseScoreboard(mockText);
    expect(result).not.toBeNull();
    expect(result?.result).toBe("win");
    expect(result?.players.length).toBeGreaterThan(0);
  });

  it("should handle defeat result", () => {
    const mockText = `
      player1
      Alucard
      3/5/2
      Defeat
    `;

    const result = parseScoreboard(mockText);
    expect(result).not.toBeNull();
    expect(result?.result).toBe("lose");
  });

  it("should return null for invalid input", () => {
    const mockText = "invalid text";
    const result = parseScoreboard(mockText);
    expect(result).toBeNull();
  });

  it("should extract KDA values", () => {
    const mockText = `
      testplayer
      Miya
      10/3/15
      Victory
    `;

    const result = parseScoreboard(mockText);
    expect(result).not.toBeNull();
    if (result) {
      const player = result.players.find((p) => p.k === 10);
      expect(player).toBeDefined();
      expect(player?.d).toBe(3);
      expect(player?.a).toBe(15);
    }
  });

  it("should normalize OCR artifacts in player names", () => {
    const testCases = [
      {
        input: "BATRS Agatsuma\n5/2/8",
        expectedGameUserId: "atrs_agatsuma",
      },
      {
        input: "© ATRS Agatsuma\n5/2/8",
        expectedGameUserId: "atrs_agatsuma",
      },
      {
        input: "ATRSAgatsuma\n5/2/8",
        expectedGameUserId: "atrs_agatsuma",
      },
      {
        input: "San d ATRS Agatsuma\n5/2/8",
        expectedGameUserId: "atrs_agatsuma",
      },
    ];

    for (const testCase of testCases) {
      const result = parseScoreboard(testCase.input);
      expect(result).not.toBeNull();
      if (result && result.players.length > 0) {
        const player = result.players[0];
        expect(player.gameUserId).toBe(testCase.expectedGameUserId);
      }
    }
  });

  it("should produce same gameUserId for variations of same player name", () => {
    const variations = [
      "ATRS Agatsuma\n5/2/8",
      "BATRS Agatsuma\n5/2/8",
      "© ATRS Agatsuma\n5/2/8",
      "ATRSAgatsuma\n5/2/8",
    ];

    const gameUserIds = variations
      .map((text) => parseScoreboard(text))
      .filter((result) => result !== null)
      .map((result) => result!.players[0]?.gameUserId)
      .filter((id) => id !== undefined);

    // All variations should produce the same normalized gameUserId
    const uniqueIds = new Set(gameUserIds);
    expect(uniqueIds.size).toBe(1);
    expect(gameUserIds[0]).toBe("atrs_agatsuma");
  });
});
