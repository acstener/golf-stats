"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Play } from "lucide-react";
import Link from "next/link";
import { COURSES, findCourse } from "@/lib/courses";

const CUSTOM = "__custom__";

export default function NewRoundPage() {
  const [selectedCourseId, setSelectedCourseId] = useState<string>(COURSES[0]?.id ?? CUSTOM);
  const [customName, setCustomName] = useState("");
  const [selectedTeeId, setSelectedTeeId] = useState<string>(COURSES[0]?.tees[0]?.id ?? "");
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();
  const createRound = useMutation(api.rounds.createRound);

  const isCustom = selectedCourseId === CUSTOM;
  const selectedCourse = isCustom ? undefined : findCourse(selectedCourseId);
  const selectedTee = selectedCourse?.tees.find((t) => t.id === selectedTeeId);

  const courseName = isCustom ? customName.trim() : selectedCourse?.name ?? "";
  const canStart = courseName.length > 0 && (isCustom || !!selectedTee);

  const handleStartRound = async () => {
    if (!canStart) return;
    setIsCreating(true);
    try {
      const roundId = await createRound({
        courseName,
        courseId: selectedCourse?.id,
        teeId: selectedTee?.id,
        teeName: selectedTee?.name,
      });
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
              Pick your course and tees to pre-fill hole pars and yardages
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="course">Course</Label>
              <Select value={selectedCourseId} onValueChange={(v) => {
                setSelectedCourseId(v);
                const c = findCourse(v);
                setSelectedTeeId(c?.tees[0]?.id ?? "");
              }}>
                <SelectTrigger id="course" className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COURSES.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} — {c.clubName}
                    </SelectItem>
                  ))}
                  <SelectItem value={CUSTOM}>Other course…</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isCustom && (
              <div className="space-y-2">
                <Label htmlFor="custom-name">Course Name</Label>
                <Input
                  id="custom-name"
                  placeholder="e.g., Riverside Golf Club"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  disabled={isCreating}
                  autoFocus
                  className="h-12"
                />
              </div>
            )}

            {selectedCourse && (
              <div className="space-y-2">
                <Label htmlFor="tee">Tees</Label>
                <Select value={selectedTeeId} onValueChange={setSelectedTeeId}>
                  <SelectTrigger id="tee" className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedCourse.tees.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name} — {t.totalYardage}yd, Par {t.par} (CR {t.courseRating}/Slope {t.slopeRating})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedCourse.description && (
                  <p className="text-xs text-muted-foreground pt-1">{selectedCourse.description}</p>
                )}
              </div>
            )}

            <Button
              className="w-full"
              size="lg"
              onClick={handleStartRound}
              disabled={!canStart || isCreating}
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
