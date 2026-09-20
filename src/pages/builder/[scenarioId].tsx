import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { ScenarioComposer } from "@/components/studio/scenario-composer";
import { firstQuery } from "@/lib/query";
import type { Scenario } from "@/lib/studio-types";

export default function ComposerPage() {
  const router = useRouter();
  const scenarioId = firstQuery(router.query.scenarioId);
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!router.isReady || !scenarioId) return;
    fetch(`/api/scenarios/${scenarioId}`)
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Not found");
        setScenario(payload.scenario);
      })
      .catch((err: Error) => setError(err.message));
  }, [router.isReady, scenarioId]);

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
