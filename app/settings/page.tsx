"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import Link from "next/link";

interface Friend {
  id: string;
  gameUserId: string;
  displayName?: string;
}

async function fetchFriends(): Promise<Friend[]> {
  const res = await fetch("/api/friends");
  if (!res.ok) throw new Error("Failed to fetch friends");
  return res.json();
}

export default function SettingsPage() {
  const [recomputing, setRecomputing] = useState(false);
  const queryClient = useQueryClient();

  const { data: friends = [] } = useQuery({
    queryKey: ["friends"],
    queryFn: fetchFriends,
  });

  const handleRecompute = async () => {
    setRecomputing(true);
    try {
      const res = await fetch("/api/recompute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!res.ok) throw new Error("Recompute failed");

      await queryClient.invalidateQueries({ queryKey: ["friends"] });
      alert("Stats recomputed successfully!");
    } catch (error) {
      console.error("Recompute error:", error);
      alert("Recompute failed");
    } finally {
      setRecomputing(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Settings</h1>
        <Link
          href="/dashboard"
          className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/80"
        >
          Back to Dashboard
        </Link>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Server OCR</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Switch id="server-ocr" disabled />
            <Label htmlFor="server-ocr">
              Enable server-side OCR (currently disabled)
            </Label>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Recompute Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Recompute synergy scores and statistics for all friends
          </p>
          <Button onClick={handleRecompute} disabled={recomputing}>
            {recomputing ? "Recomputing..." : "Recompute All Stats"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Friends ({friends.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {friends.length > 0 ? (
            <ul className="space-y-2">
              {friends.map((friend) => (
                <li
                  key={friend.id}
                  className="flex items-center justify-between p-2 border rounded"
                >
                  <div>
                    <span className="font-medium">
                      {friend.displayName || friend.gameUserId}
                    </span>
                    <span className="text-sm text-muted-foreground ml-2">
                      ({friend.gameUserId})
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">No friends found</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
