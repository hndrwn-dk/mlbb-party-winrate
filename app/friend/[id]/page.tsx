"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar } from "@/components/bars/Bar";
import Link from "next/link";

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
      <div className="container mx-auto p-6">
        <p>Loading...</p>
      </div>
    );
  }

  if (!friendDetail) {
    return (
      <div className="container mx-auto p-6">
        <p>Friend not found</p>
      </div>
    );
  }

  const stats = friendDetail.friend.stats;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">
          {friendDetail.friend.displayName || friendDetail.friend.gameUserId}
        </h1>
        <Link
          href="/dashboard"
          className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/80"
        >
          Back to Dashboard
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Prediction</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {prediction ? (
              <>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Win Probability
                  </p>
                  <Bar
                    value={prediction.winProb}
                    label={`${Math.round(prediction.winProb * 100)}%`}
                  />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Confidence
                  </p>
                  <Bar
                    value={prediction.confidence}
                    label={`${Math.round(prediction.confidence * 100)}%`}
                  />
                </div>
                <p className="text-sm">{prediction.summary}</p>
                {prediction.funCaption && (
                  <p className="text-sm italic text-muted-foreground">
                    {prediction.funCaption}
                  </p>
                )}
              </>
            ) : (
              <p className="text-muted-foreground">No prediction available</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stats</CardTitle>
          </CardHeader>
          <CardContent>
            {stats ? (
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Games Together: </span>
                  <span>{stats.gamesTogether}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Wins Together: </span>
                  <span>{stats.winsTogether}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Synergy Score: </span>
                  <span>{Math.round(stats.synergyScore * 100)}%</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Confidence: </span>
                  <span>{Math.round(stats.confidence * 100)}%</span>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No stats available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {prediction && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {prediction.reasons.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Reasons</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {prediction.reasons.map((reason, idx) => (
                    <li key={idx}>{reason}</li>
                  ))}
                </ul>
              </div>
            )}

            {prediction.doThis.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Do This</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {prediction.doThis.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {prediction.avoidThis.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Avoid This</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {prediction.avoidThis.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {prediction.heroIdeas.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Hero Ideas</h3>
                <ul className="space-y-2 text-sm">
                  {prediction.heroIdeas.map((idea, idx) => (
                    <li key={idx}>
                      <span className="font-medium">{idea.duo}:</span>{" "}
                      {idea.why}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recent Matches</CardTitle>
        </CardHeader>
        <CardContent>
          {friendDetail.matches.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Date</th>
                    <th className="text-left p-2">Result</th>
                    <th className="text-left p-2">Hero</th>
                    <th className="text-left p-2">K/D/A</th>
                  </tr>
                </thead>
                <tbody>
                  {friendDetail.matches.map((match) => (
                    <tr key={match.id} className="border-b">
                      <td className="p-2">
                        {new Date(match.playedAt).toLocaleDateString()}
                      </td>
                      <td className="p-2">
                        <span
                          className={
                            match.result === "win"
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          {match.result.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-2">{match.hero || "Unknown"}</td>
                      <td className="p-2">
                        {match.k ?? 0}/{match.d ?? 0}/{match.a ?? 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted-foreground">No recent matches</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
