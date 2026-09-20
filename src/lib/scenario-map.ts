import { normalizeDevice } from "@/lib/studio-types";
import type {
  ActionKind,
  BrowserName,
  Scenario,
  ScenarioStep,
} from "@/lib/studio-types";

type DbStep = {
  id: string;
  kind: string;
  name: string;
  params: unknown;
};

type DbScenario = {
  id: string;
  user_id: string;
  name: string;
  description: string;
  browsers: string[];
  device: string;
  updatedAt: Date | string;
  steps?: DbStep[];
};

function toStep(step: DbStep): ScenarioStep {
  const params =
    step.params && typeof step.params === "object" && !Array.isArray(step.params)
      ? (step.params as Record<string, string>)
      : {};
  return {
    id: step.id,
    kind: step.kind as ActionKind,
    name: step.name,
    params,
  };
}

export function toStudioScenario(row: DbScenario): Scenario {
  const updatedAt =
    row.updatedAt instanceof Date
      ? row.updatedAt.toISOString()
      : String(row.updatedAt);
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    description: row.description,
    steps: (row.steps ?? []).map(toStep),
    browsers: (row.browsers.length ? row.browsers : ["chromium"]) as BrowserName[],
    device: normalizeDevice(row.device),
    updatedAt,
  };
}
