"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Play } from "lucide-react";
import Link from "next/link";

export default function NewRoundPage() {
  const [courseName, setCourseName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();
  const createRound = useMutation(api.rounds.createRound);

  const handleStartRound = async () => {
    if (!courseName.trim()) return;
    
    setIsCreating(true);
    try {
      const roundId = await createRound({ courseName: courseName.trim() });
      router.push(`/round/${roundId}/hole/1`);
    } catch (error) {
      console.error("Failed to create round:", error);
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background border-b p-4">
        <div className="container mx-auto flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">New Round</h1>
        </div>
      </header>

      <main className="container mx-auto p-4 max-w-lg">
        <Card>
          <CardHeader>
            <CardTitle>Start Your Round</CardTitle>
            <CardDescription>
              Enter the course name to begin tracking
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="course">Course Name</Label>
              <Input
                id="course"
                placeholder="e.g., Riverside Golf Club"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && courseName.trim()) {
                    handleStartRound();
                  }
                }}
                disabled={isCreating}
                autoFocus
              />
            </div>

            <Button 
              className="w-full" 
              size="lg"
              onClick={handleStartRound}
              disabled={!courseName.trim() || isCreating}
            >
              <Play className="mr-2 h-5 w-5" />
              {isCreating ? "Starting..." : "Start Round"}
            </Button>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Quick Start Tips</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• Tap stats as they happen during your round</p>
            <p>• Enter your score after each hole</p>
            <p>• Review your problem areas after 18 holes</p>
            <p>• Track trends over multiple rounds</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}