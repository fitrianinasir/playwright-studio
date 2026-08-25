"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PROJECT_ID } from "@/lib/project";
import type { Baseline, TestRun } from "@/lib/studio-types";

type Pair = {
  baseline: Baseline;
  latest?: { image: string; diff?: string; accuracy?: number; runId: string };
};

export default function RegressionPage() {
  const [baselines, setBaselines] = useState<Baseline[]>([]);
  const [runs, setRuns] = useState<TestRun[]>([]);

  useEffect(() => {
    fetch(`/api/projects/${PROJECT_ID}/runs`)
      .then((response) => response.json())
      .then((payload) => {
        setRuns(payload.runs ?? []);
        setBaselines(payload.baselines ?? []);
      });
  }, []);

  const pairs: Pair[] = useMemo(() => {
    return baselines.map((baseline) => {
      const match = runs
        .flatMap((run) =>
          run.results.flatMap((result) =>
            result.steps
              .filter(
                (step) =>
                  step.screenshot &&
                  result.browser === baseline.browser &&
                  run.device === baseline.device &&
                  run.scenarioId === baseline.scenarioId &&
                  (step.name === baseline.snapshotName ||
                    step.kind === "screenshot" ||
                    step.kind === "visualCompare"),
              )
              .map((step) => ({
                image: step.screenshot!,
                diff: step.diff,
                accuracy: step.accuracy,
                runId: run.id,
              })),
          ),
        )
        .at(0);
      return { baseline, latest: match };
    });
  }, [baselines, runs]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Visual regression</h2>
        <p className="text-sm text-muted-foreground">
          Baseline versus the latest capture. Highlighted pixels come from pixelmatch.
        </p>
      </div>
      {pairs.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No baselines yet</CardTitle>
            <CardDescription>
              Run <span className="font-medium">Login → home snapshot</span> or the Figma
              hero scenario. The first screenshot becomes the baseline.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}
      {pairs.map(({ baseline, latest }) => (
        <Card key={baseline.id}>
          <CardHeader>
            <CardTitle>{baseline.snapshotName}</CardTitle>
            <CardDescription>
              {baseline.browser} · {baseline.device}
              {latest?.accuracy != null ? ` · ${latest.accuracy.toFixed(1)}% match` : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="diff">
              <TabsList>
                <TabsTrigger value="diff">Diff</TabsTrigger>
                <TabsTrigger value="side">Side by side</TabsTrigger>
              </TabsList>
              <TabsContent value="diff" className="pt-4">
                {latest?.diff ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={latest.diff}
                    alt="Diff"
                    className="w-full rounded-lg ring-1 ring-foreground/10"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No diff yet (first run sets the baseline).
                  </p>
                )}
              </TabsContent>
              <TabsContent value="side" className="grid gap-4 pt-4 md:grid-cols-2">
                <figure className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Baseline</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={baseline.image}
                    alt="Baseline"
                    className="w-full rounded-lg ring-1 ring-foreground/10"
                  />
                </figure>
                <figure className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Latest</p>
                  {latest?.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={latest.image}
                      alt="Latest"
                      className="w-full rounded-lg ring-1 ring-foreground/10"
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">No later run yet.</p>
                  )}
                </figure>
              </TabsContent>
            </Tabs>
            {latest ? (
              <div className="mt-3">
                <Badge variant="outline" asChild>
                  <Link href={`/runs/${latest.runId}`}>Open report</Link>
                </Badge>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
