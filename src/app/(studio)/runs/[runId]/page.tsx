"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Scenario, TestRun } from "@/lib/studio-types";

export default function ReportPage() {
  const { runId } = useParams<{ runId: string }>();
  const [run, setRun] = useState<TestRun | null>(null);
  const [scenario, setScenario] = useState<Scenario | null>(null);

  useEffect(() => {
    fetch(`/api/runs/${runId}`)
      .then((response) => response.json())
      .then((payload) => {
        setRun(payload.run ?? null);
        setScenario(payload.scenario ?? null);
      });
  }, [runId]);

  async function promote(browser: string, snapshotName: string, image?: string) {
    const response = await fetch(`/api/runs/${runId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ browser, snapshotName, image }),
    });
    const payload = await response.json();
    if (!response.ok) {
      toast.error(payload.error || "Could not update baseline");
      return;
    }
    toast.success("Baseline updated from this run");
  }

  if (!run) {
    return <p className="px-6 py-8 text-sm text-muted-foreground">Loading report…</p>;
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-semibold tracking-tight">
              {scenario?.name ?? "Run"}
            </h2>
            <Badge variant={run.status === "passed" ? "secondary" : "destructive"}>
              {run.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {run.id} · {run.browsers.join(", ")} · {run.device}
          </p>
        </div>
        <Button asChild>
          <a href={`/api/runs/${run.id}/export`}>Export HTML report</a>
        </Button>
      </div>

      {run.results.map((result) => (
        <Card key={result.browser}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle className="capitalize">{result.browser}</CardTitle>
              <Badge variant={result.status === "passed" ? "outline" : "destructive"}>
                {result.status}
              </Badge>
            </div>
            <CardDescription>Step log and screenshot diffs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Step</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Log</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.steps.map((step) => (
                  <TableRow key={`${result.browser}-${step.stepId}`}>
                    <TableCell>{step.name}</TableCell>
                    <TableCell>{step.status}</TableCell>
                    <TableCell>{step.durationMs}ms</TableCell>
                    <TableCell className="max-w-md text-xs">
                      {step.log}
                      {step.error ? (
                        <span className="mt-1 block text-destructive">{step.error}</span>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {result.steps
              .filter((step) => step.screenshot || step.diff)
              .map((step) => (
                <div key={`${result.browser}-img-${step.stepId}`} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">
                      {step.name}
                      {step.accuracy != null ? ` · ${step.accuracy.toFixed(1)}%` : ""}
                    </p>
                    {step.screenshot ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          promote(result.browser, step.name, step.screenshot)
                        }
                      >
                        Set as baseline
                      </Button>
                    ) : null}
                  </div>
                  <Tabs defaultValue={step.diff ? "diff" : "latest"}>
                    <TabsList>
                      {step.diff ? <TabsTrigger value="diff">Diff</TabsTrigger> : null}
                      <TabsTrigger value="latest">Latest</TabsTrigger>
                      {step.baseline ? (
                        <TabsTrigger value="baseline">Baseline / design</TabsTrigger>
                      ) : null}
                    </TabsList>
                    {step.diff ? (
                      <TabsContent value="diff" className="pt-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={step.diff}
                          alt="Diff"
                          className="w-full rounded-lg ring-1 ring-foreground/10"
                        />
                      </TabsContent>
                    ) : null}
                    {step.screenshot ? (
                      <TabsContent value="latest" className="pt-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={step.screenshot}
                          alt="Latest"
                          className="w-full rounded-lg ring-1 ring-foreground/10"
                        />
                      </TabsContent>
                    ) : null}
                    {step.baseline ? (
                      <TabsContent value="baseline" className="pt-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={step.baseline}
                          alt="Baseline"
                          className="w-full rounded-lg ring-1 ring-foreground/10"
                        />
                      </TabsContent>
                    ) : null}
                  </Tabs>
                </div>
              ))}
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader>
          <CardTitle>Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-48 rounded-lg bg-muted p-3">
            <pre className="text-xs whitespace-pre-wrap">
              {run.logs.join("\n") || "No runner logs."}
            </pre>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
