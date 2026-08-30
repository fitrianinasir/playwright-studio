export type BrowserName = "chromium" | "firefox" | "webkit";

export const DEVICE_PRESETS = [
  { id: "1920x900", width: 1920, height: 900, label: "1920 × 900" },
  { id: "1440x900", width: 1440, height: 900, label: "1440 × 900" },
  { id: "1048x900", width: 1048, height: 900, label: "1048 × 900" },
  { id: "848x900", width: 848, height: 900, label: "848 × 900" },
  { id: "748x900", width: 748, height: 900, label: "748 × 900" },
  { id: "576x900", width: 576, height: 900, label: "576 × 900" },
  { id: "360x900", width: 360, height: 900, label: "360 × 900" },
] as const;

export type DevicePreset = (typeof DEVICE_PRESETS)[number]["id"];

export function isDevicePreset(value: string): value is DevicePreset {
  return DEVICE_PRESETS.some((preset) => preset.id === value);
}

export function normalizeDevice(value: string | undefined): DevicePreset {
  if (value && isDevicePreset(value)) return value;
  if (value === "iphone-14" || value === "pixel-7") return "360x900";
  return "1920x900";
}
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
