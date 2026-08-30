import { createStore } from "zustand/vanilla";
import { PROJECT_ID } from "@/lib/project";
import type {
  Baseline,
  BrowserName,
  DevicePreset,
  Project,
  Scenario,
  ScenarioStep,
  TestRun,
} from "@/lib/studio-types";

type StudioState = {
  projects: Project[];
  scenarios: Scenario[];
  runs: TestRun[];
  baselines: Baseline[];
};

type StudioActions = {
  getProject: (id: string) => Project | undefined;
  listScenarios: (projectId: string) => Scenario[];
  getScenario: (id: string) => Scenario | undefined;
  createScenario: (input: {
    projectId: string;
    name: string;
    description: string;
    steps?: ScenarioStep[];
    browsers?: BrowserName[];
    device?: DevicePreset;
  }) => Scenario;
  updateScenario: (id: string, patch: Partial<Scenario>) => Scenario | null;
  deleteScenario: (id: string) => void;
  listRuns: (projectId: string) => TestRun[];
  getRun: (id: string) => TestRun | undefined;
  addRun: (run: TestRun) => TestRun;
  updateRun: (id: string, patch: Partial<TestRun>) => TestRun | null;
  listBaselines: (projectId: string) => Baseline[];
  findBaseline: (input: {
    projectId: string;
    scenarioId: string;
    snapshotName: string;
    browser: BrowserName;
    device: DevicePreset;
  }) => Baseline | undefined;
  saveBaseline: (
    input: Omit<Baseline, "id" | "updatedAt"> & { id?: string },
  ) => Baseline;
  clearBaselinesForScenario: (scenarioId: string) => number;
  deleteBaseline: (baselineId: string) => boolean;
  clearRegressionHistory: (projectId: string) => {
    clearedRuns: number;
    clearedBaselines: number;
  };
};

export type StudioStore = StudioState & StudioActions;

function nowIso() {
  return new Date().toISOString();
}

function seedStepsLogin(): ScenarioStep[] {
  return [
    {
      id: "step_nav_login",
      kind: "navigate",
      name: "Open login",
      params: { url: "" },
    },
    {
      id: "step_login",
      kind: "login",
      name: "Sign in with corporate credentials",
      params: {
        corporateIdSelector: '[name="Corporate_id"]',
        userIdSelector: '[name="user_id"]',
        keybcaSelector: '[name="keybca"]',
        submitSelector: "button[type=submit]",
        popupWaitMs: "5000",
        corporateId: "",
        userId: "",
        keybca: "",
      },
    },
    {
      id: "step_assert_welcome",
      kind: "assertText",
      name: "See welcome title",
      params: { selector: "#welcome-title", text: "" },
    },
    {
      id: "step_shot",
      kind: "screenshot",
      name: "Capture welcome panel",
      params: { name: "home-welcome", selector: "#welcome-panel" },
    },
  ];
}

function seedStepsVisual(): ScenarioStep[] {
  return [
    {
      id: "step_visual_hero",
      kind: "visualCompare",
      name: "Hero vs Figma",
      params: {
        webpageUrl: "",
        targetId: "",
        figmaUrl: "",
      },
    },
  ];
}

function createSeed(): StudioState {
  const project: Project = {
    id: PROJECT_ID,
    name: "Target app",
    description: "No-code e2e and Figma visual tests against your live site.",
    createdAt: nowIso(),
  };

  return {
    projects: [project],
    scenarios: [
      {
        id: "scn_login",
        projectId: project.id,
        name: "Login → home snapshot",
        description: "Chain login, assert, and a visual regression screenshot. Set the Navigate URL to your live login page.",
        steps: seedStepsLogin(),
        browsers: ["chromium"],
        device: "desktop",
        updatedAt: nowIso(),
      },
      {
        id: "scn_hero",
        projectId: project.id,
        name: "Hero vs Figma design",
        description: "Visual compare a live page section against a Figma or design URL.",
        steps: seedStepsVisual(),
        browsers: ["chromium"],
        device: "desktop",
        updatedAt: nowIso(),
      },
    ],
    runs: [],
    baselines: [],
  };
}

