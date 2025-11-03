"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar } from "@/components/bars/Bar";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Friend {
  friendId: string;
  gameUserId: string;
  displayName?: string;
  synergyScore: number;
  confidence: number;
  tag: "green" | "yellow" | "red";
}

async function fetchFriends(): Promise<Friend[]> {
  const res = await fetch("/api/friends");
  if (!res.ok) throw new Error("Failed to fetch friends");
  return res.json();
}

export default function DashboardPage() {
  const { data: friends = [], isLoading } = useQuery({
    queryKey: ["friends"],
    queryFn: fetchFriends,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
        <p>Loading...</p>
      </div>
    );
  }

  const getTagColor = (tag: string) => {
    switch (tag) {
      case "green":
        return "bg-green-500";
      case "red":
        return "bg-red-500";
      default:
        return "bg-yellow-500";
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <nav className="flex gap-4">
          <Link
            href="/upload"
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            Upload Match
          </Link>
          <Link
            href="/settings"
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/80"
          >
            Settings
          </Link>
        </nav>
      </div>

      {friends.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">
              No friends found. Upload a match to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {friends.map((friend) => (
            <Link key={friend.friendId} href={`/friend/${friend.friendId}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>
                      {friend.displayName || friend.gameUserId}
                    </CardTitle>
                    <div
                      className={cn(
                        "w-3 h-3 rounded-full",
                        getTagColor(friend.tag)
                      )}
                      title={friend.tag}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Synergy
                    </p>
                    <Bar value={friend.synergyScore} label="Synergy Score" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Winrate
                    </p>
                    <Bar value={friend.synergyScore} label="Winrate" />
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Confidence: </span>
                    <span>{Math.round(friend.confidence * 100)}%</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
