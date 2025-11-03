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
});
