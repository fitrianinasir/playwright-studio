import { createStore } from "zustand/vanilla";
import {
  normalizeDevice,
  type Baseline,
  type BrowserName,
  type DevicePreset,
  type TestRun,
} from "@/lib/studio-types";

type StudioState = {
  runs: TestRun[];
  baselines: Baseline[];
};

type StudioActions = {
  listRuns: () => TestRun[];
  getRun: (id: string) => TestRun | undefined;
  addRun: (run: TestRun) => TestRun;
  updateRun: (id: string, patch: Partial<TestRun>) => TestRun | null;
  listBaselines: () => Baseline[];
  findBaseline: (input: {
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
  clearRegressionHistory: () => {
    clearedRuns: number;
    clearedBaselines: number;
  };
};

export type StudioStore = StudioState & StudioActions;

function nowIso() {
  return new Date().toISOString();
}

function createStudioStore() {
  return createStore<StudioStore>((set, get) => ({
    runs: [],
    baselines: [],

    listRuns() {
      return [...get().runs].sort((a, b) =>
        b.startedAt.localeCompare(a.startedAt),
      );
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

    listBaselines() {
      return get().baselines;
    },

    findBaseline(input) {
      return get().baselines.find(
        (baseline) =>
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
      const exists = get().baselines.some(
        (baseline) => baseline.id === baselineId,
      );
      if (!exists) return false;
      set((state) => ({
        baselines: state.baselines.filter(
          (baseline) => baseline.id !== baselineId,
        ),
      }));
      return true;
    },

    clearRegressionHistory() {
      const state = get();
      const clearedRuns = state.runs.length;
      const clearedBaselines = state.baselines.length;
      set({ runs: [], baselines: [] });
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
  return {
    runs: state.runs.map((run) => ({
      ...run,
      device: normalizeDevice(run.device),
    })),
    baselines: state.baselines.map((baseline) => ({
      ...baseline,
      device: normalizeDevice(baseline.device),
    })),
  };
}

function getOrCreateStudioStore() {
  const existing = globalForStore.__vtaZustandStore;
  if (existing) {
    const next = createStudioStore();
    next.setState(snapshotState(existing));
    globalForStore.__vtaZustandStore = next;
    return next;
  }
  globalForStore.__vtaZustandStore = createStudioStore();
  return globalForStore.__vtaZustandStore;
}

export const studioStore = getOrCreateStudioStore();

export function listRuns() {
  return studioStore.getState().listRuns();
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

export function listBaselines() {
  return studioStore.getState().listBaselines();
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

export function clearRegressionHistory() {
  return studioStore.getState().clearRegressionHistory();
}
