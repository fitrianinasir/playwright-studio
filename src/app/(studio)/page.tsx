"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { PROJECT_ID } from "@/lib/project";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Scenario } from "@/lib/studio-types";

export default function HomePage() {
  const router = useRouter();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    fetch(`/api/projects/${PROJECT_ID}/scenarios`)
      .then((response) => response.json())
      .then((payload) => setScenarios(payload.scenarios ?? []));
  }, []);

  async function create() {
    const response = await fetch(`/api/projects/${PROJECT_ID}/scenarios`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description }),
    });
    const payload = await response.json();
    if (!response.ok) {
      toast.error(payload.error || "Could not create scenario");
      return;
    }
    router.push(`/builder/${payload.scenario.id}`);
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Scenarios</h1>
          <p className="text-sm text-muted-foreground">
            Build no-code e2e and Figma visual tests. Runs stay in memory until the
            server restarts.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus data-icon="inline-start" />
              New scenario
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New scenario</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={name} onChange={(event) => setName(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
              </div>
              <Button onClick={create}>Create and open composer</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid gap-4">
        {scenarios.map((scenario) => (
          <Card key={scenario.id}>
            <CardHeader>
              <CardTitle>{scenario.name}</CardTitle>
              <CardDescription>{scenario.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>{scenario.steps.length} steps</span>
              <span>· {scenario.browsers.join(", ")}</span>
              <span>· {scenario.device}</span>
              <Button className="ml-auto" asChild>
                <Link href={`/builder/${scenario.id}`}>Edit in composer</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
