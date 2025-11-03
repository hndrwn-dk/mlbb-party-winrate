"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bar } from "@/components/bars/Bar";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface FriendDetail {
  friend: {
    id: string;
    gameUserId: string;
    displayName?: string;
    stats: {
      gamesTogether: number;
      winsTogether: number;
      synergyScore: number;
      confidence: number;
    } | null;
  };
  matches: Array<{
    id: string;
    playedAt: string;
    result: string;
    hero?: string;
    k?: number;
    d?: number;
    a?: number;
  }>;
}

interface Prediction {
  winProb: number;
  confidence: number;
  summary: string;
  reasons: string[];
  doThis: string[];
  avoidThis: string[];
  heroIdeas: Array<{ duo: string; why: string }>;
  funCaption: string;
}

async function fetchFriendDetail(id: string): Promise<FriendDetail> {
  const res = await fetch(`/api/friend/${id}`);
  if (!res.ok) throw new Error("Failed to fetch friend");
  return res.json();
}

async function fetchPrediction(id: string): Promise<Prediction> {
  const res = await fetch("/api/openai/predict-explain", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ friendId: id }),
  });
  if (!res.ok) throw new Error("Failed to fetch prediction");
  return res.json();
}

export default function FriendDetailPage() {
  const params = useParams();
  const friendId = params.id as string;

  const { data: friendDetail, isLoading: loadingDetail } = useQuery({
    queryKey: ["friend", friendId],
    queryFn: () => fetchFriendDetail(friendId),
  });

  const { data: prediction, isLoading: loadingPrediction } = useQuery({
    queryKey: ["prediction", friendId],
    queryFn: () => fetchPrediction(friendId),
    enabled: !!friendId,
  });

  if (loadingDetail || loadingPrediction) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading teammate data...</p>
        </div>
      </div>
    );
  }

  if (!friendDetail) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Teammate Not Found</h2>
          <p className="text-muted-foreground mb-4">This teammate doesn&apos;t exist or has been removed</p>
          <Link
            href="/dashboard"
            className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const stats = friendDetail.friend.stats;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2 text-foreground tracking-tight">
              {friendDetail.friend.displayName || friendDetail.friend.gameUserId}
            </h1>
            {friendDetail.friend.displayName && (
              <p className="text-muted-foreground">{friendDetail.friend.gameUserId}</p>
            )}
          </div>
          <Link
            href="/dashboard"
            className="px-6 py-2.5 bg-secondary hover:bg-secondary/80 border border-border rounded-lg transition-all duration-200 hover:scale-105"
          >
            Back to Dashboard
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-6">
          <Card className="card-glow border-primary/20 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl">Win Prediction</CardTitle>
              <CardDescription>AI-powered prediction for next match</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {prediction ? (
                <>
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <p className="text-sm font-semibold text-muted-foreground">
                        Win Probability
                      </p>
                      <span className="text-2xl font-bold text-primary">
                        {Math.round(prediction.winProb * 100)}%
                      </span>
                    </div>
                    <Bar value={prediction.winProb} />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <p className="text-sm font-semibold text-muted-foreground">
                        Confidence
                      </p>
                      <span className="text-lg font-semibold">
                        {Math.round(prediction.confidence * 100)}%
                      </span>
                    </div>
                    <Bar value={prediction.confidence} />
                  </div>
                  <div className="pt-4 border-t border-border">
                    <p className="text-sm leading-relaxed">{prediction.summary}</p>
                    {prediction.funCaption && (
                      <p className="text-sm italic text-primary/80 mt-3 font-medium">
                        &ldquo;{prediction.funCaption}&rdquo;
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No prediction available</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Upload more matches to generate predictions
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="card-glow border-primary/20 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl">Statistics</CardTitle>
              <CardDescription>Performance metrics together</CardDescription>
            </CardHeader>
            <CardContent>
              {stats ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-muted/30 border border-border">
                    <p className="text-xs text-muted-foreground mb-1">Games Together</p>
                    <p className="text-2xl font-bold">{stats.gamesTogether}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30 border border-border">
                    <p className="text-xs text-muted-foreground mb-1">Wins Together</p>
                    <p className="text-2xl font-bold text-primary">{stats.winsTogether}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30 border border-border">
                    <p className="text-xs text-muted-foreground mb-1">Synergy Score</p>
                    <p className="text-2xl font-bold">{Math.round(stats.synergyScore * 100)}%</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30 border border-border">
                    <p className="text-xs text-muted-foreground mb-1">Confidence</p>
                    <p className="text-2xl font-bold">{Math.round(stats.confidence * 100)}%</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No statistics available</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Upload matches to start tracking
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {prediction && (
          <Card className="card-glow border-primary/20 bg-card/50 backdrop-blur-sm mb-6">
            <CardHeader>
              <CardTitle className="text-xl">AI Recommendations</CardTitle>
              <CardDescription>Optimize your duo performance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {prediction.reasons.length > 0 && (
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <h3 className="font-semibold mb-3 text-primary">Why This Prediction</h3>
                  <ul className="space-y-2 text-sm">
                    {prediction.reasons.map((reason, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                {prediction.doThis.length > 0 && (
                  <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                    <h3 className="font-semibold mb-3 text-green-500">Do This</h3>
                    <ul className="space-y-2 text-sm">
                      {prediction.doThis.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-green-500 mt-1">✓</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {prediction.avoidThis.length > 0 && (
                  <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                    <h3 className="font-semibold mb-3 text-red-500">Avoid This</h3>
                    <ul className="space-y-2 text-sm">
                      {prediction.avoidThis.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-red-500 mt-1">✗</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {prediction.heroIdeas.length > 0 && (
                <div className="p-4 rounded-lg bg-muted/30 border border-border">
                  <h3 className="font-semibold mb-3">Hero Synergy Ideas</h3>
                  <div className="grid gap-3">
                    {prediction.heroIdeas.map((idea, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-background border border-border"
                      >
                        <p className="font-semibold text-sm mb-1 text-primary">
                          {idea.duo}
                        </p>
                        <p className="text-xs text-muted-foreground">{idea.why}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card className="card-glow border-primary/20 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl">Recent Matches</CardTitle>
            <CardDescription>Last 10 matches played together</CardDescription>
          </CardHeader>
          <CardContent>
            {friendDetail.matches.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-3 font-semibold">Date</th>
                      <th className="text-left p-3 font-semibold">Result</th>
                      <th className="text-left p-3 font-semibold">Hero</th>
                      <th className="text-left p-3 font-semibold">K/D/A</th>
                    </tr>
                  </thead>
                  <tbody>
                    {friendDetail.matches.map((match) => (
                      <tr
                        key={match.id}
                        className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                      >
                        <td className="p-3">
                          {new Date(match.playedAt).toLocaleDateString()}
                        </td>
                        <td className="p-3">
                          <span
                            className={cn(
                              "px-2 py-1 rounded text-xs font-semibold",
                              match.result === "win"
                                ? "bg-green-500/20 text-green-400"
                                : "bg-red-500/20 text-red-400"
                            )}
                          >
                            {match.result.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3 font-medium">
                          {match.hero || "Unknown"}
                        </td>
                        <td className="p-3 font-mono">
                          {match.k ?? 0}/{match.d ?? 0}/{match.a ?? 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-2">No matches recorded yet</p>
                <p className="text-xs text-muted-foreground">
                  Upload matches to start tracking performance
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}