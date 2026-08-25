"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  closestCenter,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Eraser, GripVertical, Loader2, Play, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ACTION_CATALOG, catalogItem, defaultStep } from "@/lib/action-catalog";
import type {
  ActionKind,
  Baseline,
  BrowserName,
  DevicePreset,
  Scenario,
  ScenarioStep,
} from "@/lib/studio-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const BROWSERS: BrowserName[] = ["chromium", "firefox", "webkit"];

function PaletteItem({ kind }: { kind: ActionKind }) {
  const item = catalogItem(kind);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette:${kind}`,
    data: { from: "palette", kind },
  });
  return (
    <button
      ref={setNodeRef}
      type="button"
      className="flex w-full cursor-grab flex-col items-start rounded-lg border bg-card px-3 py-2 text-left hover:bg-muted"
      style={{ opacity: isDragging ? 0.4 : 1 }}
      {...listeners}
      {...attributes}
    >
      <span className="text-sm font-medium">{item.label}</span>
      <span className="text-xs text-muted-foreground">{item.description}</span>
    </button>
  );
}

function DropCanvas({ children }: { children: ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: "canvas" });
  return (
    <div
      ref={setNodeRef}
      className={`min-h-64 space-y-2 rounded-xl border border-dashed p-3 ${isOver ? "bg-muted/60" : ""}`}
    >
      {children}
    </div>
  );
}

function SortableStep({
  step,
  selected,
  onSelect,
}: {
  step: ScenarioStep;
  selected: boolean;
  onSelect: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: step.id,
  });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-2 rounded-lg border px-2 py-2 ${selected ? "bg-muted" : "bg-card"}`}
    >
      <button type="button" className="cursor-grab text-muted-foreground" {...listeners} {...attributes}>
        <GripVertical className="size-4" />
      </button>
      <button type="button" className="min-w-0 flex-1 text-left" onClick={onSelect}>
        <p className="truncate text-sm font-medium">{step.name}</p>
        <p className="truncate text-xs text-muted-foreground">{step.kind}</p>
      </button>
    </div>
  );
}

