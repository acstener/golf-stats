"use client";

import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">Sidekick 6 Golf</h1>
          <div className="flex gap-2">
            <SignInButton mode="modal">
              <Button variant="ghost" size="sm">Sign In</Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button size="sm">Get Started</Button>
            </SignUpButton>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-bold tracking-tight">
            Stop Chasing Perfect. Start Eliminating Disasters.
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Track the 6 stats that actually matter for amateur golfers. 
            Understand why mistakes happen. Play better golf.
          </p>
          <div className="pt-4">
            <SignUpButton mode="modal">
              <Button size="lg" className="px-8">
                Start Tracking Free
              </Button>
            </SignUpButton>
          </div>
        </div>
      </section>

      {/* Pain Section */}
      <section className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="space-y-8">
          <div className="text-center">
            <h3 className="text-2xl font-semibold mb-2">The Problem</h3>
            <p className="text-muted-foreground">Sound familiar?</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-muted">
              <CardHeader>
                <CardTitle className="text-lg">Traditional Stats Don&apos;t Help</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Strokes-gained and complex metrics tell you you&apos;re worse than scratch golfers. 
                  They don&apos;t tell you HOW to improve.
                </p>
              </CardContent>
            </Card>

            <Card className="border-muted">
              <CardHeader>
                <CardTitle className="text-lg">One Bad Hole Ruins Everything</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  You&apos;re playing well, then BAM - a triple bogey appears. 
                  You never understand why it keeps happening.
                </p>
              </CardContent>
            </Card>

            <Card className="border-muted">
              <CardHeader>
                <CardTitle className="text-lg">Hero Shots Make It Worse</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Bad shot leads to impossible recovery attempt. 
                  Now you&apos;re writing an 8 instead of a 5.
                </p>
              </CardContent>
            </Card>

            <Card className="border-muted">
              <CardHeader>
                <CardTitle className="text-lg">No Clear Patterns</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  You know you&apos;re inconsistent but can&apos;t identify what to work on. 
                  Every round feels like starting over.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Dream Section */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="space-y-8">
            <div className="text-center">
              <h3 className="text-2xl font-semibold mb-2">Imagine Instead...</h3>
              <p className="text-muted-foreground">What golf could be like</p>
            </div>
            
            <div className="space-y-4 max-w-2xl mx-auto">
              <div className="flex gap-4">
                <div className="text-2xl">✓</div>
                <div>
                  <p className="font-medium">Knowing exactly where big numbers come from</p>
                  <p className="text-sm text-muted-foreground">
                    &quot;My doubles mostly start with out-of-position tee shots&quot;
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="text-2xl">✓</div>
                <div>
                  <p className="font-medium">Understanding the root cause of mistakes</p>
                  <p className="text-sm text-muted-foreground">
                    &quot;I three-putt when my approach leaves me above the hole&quot;
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="text-2xl">✓</div>
                <div>
                  <p className="font-medium">Having specific fixes, not generic advice</p>
                  <p className="text-sm text-muted-foreground">
                    &quot;Play to the fat side of the fairway on holes 3, 7, and 14&quot;
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="text-2xl">✓</div>
                <div>
                  <p className="font-medium">Eliminating compounding errors</p>
                  <p className="text-sm text-muted-foreground">
                    &quot;When out of position, just get back in play - no hero shots&quot;
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Fix Section - The Sidekick 6 */}
      <section className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="space-y-8">
          <div className="text-center">
            <h3 className="text-2xl font-semibold mb-2">The Sidekick 6 Solution</h3>
            <p className="text-muted-foreground">
              Track only what matters. Understand why it happens. Fix it.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">1. Out of Position</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  When you can&apos;t hit your normal swing. Track why: lack of commitment, 
                  wrong club, not warmed up.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">2. Failed Easy Up & Downs</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  When you don&apos;t get up and down from situations YOU consider easy. 
                  Everyone&apos;s &quot;easy&quot; is different.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">3. Double Bogeys or Worse</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  The round killers. Track what led to each one - was it the drive, 
                  approach, chip, or putt?
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">4. Three Putts</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Track all three putts and the distance of first putt. 
                  Often starts with a poor approach.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">5. Penalties</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Water, OB, lost ball. Record why: ego distances, poor aim, 
                  uncommitted swing.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">6. Wedge Range Score</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Inside 120 yards = par 3. Goal: get in the hole in 3 shots. 
                  Your scoring zone performance.
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-muted/50 border-muted">
            <CardHeader>
              <CardTitle className="text-lg">The Key: Understanding WHY</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-muted-foreground">
                For each stat, record what happened AND why it happened. 
                This creates patterns that lead to specific solutions.
              </p>
              <p className="text-sm text-muted-foreground italic">
                &quot;Golf really is a game of minimizing your mistakes&quot; - Not chasing perfection.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="space-y-6 text-center">
            <h3 className="text-2xl font-semibold">Built on Proven Principles</h3>
            
            <div className="grid md:grid-cols-3 gap-6 text-left">
              <div className="space-y-2">
                <h4 className="font-medium">No Compounding Errors</h4>
                <p className="text-sm text-muted-foreground">
                  When you&apos;re in trouble, get back in play. Hero shots turn bogeys into triples.
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Your Data, Your Game</h4>
                <p className="text-sm text-muted-foreground">
                  Stop comparing to pros. The only data that matters is YOUR patterns and YOUR improvement.
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Shipped Beats Perfect</h4>
                <p className="text-sm text-muted-foreground">
                  Focus on results, not perfect swings. Understanding patterns leads to lower scores.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 max-w-4xl">
        <Card className="text-center">
          <CardHeader>
            <CardTitle className="text-2xl">
              Ready to Actually Improve Your Game?
            </CardTitle>
            <CardDescription className="text-base">
              Stop tracking vanity metrics. Start understanding your mistakes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Join golfers who are finally breaking their scoring barriers by focusing on what matters.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <SignUpButton mode="modal">
                <Button size="lg" className="px-8">
                  Start Free Today
                </Button>
              </SignUpButton>
              <SignInButton mode="modal">
                <Button variant="outline" size="lg" className="px-8">
                  Sign In
                </Button>
              </SignInButton>
            </div>
            <p className="text-xs text-muted-foreground">
              No credit card required. Track your first round in minutes.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-sm text-muted-foreground">
            <p>© 2024 Sidekick 6 Golf. Built for amateur golfers, by amateur golfers.</p>
            <p className="mt-2 italic">
              &quot;Every second you&apos;re logging stats is a second you&apos;re not facing your demons. 
              But these stats help you find the right demons.&quot;
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}