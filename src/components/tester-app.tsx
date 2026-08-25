"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  FlaskConical,
  Loader2,
  ScanSearch,
} from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CompareResponse } from "@/lib/types";

const DEFAULT_TARGET = "compare-target";

function originFromWindow() {
  if (typeof window === "undefined") return "";
  return window.location.origin;
}

export function TesterApp() {
  const [webpageUrl, setWebpageUrl] = useState("");
  const [targetId, setTargetId] = useState(DEFAULT_TARGET);
  const [figmaUrl, setFigmaUrl] = useState("");
  const [settleMs, setSettleMs] = useState("10000");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CompareResponse | null>(null);

  const demoReady = useMemo(() => originFromWindow(), []);

  function fillDemo() {
    const origin = originFromWindow();
    setWebpageUrl(`${origin}/demo/webpage`);
    setTargetId(DEFAULT_TARGET);
    setFigmaUrl(`${origin}/demo/figma`);
    setError(null);
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          webpageUrl,
          targetId,
          figmaUrl,
          settleMs: Number(settleMs) || 0,
        }),
      });
      const payload = (await response.json()) as CompareResponse & {
        error?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error || "Compare request failed.");
      }
      setResult(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Compare request failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-6 py-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ScanSearch className="size-5" />
            <p className="text-sm font-medium tracking-wide uppercase">
              Visual-Testing-Automation
            </p>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Compare a live section to its design
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Playwright captures the targeted div, dummy Figma copy is
            detected and masked, then pixels are compared. Ad-hoc compares
            stay in this screen; scenario runs appear under Reports.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href="/demo/webpage">Demo webpage</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="https://www.figma.com/design/LFFc9W0ZIAYKzVgmvHp8Tr/VTA-APP?node-id=4-2&t=Pt1aG0ZRa48LgmlW-4" target="_blank">Demo Figma</Link>
          </Button>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(18rem,22rem)_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Run a comparison</CardTitle>
            <CardDescription>
              Point at a live URL, the section id, and a Figma node link or a
              design page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-4" onSubmit={onSubmit}>
              <div className="space-y-2">
                <Label htmlFor="webpageUrl">Webpage URL</Label>
                <Input
                  id="webpageUrl"
                  required
                  placeholder="https://example.com/dashboard"
                  value={webpageUrl}
                  onChange={(event) => setWebpageUrl(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="targetId">Targeted ID / selector</Label>
                <Input
                  id="targetId"
                  required
                  placeholder="compare-target"
                  value={targetId}
                  onChange={(event) => setTargetId(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="figmaUrl">Figma URL section</Label>
                <Input
                  id="figmaUrl"
                  required
                  placeholder="https://www.figma.com/design/...&node-id=1-2"
                  value={figmaUrl}
                  onChange={(event) => setFigmaUrl(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="settleMs">Extra settle after animations (ms)</Label>
                <Input
                  id="settleMs"
                  type="number"
                  min={0}
                  max={30000}
                  step={500}
                  placeholder="10000"
                  value={settleMs}
                  onChange={(event) => setSettleMs(event.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Capture always waits for CSS/Web Animations to finish. Use this
                  extra delay for GSAP/canvas animations.
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={fillDemo}
              >
                <FlaskConical data-icon="inline-start" />
                Use local demo
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <Loader2 className="animate-spin" data-icon="inline-start" />
                ) : null}
                {loading ? "Capturing…" : "Run visual test"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="flex min-w-0 flex-col gap-4">
          {error ? (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertTitle>Could not finish the run</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          {!result && !error && !loading ? (
            <Card className="flex-1">
              <CardHeader>
                <CardTitle>No results yet</CardTitle>
                <CardDescription>
                  Load the demo pages, then run a test. Dummy names, lorem
                  copy, and mismatched live data are whitelisted so layout
                  accuracy can still approach 100%.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : null}

          {loading ? (
            <Card>
              <CardHeader>
                <CardTitle>Playwright is capturing both surfaces</CardTitle>
                <CardDescription>
                  Screenshots, dummy-text detection, then pixelmatch.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Progress value={66} />
              </CardContent>
            </Card>
          ) : null}

          {result ? <Results result={result} /> : null}
        </div>
      </div>
    </div>
  );
}

function Results({ result }: { result: CompareResponse }) {
  const lift = result.accuracyWhitelisted - result.accuracyRaw;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <ScoreCard
          label="Raw pixel match"
          value={result.accuracyRaw}
          hint={`${result.diffPixelsRaw.toLocaleString()} differing pixels`}
        />
        <ScoreCard
          label="After dummy whitelist"
          value={result.accuracyWhitelisted}
          hint={`${result.diffPixelsWhitelisted.toLocaleString()} remaining`}
          emphasize
        />
        <Card size="sm">
          <CardHeader>
            <CardDescription>Whitelist lift</CardDescription>
            <CardTitle className="text-2xl">+{lift.toFixed(1)} pts</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline">
              {result.source === "figma-api" ? "Figma API" : "Design page"}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {result.warnings.map((warning) => (
        <Alert key={warning}>
          <AlertCircle />
          <AlertTitle>Note</AlertTitle>
          <AlertDescription>{warning}</AlertDescription>
        </Alert>
      ))}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4" />
            <CardTitle>Whitelisted dummy / live data</CardTitle>
          </div>
          <CardDescription>
            These text regions were masked on both screenshots before the
            accuracy score.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-56">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Design text</TableHead>
                  <TableHead>Live text</TableHead>
                  <TableHead>Why</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.whitelist.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-muted-foreground">
                      No dummy or mismatched text was detected.
                    </TableCell>
                  </TableRow>
                ) : (
                  result.whitelist.map((item, index) => (
                    <TableRow key={`${item.designText}-${index}`}>
                      <TableCell className="max-w-56 truncate">
                        {item.designText}
                      </TableCell>
                      <TableCell className="max-w-56 truncate">
                        {item.liveText ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {item.reason === "dummy-pattern"
                            ? "Dummy pattern"
                            : "Content mismatch"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Visual diff</CardTitle>
          <CardDescription>
            Red pixels are mismatches. The whitelisted tab is the score that
            ignores dummy versus real copy.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="whitelisted">
            <TabsList>
              <TabsTrigger value="whitelisted">Whitelisted</TabsTrigger>
              <TabsTrigger value="raw">Raw</TabsTrigger>
              <TabsTrigger value="sources">Sources</TabsTrigger>
            </TabsList>
            <TabsContent value="whitelisted" className="pt-4">
              <DiffImage src={result.diffImageWhitelisted} alt="Whitelisted diff" />
            </TabsContent>
            <TabsContent value="raw" className="pt-4">
              <DiffImage src={result.diffImageRaw} alt="Raw diff" />
            </TabsContent>
            <TabsContent value="sources" className="pt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <figure className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Webpage
                  </p>
                  <DiffImage src={result.webpageImage} alt="Webpage capture" />
                </figure>
                <figure className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Design
                  </p>
                  <DiffImage src={result.designImage} alt="Design capture" />
                </figure>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      <Separator />
    </div>
  );
}

function ScoreCard({
  label,
  value,
  hint,
  emphasize = false,
}: {
  label: string;
  value: number;
  hint: string;
  emphasize?: boolean;
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl">{value.toFixed(1)}%</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Progress value={value} />
        <p className={emphasize ? "text-xs font-medium" : "text-xs text-muted-foreground"}>
          {hint}
        </p>
      </CardContent>
    </Card>
  );
}

function DiffImage({ src, alt }: { src: string; alt: string }) {
  return (
    // Captures are data URLs generated for this session only.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className="w-full rounded-lg ring-1 ring-foreground/10"
    />
  );
}
