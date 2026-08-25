"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PROJECT_ID } from "@/lib/project";
import type { TestRun } from "@/lib/studio-types";

export default function RunsPage() {
  const [runs, setRuns] = useState<TestRun[]>([]);

  useEffect(() => {
    fetch(`/api/projects/${PROJECT_ID}/runs`)
      .then((response) => response.json())
      .then((payload) => setRuns(payload.runs ?? []));
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Reports</h2>
        <p className="text-sm text-muted-foreground">
          Pass/fail history. Open a run for diffs, logs, and HTML export.
        </p>
      </div>
      {runs.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No reports yet</CardTitle>
            <CardDescription>Run a scenario from the composer to create one.</CardDescription>
          </CardHeader>
        </Card>
      ) : null}
      {runs.map((run) => (
        <Link key={run.id} href={`/runs/${run.id}`}>
          <Card className="hover:bg-muted/40">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">{run.id}</CardTitle>
                <Badge variant={run.status === "passed" ? "secondary" : "destructive"}>
                  {run.status}
                </Badge>
              </div>
              <CardDescription>
                {new Date(run.startedAt).toLocaleString()} · {run.browsers.join(", ")} ·{" "}
                {run.device}
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      ))}
    </div>
  );
}
