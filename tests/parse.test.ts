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

  it("should handle real OCR output with multiple symbols", () => {
    const ocrText = `B 26 Ady 19
a: —— Duration 14:24
$333 xe& $ 8 x84 $333
® Gow kaung khant6 4 4 10471 N . 7921 1 5 6 ZURA™
A) f A | J oN Y
o® Ti hee ® ® Grwas Ele
& ©@ATRS Agatsuma 3 3 4 8538 . N 8227 1 3 3 Not_Alu@
veer @ ® Tanpais Bye
A © BABA garou 2 2 10 9283 8999 10 7 1 cctv berjalan @ (of
Brees # B Goan (fe
@ by one 7 5 2 9906 \ . 7660 6 6 1 adrielyos
VY saeco: B® ® sxoes v
Ts ® Rus Perbasmikuman 8 5 5 12227 NE 8587 1 5 2 RRQ yakuza™
vfo) ancy BP ® "waaw
BattlelD 794254285037814899 —`;

    const result = parseScoreboard(ocrText);
    expect(result).not.toBeNull();
    
    if (result) {
      // Should extract players with correct normalization
      const atrsPlayer = result.players.find((p) => 
        p.gameUserId?.includes("atrs") || p.displayName?.includes("ATRS")
      );
      expect(atrsPlayer).toBeDefined();
      expect(atrsPlayer?.gameUserId).toBe("atrs_agatsuma");
      
      const babaPlayer = result.players.find((p) => 
        p.gameUserId?.includes("baba") || p.displayName?.includes("BABA")
      );
      expect(babaPlayer).toBeDefined();
      expect(babaPlayer?.gameUserId).toBe("baba_garou");
      
      // Verify all ATRS variations produce same gameUserId
      const atrsVariations = result.players
        .filter((p) => p.displayName?.includes("ATRS") || p.gameUserId?.includes("atrs"))
        .map((p) => p.gameUserId);
      const uniqueAtrsIds = new Set(atrsVariations);
      expect(uniqueAtrsIds.size).toBeLessThanOrEqual(1); // Should be 1 or 0 (if none found)
    }
  });
});