export function ScenarioComposer({
  scenario,
  canEdit,
}: {
  scenario: Scenario;
  canEdit: boolean;
}) {
  const [draft, setDraft] = useState(scenario);
  const [selectedId, setSelectedId] = useState(scenario.steps[0]?.id ?? "");
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [clearingBaselines, setClearingBaselines] = useState(false);
  const [baselines, setBaselines] = useState<Baseline[]>([]);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const selected = draft.steps.find((step) => step.id === selectedId) ?? null;

  useEffect(() => {
    setDraft(scenario);
    setSelectedId(scenario.steps[0]?.id ?? "");
  }, [scenario]);

  async function parseJson(response: Response) {
    const text = await response.text();
    if (!text) return {} as { error?: string; cleared?: number; baselines?: Baseline[] };
    try {
      return JSON.parse(text) as {
        error?: string;
        cleared?: number;
        baselines?: Baseline[];
      };
    } catch {
      throw new Error("Invalid response from server.");
    }
  }

  async function refreshBaselines() {
    try {
      const response = await fetch(`/api/scenarios/${draft.id}/baselines`);
      const payload = await parseJson(response);
      if (response.ok) setBaselines(payload.baselines ?? []);
    } catch {
      // Ignore — viewer just shows empty.
    }
  }

  useEffect(() => {
    void refreshBaselines();
  }, [draft.id]);

  const selectedFields = useMemo(
    () => (selected ? catalogItem(selected.kind).fields : []),
    [selected],
  );

  const screenshotBaselines = useMemo(() => {
    if (!selected || selected.kind !== "screenshot") return [];
    const snapshotName = selected.params.name?.trim() ?? "";
    if (!snapshotName) return [];
    return baselines.filter(
      (baseline) =>
        baseline.snapshotName === snapshotName &&
        draft.browsers.includes(baseline.browser),
    );
  }, [selected, baselines, draft.browsers]);

  function addKind(kind: ActionKind) {
    const step = defaultStep(kind);
    setDraft((current) => ({ ...current, steps: [...current.steps, step] }));
    setSelectedId(step.id);
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    if (activeId.startsWith("palette:")) {
      const kind = activeId.replace("palette:", "") as ActionKind;
      const step = defaultStep(kind);
      setDraft((current) => {
        const overIndex = current.steps.findIndex((item) => item.id === String(over.id));
        const steps = [...current.steps];
        if (overIndex >= 0) steps.splice(overIndex, 0, step);
        else steps.push(step);
        return { ...current, steps };
      });
      setSelectedId(step.id);
      return;
    }
    if (activeId !== String(over.id)) {
      setDraft((current) => {
        const oldIndex = current.steps.findIndex((step) => step.id === activeId);
        const newIndex = current.steps.findIndex((step) => step.id === String(over.id));
        if (oldIndex < 0 || newIndex < 0) return current;
        return { ...current, steps: arrayMove(current.steps, oldIndex, newIndex) };
      });
    }
  }

  function updateSelected(patch: Partial<ScenarioStep>) {
    if (!selected) return;
    setDraft((current) => ({
      ...current,
      steps: current.steps.map((step) =>
        step.id === selected.id ? { ...step, ...patch } : step,
      ),
    }));
  }

  function removeSelected() {
    if (!selected) return;
    setDraft((current) => {
      const steps = current.steps.filter((step) => step.id !== selected.id);
      setSelectedId(steps[0]?.id ?? "");
      return { ...current, steps };
    });
  }

  async function save() {
    setSaving(true);
    try {
      const response = await fetch(`/api/scenarios/${draft.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draft.name,
          description: draft.description,
          steps: draft.steps,
          browsers: draft.browsers,
          device: draft.device,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Save failed");
      setDraft(payload.scenario);
      toast.success("Scenario saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function clearBaselines() {
    setClearingBaselines(true);
    try {
      const response = await fetch(`/api/scenarios/${draft.id}/baselines`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear-all" }),
      });
      const payload = await parseJson(response);
      if (!response.ok) throw new Error(payload.error || "Could not clear baselines");
      toast.success(
        payload.cleared
          ? `Cleared ${payload.cleared} baseline${payload.cleared === 1 ? "" : "s"}`
          : "No baselines to clear",
      );
      setBaselines([]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not clear baselines");
    } finally {
      setClearingBaselines(false);
    }
  }

  async function clearOneBaseline(baselineId: string) {
    try {
      const response = await fetch(`/api/scenarios/${draft.id}/baselines`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete-one", baselineId }),
      });
      const payload = await parseJson(response);
      if (!response.ok) throw new Error(payload.error || "Could not clear baseline");
      setBaselines((current) => current.filter((baseline) => baseline.id !== baselineId));
      toast.success("Baseline cleared");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not clear baseline");
    }
  }

  async function run() {
    await save();
    setRunning(true);
    try {
      const response = await fetch(`/api/scenarios/${draft.id}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          browsers: draft.browsers,
          device: draft.device,
        }),
      });
      const payload = await response.json();
      if (!response.ok && !payload.run) throw new Error(payload.error || "Run failed");
      toast[payload.run?.status === "passed" ? "success" : "error"](
        `Run ${payload.run?.status ?? "failed"}`,
      );
      if (payload.run?.id) {
        window.location.href = `/runs/${payload.run.id}`;
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Run failed");
    } finally {
      setRunning(false);
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <div className="grid gap-4 xl:grid-cols-[16rem_minmax(0,1fr)_18rem]">
        <Card>
          <CardHeader>
            <CardTitle>Action palette</CardTitle>
            <CardDescription>Drag onto the scenario, or click to append.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[32rem]">
              <div className="flex flex-col gap-2 pr-3">
                {ACTION_CATALOG.map((item) => (
                  <div key={item.kind} className="flex gap-1">
                    <PaletteItem kind={item.kind} />
                    {canEdit ? (
                      <Button size="icon-sm" variant="ghost" onClick={() => addKind(item.kind)}>
                        <Plus />
                      </Button>
                    ) : null}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Scenario composer</CardTitle>
            <CardDescription>
              Chain login → navigate → click → assert without writing scripts.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  disabled={!canEdit}
                  value={draft.name}
                  onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Device</Label>
                <Select
                  value={draft.device}
                  disabled={!canEdit}
                  onValueChange={(value) =>
                    setDraft({ ...draft, device: value as DevicePreset })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desktop">Desktop 1280×900</SelectItem>
                    <SelectItem value="iphone-14">iPhone 14</SelectItem>
                    <SelectItem value="pixel-7">Pixel 7</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                disabled={!canEdit}
                value={draft.description}
                onChange={(event) => setDraft({ ...draft, description: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Browsers</Label>
              <div className="flex flex-wrap gap-4">
                {BROWSERS.map((browser) => (
                  <label key={browser} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={draft.browsers.includes(browser)}
                      disabled={!canEdit}
                      onCheckedChange={(checked) => {
                        setDraft((current) => ({
                          ...current,
                          browsers: checked
                            ? [...current.browsers, browser]
                            : current.browsers.filter((item) => item !== browser),
                        }));
                      }}
                    />
                    {browser}
                  </label>
                ))}
              </div>
            </div>
            <DropCanvas>
              <SortableContext items={draft.steps.map((step) => step.id)} strategy={verticalListSortingStrategy}>
                {draft.steps.length === 0 ? (
                  <p className="p-6 text-center text-sm text-muted-foreground">
                    Drop actions here to build the flow.
                  </p>
                ) : (
                  draft.steps.map((step, index) => (
                    <div key={step.id} className="flex items-center gap-2">
                      <Badge variant="outline">{index + 1}</Badge>
                      <div className="min-w-0 flex-1">
                        <SortableStep
                          step={step}
                          selected={step.id === selectedId}
                          onSelect={() => setSelectedId(step.id)}
                        />
                      </div>
                    </div>
                  ))
                )}
              </SortableContext>
            </DropCanvas>
            {canEdit ? (
              <div className="flex flex-wrap gap-2">
                <Button onClick={save} disabled={saving}>
                  {saving ? <Loader2 className="animate-spin" data-icon="inline-start" /> : null}
                  Save scenario
                </Button>
                <Button variant="secondary" onClick={run} disabled={running}>
                  {running ? (
                    <Loader2 className="animate-spin" data-icon="inline-start" />
                  ) : (
                    <Play data-icon="inline-start" />
                  )}
                  Run on selected browsers
                </Button>
                <Button
                  variant="outline"
                  onClick={clearBaselines}
                  disabled={clearingBaselines || running}
                >
                  {clearingBaselines ? (
                    <Loader2 className="animate-spin" data-icon="inline-start" />
                  ) : (
                    <Eraser data-icon="inline-start" />
                  )}
                  Clear baselines
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">View-only role — sharing still lets you inspect the chain.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Step inspector</CardTitle>
            <CardDescription>Configure the selected block.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {selected ? (
              <>
                <div className="space-y-2">
                  <Label>Step name</Label>
                  <Input
                    disabled={!canEdit}
                    value={selected.name}
                    onChange={(event) => updateSelected({ name: event.target.value })}
                  />
                </div>
                {selectedFields.map((field) => (
                  <div key={field.key} className="space-y-2">
                    <Label>{field.label}</Label>
                    {field.type === "textarea" ? (
                      <Textarea
                        disabled={!canEdit}
                        placeholder={field.placeholder}
                        value={selected.params[field.key] ?? ""}
                        onChange={(event) =>
                          updateSelected({
                            params: { ...selected.params, [field.key]: event.target.value },
                          })
                        }
                      />
                    ) : (
                      <Input
                        disabled={!canEdit}
                        placeholder={field.placeholder}
                        value={selected.params[field.key] ?? ""}
                        onChange={(event) =>
                          updateSelected({
                            params: { ...selected.params, [field.key]: event.target.value },
                          })
                        }
                      />
                    )}
                  </div>
                ))}
                {selected.kind === "screenshot" ? (
                  <div className="space-y-2 border-t pt-3">
                    <div className="flex items-center justify-between gap-2">
                      <Label>Existing baselines</Label>
                      <Button
                        type="button"
                        size="xs"
                        variant="ghost"
                        onClick={() => void refreshBaselines()}
                      >
                        Refresh
                      </Button>
                    </div>
                    {!selected.params.name?.trim() ? (
                      <p className="text-xs text-muted-foreground">
                        Set a snapshot name to match stored baselines.
                      </p>
                    ) : screenshotBaselines.length === 0 ? (
                      <p className="text-xs text-muted-foreground">
                        No baseline yet for “{selected.params.name.trim()}”. The
                        next run will create one.
                      </p>
                    ) : (
                      <ScrollArea className="h-64">
                        <div className="flex flex-col gap-3 pr-2">
                          {screenshotBaselines.map((baseline) => (
                            <figure
                              key={baseline.id}
                              className="space-y-1.5 rounded-lg border p-2"
                            >
                              <div className="flex flex-wrap items-center gap-1.5">
                                <Badge variant="outline">{baseline.browser}</Badge>
                                <Badge variant="secondary">{baseline.device}</Badge>
                              </div>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={baseline.image}
                                alt={`${baseline.snapshotName} baseline`}
                                className="w-full rounded-md ring-1 ring-foreground/10"
                              />
                              <figcaption className="text-[11px] text-muted-foreground">
                                Updated {new Date(baseline.updatedAt).toLocaleString()}
                              </figcaption>
                              {canEdit ? (
                                <Button
                                  type="button"
                                  size="xs"
                                  variant="outline"
                                  className="w-full"
                                  onClick={() => void clearOneBaseline(baseline.id)}
                                >
                                  <Eraser data-icon="inline-start" />
                                  Clear baseline
                                </Button>
                              ) : null}
                            </figure>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </div>
                ) : null}
                {canEdit ? (
                  <Button variant="destructive" onClick={removeSelected}>
                    <Trash2 data-icon="inline-start" />
                    Remove step
                  </Button>
                ) : null}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Select a step to edit its fields.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </DndContext>
  );
}
