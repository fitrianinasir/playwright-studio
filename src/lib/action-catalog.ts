import type { ActionCatalogItem, ActionKind, ScenarioStep } from "@/lib/studio-types";

export const ACTION_CATALOG: ActionCatalogItem[] = [
  {
    kind: "navigate",
    label: "Navigate",
    description: "Open a URL or app path",
    fields: [{ key: "url", label: "URL", placeholder: "https://your-app.example/login" }],
  },
  {
    kind: "login",
    label: "Login",
    description: "Fill Corporate_id, user_id, and keybca, then submit. After a wait, clicks the second popup button if a session confirm appears.",
    fields: [
      {
        key: "corporateIdSelector",
        label: "Corporate_id selector",
        placeholder: '[name="Corporate_id"]',
      },
      { key: "corporateId", label: "Corporate_id", placeholder: "ACME01" },
      {
        key: "userIdSelector",
        label: "user_id selector",
        placeholder: '[name="user_id"]',
      },
      { key: "userId", label: "user_id", placeholder: "designer" },
      {
        key: "keybcaSelector",
        label: "keybca selector",
        placeholder: '[name="keybca"]',
      },
      { key: "keybca", label: "keybca", placeholder: "123456" },
      { key: "submitSelector", label: "Submit selector", placeholder: "button[type=submit]" },
      {
        key: "popupWaitMs",
        label: "Wait after submit / confirm (ms)",
        placeholder: "5000",
      },
    ],
  },
  {
    kind: "fill",
    label: "Fill",
    description: "Type into an input",
    fields: [
      { key: "selector", label: "Selector", placeholder: "#search" },
      { key: "value", label: "Value", placeholder: "Q3 forecast" },
    ],
  },
  {
    kind: "click",
    label: "Click",
    description: "Click a control",
    fields: [{ key: "selector", label: "Selector", placeholder: "#primary-cta" }],
  },
  {
    kind: "hover",
    label: "Hover",
    description: "Hover a target",
    fields: [{ key: "selector", label: "Selector", placeholder: "[data-testid=menu]" }],
  },
  {
    kind: "selectOption",
    label: "Select option",
    description: "Choose a select value",
    fields: [
      { key: "selector", label: "Selector", placeholder: "#region" },
      { key: "value", label: "Value", placeholder: "apac" },
    ],
  },
  {
    kind: "wait",
    label: "Wait",
    description: "Pause or wait for a selector",
    fields: [
      { key: "mode", label: "Mode (timeout or selector)", placeholder: "timeout" },
      { key: "value", label: "Ms or selector", placeholder: "500" },
    ],
  },
  {
    kind: "assertText",
    label: "Assert text",
    description: "Expect text inside a target",
    fields: [
      { key: "selector", label: "Selector", placeholder: "#welcome-title" },
      { key: "text", label: "Expected text", placeholder: "Welcome back" },
    ],
  },
  {
    kind: "assertVisible",
    label: "Assert visible",
    description: "Expect an element to be visible",
    fields: [{ key: "selector", label: "Selector", placeholder: "#welcome-panel" }],
  },
  {
    kind: "screenshot",
    label: "Screenshot",
    description: "Capture a baseline-compared snapshot",
    fields: [
      { key: "name", label: "Snapshot name", placeholder: "home-welcome" },
      { key: "selector", label: "Selector (optional)", placeholder: "#welcome-panel" },
    ],
  },
  {
    kind: "visualCompare",
    label: "Figma visual compare",
    description: "Compare a section to a Figma/design URL",
    fields: [
      { key: "webpageUrl", label: "Webpage URL (blank = current page)", placeholder: "https://your-app.example/home" },
      { key: "targetId", label: "Target ID", placeholder: "compare-target" },
      { key: "figmaUrl", label: "Figma / design URL", placeholder: "https://www.figma.com/design/..." },
      { key: "settleMs", label: "Wait after load (ms)", placeholder: "3000" },
    ],
  },
];

export function catalogItem(kind: ActionKind) {
  return ACTION_CATALOG.find((item) => item.kind === kind)!;
}

export function defaultStep(kind: ActionKind): ScenarioStep {
  const item = catalogItem(kind);
  const params: Record<string, string> = {};
  for (const field of item.fields) params[field.key] = "";
  if (kind === "wait") {
    params.mode = "timeout";
    params.value = "300";
  }
  if (kind === "login") {
    params.popupWaitMs = "5000";
  }
  return {
    id: crypto.randomUUID(),
    kind,
    name: item.label,
    params,
  };
}
