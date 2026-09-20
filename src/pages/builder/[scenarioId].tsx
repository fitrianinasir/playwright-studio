import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { ScenarioComposer } from "@/components/studio/scenario-composer";
import { firstQuery } from "@/lib/query";
import type { Scenario } from "@/lib/studio-types";
import axios from "axios";
export default function ComposerPage() {
  const router = useRouter();
  const scenarioId = firstQuery(router.query.scenarioId);
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!router.isReady || !scenarioId) return;

    const getScenarioById = async () => {
      await axios
        .get(`/api/scenarios/${scenarioId}`)
        .then((res) => setScenario(res.data.scenario))
        .catch((err) => setError(err.message));
    };

    getScenarioById()
  }, [router.isReady, scenarioId]);

  if (error) {
    return <p className="px-6 py-8 text-sm text-destructive">{error}</p>;
  }
  if (!scenario) {
    return (
      <p className="px-6 py-8 text-sm text-muted-foreground">
        Loading composer…
      </p>
    );
  }

  return (
    <div className="px-6 py-6">
      <ScenarioComposer scenario={scenario} canEdit />
    </div>
  );
}