function createStudioStore() {
  return createStore<StudioStore>((set, get) => ({
    ...createSeed(),

    getProject(id) {
      return get().projects.find((project) => project.id === id);
    },

    listScenarios(projectId) {
      return get().scenarios.filter((scenario) => scenario.projectId === projectId);
    },

    getScenario(id) {
      return get().scenarios.find((scenario) => scenario.id === id);
    },

    createScenario(input) {
      const scenario: Scenario = {
        id: `scn_${crypto.randomUUID().slice(0, 8)}`,
        projectId: input.projectId,
        name: input.name,
        description: input.description,
        steps: input.steps ?? [],
        browsers: input.browsers ?? ["chromium"],
        device: input.device ?? "desktop",
        updatedAt: nowIso(),
      };
      set((state) => ({ scenarios: [...state.scenarios, scenario] }));
      return scenario;
    },

    updateScenario(id, patch) {
      const existing = get().getScenario(id);
      if (!existing) return null;
      const updated: Scenario = {
        ...existing,
        ...patch,
        id: existing.id,
        projectId: existing.projectId,
        updatedAt: nowIso(),
      };
      set((state) => ({
        scenarios: state.scenarios.map((scenario) =>
          scenario.id === id ? updated : scenario,
        ),
      }));
      return updated;
    },

    deleteScenario(id) {
      set((state) => ({
        scenarios: state.scenarios.filter((scenario) => scenario.id !== id),
        baselines: state.baselines.filter((baseline) => baseline.scenarioId !== id),
      }));
    },

    listRuns(projectId) {
      return get()
        .runs.filter((run) => run.projectId === projectId)
        .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
    },

    getRun(id) {
      return get().runs.find((run) => run.id === id);
    },

    addRun(run) {
      set((state) => ({ runs: [run, ...state.runs] }));
      return run;
    },

    updateRun(id, patch) {
      const existing = get().getRun(id);
      if (!existing) return null;
      const updated: TestRun = { ...existing, ...patch, id: existing.id };
      set((state) => ({
        runs: state.runs.map((run) => (run.id === id ? updated : run)),
      }));
      return updated;
    },

    listBaselines(projectId) {
      return get().baselines.filter((baseline) => baseline.projectId === projectId);
    },

    findBaseline(input) {
      return get().baselines.find(
        (baseline) =>
          baseline.projectId === input.projectId &&
          baseline.scenarioId === input.scenarioId &&
          baseline.snapshotName === input.snapshotName &&
          baseline.browser === input.browser &&
          baseline.device === input.device,
      );
    },

    saveBaseline(input) {
      const existing = get().findBaseline(input);
      if (existing) {
        const updated: Baseline = {
          ...existing,
          image: input.image,
          updatedAt: nowIso(),
        };
        set((state) => ({
          baselines: state.baselines.map((baseline) =>
            baseline.id === existing.id ? updated : baseline,
          ),
        }));
        return updated;
      }
      const baseline: Baseline = {
        id: `bl_${crypto.randomUUID().slice(0, 8)}`,
        projectId: input.projectId,
        scenarioId: input.scenarioId,
        snapshotName: input.snapshotName,
        browser: input.browser,
        device: input.device,
        image: input.image,
        updatedAt: nowIso(),
      };
      set((state) => ({ baselines: [...state.baselines, baseline] }));
      return baseline;
    },

    clearBaselinesForScenario(scenarioId) {
      const before = get().baselines.length;
      set((state) => ({
        baselines: state.baselines.filter(
          (baseline) => baseline.scenarioId !== scenarioId,
        ),
      }));
      return before - get().baselines.length;
    },

    deleteBaseline(baselineId) {
      const exists = get().baselines.some((baseline) => baseline.id === baselineId);
      if (!exists) return false;
      set((state) => ({
        baselines: state.baselines.filter((baseline) => baseline.id !== baselineId),
      }));
      return true;
    },

    clearRegressionHistory(projectId) {
      const state = get();
      const clearedRuns = state.runs.filter((run) => run.projectId === projectId).length;
      const clearedBaselines = state.baselines.filter(
        (baseline) => baseline.projectId === projectId,
      ).length;
      set({
        runs: state.runs.filter((run) => run.projectId !== projectId),
        baselines: state.baselines.filter(
          (baseline) => baseline.projectId !== projectId,
        ),
      });
      return { clearedRuns, clearedBaselines };
    },
  }));
}

type StudioZustandStore = ReturnType<typeof createStudioStore>;

const globalForStore = globalThis as typeof globalThis & {
  __vtaZustandStore?: StudioZustandStore;
};

function snapshotState(store: StudioZustandStore): StudioState {
  const state = store.getState();
  return stripDemoUrls(
    migrateLoginSteps({
      projects: state.projects,
      scenarios: state.scenarios,
      runs: state.runs,
      baselines: state.baselines,
    }),
  );
}

