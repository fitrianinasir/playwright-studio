"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ScenarioComposer } from "@/components/studio/scenario-composer";
import type { Scenario } from "@/lib/studio-types";

export default function ComposerPage() {
  const { scenarioId } = useParams<{ scenarioId: string }>();
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/scenarios/${scenarioId}`)
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Not found");
        setScenario(payload.scenario);
      })
      .catch((err: Error) => setError(err.message));
  }, [scenarioId]);

  if (error) {
    return <p className="px-6 py-8 text-sm text-destructive">{error}</p>;
  }
  if (!scenario) {
    return <p className="px-6 py-8 text-sm text-muted-foreground">Loading composer…</p>;
  }

  return (
    <div className="px-6 py-6">
      <ScenarioComposer scenario={scenario} canEdit />
    </div>
  );
}
