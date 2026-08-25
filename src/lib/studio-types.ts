export type BrowserName = "chromium" | "firefox" | "webkit";
export type DevicePreset = "desktop" | "iphone-14" | "pixel-7";
export type ActionKind =
  | "navigate"
  | "login"
  | "fill"
  | "click"
  | "hover"
  | "selectOption"
  | "wait"
  | "assertText"
  | "assertVisible"
  | "screenshot"
  | "visualCompare";

export type Project = {
  id: string;
  name: string;
  description: string;
  createdAt: string;
};

export type ScenarioStep = {
  id: string;
  kind: ActionKind;
  name: string;
  params: Record<string, string>;
};

export type Scenario = {
  id: string;
  projectId: string;
  name: string;
  description: string;
  steps: ScenarioStep[];
  browsers: BrowserName[];
  device: DevicePreset;
  updatedAt: string;
};

export type StepStatus = "passed" | "failed" | "skipped";
export type RunStatus = "running" | "passed" | "failed";

export type StepResult = {
  stepId: string;
  name: string;
  kind: ActionKind;
  status: StepStatus;
  durationMs: number;
  log: string;
  screenshot?: string;
  baseline?: string;
  diff?: string;
  accuracy?: number;
  error?: string;
};

export type BrowserRunResult = {
  browser: BrowserName;
  status: "passed" | "failed";
  steps: StepResult[];
};

export type TestRun = {
  id: string;
  projectId: string;
  scenarioId: string;
  status: RunStatus;
  startedAt: string;
  finishedAt: string | null;
  browsers: BrowserName[];
  device: DevicePreset;
  results: BrowserRunResult[];
  logs: string[];
};

export type Baseline = {
  id: string;
  projectId: string;
  scenarioId: string;
  snapshotName: string;
  browser: BrowserName;
  device: DevicePreset;
  image: string;
  updatedAt: string;
};

export type ActionField = {
  key: string;
  label: string;
  placeholder?: string;
  type?: "text" | "textarea";
};

export type ActionCatalogItem = {
  kind: ActionKind;
  label: string;
  description: string;
  fields: ActionField[];
};