function stripDemoUrls(state: StudioState): StudioState {
  const clearIfDemo = (value?: string) =>
    value?.includes("/demo/") ? "" : (value ?? "");

  return {
    ...state,
    scenarios: state.scenarios.map((scenario) => ({
      ...scenario,
      steps: scenario.steps.map((step) => {
        if (step.kind === "navigate") {
          return {
            ...step,
            params: { ...step.params, url: clearIfDemo(step.params.url) },
          };
        }
        if (step.kind === "visualCompare") {
          return {
            ...step,
            params: {
              ...step.params,
              webpageUrl: clearIfDemo(step.params.webpageUrl),
              figmaUrl: clearIfDemo(step.params.figmaUrl),
            },
          };
        }
        if (step.kind === "login") {
          const params = { ...step.params };
          if (params.corporateId === "ACME01") params.corporateId = "";
          if (params.userId === "designer") params.userId = "";
          if (params.keybca === "123456") params.keybca = "";
          return { ...step, params };
        }
        if (step.kind === "assertText" && step.params.text === "Welcome back") {
          return { ...step, params: { ...step.params, text: "" } };
        }
        return step;
      }),
    })),
  };
}

function migrateLoginSteps(state: StudioState): StudioState {
  return {
    ...state,
    scenarios: state.scenarios.map((scenario) => ({
      ...scenario,
      steps: scenario.steps.map((step) => {
        if (step.kind !== "login") return step;
        const params = { ...step.params };
        if (!params.popupWaitMs?.trim()) params.popupWaitMs = "5000";
        if ("emailSelector" in params && !params.corporateIdSelector) {
          return {
            ...step,
            name:
              step.name === "Sign in as designer"
                ? "Sign in with corporate credentials"
                : step.name,
            params: {
              corporateIdSelector: '[name="Corporate_id"]',
              userIdSelector: '[name="user_id"]',
              keybcaSelector: '[name="keybca"]',
              submitSelector: params.submitSelector || "button[type=submit]",
              popupWaitMs: "5000",
              corporateId: params.corporateId || params.email || "",
              userId: params.userId || "",
              keybca: params.keybca || params.password || "",
            },
          };
        }
        return { ...step, params };
      }),
    })),
  };
}

function getOrCreateStudioStore() {
  const existing = globalForStore.__vtaZustandStore;
  // Always rebuild on module load so HMR picks up new actions, but keep data.
  if (existing) {
    const next = createStudioStore();
    next.setState(snapshotState(existing));
    globalForStore.__vtaZustandStore = next;
    return next;
  }
  globalForStore.__vtaZustandStore = createStudioStore();
  return globalForStore.__vtaZustandStore;
}

/** Vanilla Zustand store (API routes + runner). Survives Next.js HMR via globalThis. */
export const studioStore = getOrCreateStudioStore();

export function getProject(id: string) {
  return studioStore.getState().getProject(id);
}

export function listScenarios(projectId: string) {
  return studioStore.getState().listScenarios(projectId);
}

export function getScenario(id: string) {
  return studioStore.getState().getScenario(id);
}

export function createScenario(
  input: Parameters<StudioActions["createScenario"]>[0],
) {
  return studioStore.getState().createScenario(input);
}

export function updateScenario(id: string, patch: Partial<Scenario>) {
  return studioStore.getState().updateScenario(id, patch);
}

export function deleteScenario(id: string) {
  studioStore.getState().deleteScenario(id);
}

export function listRuns(projectId: string) {
  return studioStore.getState().listRuns(projectId);
}

export function getRun(id: string) {
  return studioStore.getState().getRun(id);
}

export function addRun(run: TestRun) {
  return studioStore.getState().addRun(run);
}

export function updateRun(id: string, patch: Partial<TestRun>) {
  return studioStore.getState().updateRun(id, patch);
}

export function listBaselines(projectId: string) {
  return studioStore.getState().listBaselines(projectId);
}

export function findBaseline(
  input: Parameters<StudioActions["findBaseline"]>[0],
) {
  return studioStore.getState().findBaseline(input);
}

export function saveBaseline(
  input: Parameters<StudioActions["saveBaseline"]>[0],
) {
  return studioStore.getState().saveBaseline(input);
}

export function clearBaselinesForScenario(scenarioId: string) {
  return studioStore.getState().clearBaselinesForScenario(scenarioId);
}

export function deleteBaseline(baselineId: string) {
  return studioStore.getState().deleteBaseline(baselineId);
}

export function clearRegressionHistory(projectId: string) {
  return studioStore.getState().clearRegressionHistory(projectId);
}
