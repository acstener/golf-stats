"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { 
  ChevronLeft, 
  ChevronRight, 
  Minus, 
  Plus,
  Flag,
  AlertTriangle,
  Waves,
  Trees,
  CircleX,
  Shuffle
} from "lucide-react";

const STAT_ICONS = {
  threePutt: Flag,
  penalty: AlertTriangle,
  bunker: CircleX,
  waterHazard: Waves,
  outOfBounds: Trees,
  duffedChip: Shuffle,
};

const STAT_LABELS = {
  threePutt: "3-Putt",
  penalty: "Penalty",
  bunker: "Bunker",
  waterHazard: "Water",
  outOfBounds: "OB",
  duffedChip: "Duffed",
};

export default function HoleTrackerPage() {
  const params = useParams();
  const router = useRouter();
  const roundId = params.roundId as Id<"rounds">;
  const holeNum = parseInt(params.holeNum as string);

  const [par, setPar] = useState(4);
  const [strokes, setStrokes] = useState(4);
  const [selectedStats, setSelectedStats] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const round = useQuery(api.rounds.getRound, { roundId });
  const existingHole = useQuery(api.holes.getHole, { roundId, holeNumber: holeNum });
  const saveHole = useMutation(api.holes.saveHole);

  // Load existing hole data
  useEffect(() => {
    if (existingHole) {
      setPar(existingHole.par);
      setStrokes(existingHole.strokes);
      const stats = [];
      if (existingHole.stats.threePutt) stats.push("threePutt");
      if (existingHole.stats.penalty) stats.push("penalty");
      if (existingHole.stats.bunker) stats.push("bunker");
      if (existingHole.stats.waterHazard) stats.push("waterHazard");
      if (existingHole.stats.outOfBounds) stats.push("outOfBounds");
      if (existingHole.stats.duffedChip) stats.push("duffedChip");
      setSelectedStats(stats);
    }
  }, [existingHole]);

  const handleSaveAndNext = async () => {
    setIsSaving(true);
    try {
      await saveHole({
        roundId,
        holeNumber: holeNum,
        par,
        strokes,
        stats: {
          threePutt: selectedStats.includes("threePutt"),
          penalty: selectedStats.includes("penalty"),
          bunker: selectedStats.includes("bunker"),
          waterHazard: selectedStats.includes("waterHazard"),
          outOfBounds: selectedStats.includes("outOfBounds"),
          duffedChip: selectedStats.includes("duffedChip"),
        },
      });

      if (holeNum === 18) {
        // Go to summary
        router.push(`/round/${roundId}/summary`);
      } else {
        // Go to next hole
        router.push(`/round/${roundId}/hole/${holeNum + 1}`);
      }
    } catch (error) {
      console.error("Failed to save hole:", error);
      setIsSaving(false);
    }
  };

  const handlePrevious = () => {
    if (holeNum > 1) {
      router.push(`/round/${roundId}/hole/${holeNum - 1}`);
    }
  };

  const scoreDiff = strokes - par;
  const scoreColor = scoreDiff < 0 ? "text-green-600" : scoreDiff > 0 ? "text-red-600" : "";

  // Calculate running score
  const runningScore = round?.holes
    ?.filter(h => h.holeNumber < holeNum)
    .reduce((acc, h) => acc + (h.strokes - h.par), 0) || 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header with progress */}
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="container mx-auto p-4">
          <div className="flex items-center justify-between mb-2">
            <Badge variant="outline" className="text-lg px-3 py-1">
              Hole {holeNum} • Par {par}
            </Badge>
            <Badge variant={runningScore > 0 ? "destructive" : runningScore < 0 ? "default" : "secondary"}>
              {runningScore > 0 ? "+" : ""}{runningScore}
            </Badge>
          </div>
          <Progress value={(holeNum / 18) * 100} className="h-2" />
        </div>
      </header>

      <main className="container mx-auto p-4 max-w-lg space-y-4">
        {/* Par Selection */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Par</CardTitle>
          </CardHeader>
          <CardContent>
            <ToggleGroup 
              type="single" 
              value={par.toString()}
              onValueChange={(value) => value && setPar(parseInt(value))}
              className="justify-start"
            >
              <ToggleGroupItem value="3" className="w-16">3</ToggleGroupItem>
              <ToggleGroupItem value="4" className="w-16">4</ToggleGroupItem>
              <ToggleGroupItem value="5" className="w-16">5</ToggleGroupItem>
            </ToggleGroup>
          </CardContent>
        </Card>

        {/* Score Entry */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setStrokes(Math.max(1, strokes - 1))}
                className="h-12 w-12"
              >
                <Minus className="h-5 w-5" />
              </Button>
              
              <div className="flex-1 text-center">
                <div className="text-4xl font-bold">{strokes}</div>
                {strokes !== par && (
                  <div className={`text-sm ${scoreColor}`}>
                    {scoreDiff > 0 ? "+" : ""}{scoreDiff}
                  </div>
                )}
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setStrokes(strokes + 1)}
                className="h-12 w-12"
              >
                <Plus className="h-5 w-5" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Tracking */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">What Happened?</CardTitle>
          </CardHeader>
          <CardContent>
            <ToggleGroup 
              type="multiple"
              value={selectedStats}
              onValueChange={setSelectedStats}
              className="grid grid-cols-3 gap-2"
            >
              {Object.entries(STAT_LABELS).map(([key, label]) => {
                const Icon = STAT_ICONS[key as keyof typeof STAT_ICONS];
                return (
                  <ToggleGroupItem 
                    key={key}
                    value={key}
                    className="h-20 flex-col gap-2"
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-xs">{label}</span>
                  </ToggleGroupItem>
                );
              })}
            </ToggleGroup>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={holeNum === 1}
            className="flex-1"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>
          
          <Button
            onClick={handleSaveAndNext}
            disabled={isSaving}
            className="flex-1"
          >
            {isSaving ? "Saving..." : holeNum === 18 ? "Finish Round" : "Save & Next"}
            {holeNum < 18 && <ChevronRight className="ml-2 h-4 w-4" />}
          </Button>
        </div>

        {/* Course name reminder */}
        {round && (
          <p className="text-center text-sm text-muted-foreground">
            {round.courseName}
          </p>
        )}
      </main>
    </div>
  );
}