import type { TestRun } from "@/lib/studio-types";

export function buildHtmlReport(run: TestRun, scenarioName: string, projectName: string) {
  const rows = run.results
    .flatMap((result) =>
      result.steps.map(
        (step) => `
        <tr>
          <td>${result.browser}</td>
          <td>${escapeHtml(step.name)}</td>
          <td>${step.kind}</td>
          <td class="${step.status}">${step.status}</td>
          <td>${step.durationMs}ms</td>
          <td>${escapeHtml(step.log)}${step.error ? `<br/><strong>${escapeHtml(step.error)}</strong>` : ""}</td>
        </tr>`,
      ),
    )
    .join("");

  const images = run.results
    .flatMap((result) =>
      result.steps
        .filter((step) => step.screenshot || step.diff)
        .map(
          (step) => `
          <section>
            <h3>${escapeHtml(step.name)} (${result.browser})</h3>
            <p>${step.accuracy != null ? `Accuracy ${step.accuracy.toFixed(1)}%` : ""}</p>
            <div class="grid">
              ${step.baseline ? `<figure><figcaption>Baseline / design</figcaption><img src="${step.baseline}" /></figure>` : ""}
              ${step.screenshot ? `<figure><figcaption>Latest</figcaption><img src="${step.screenshot}" /></figure>` : ""}
              ${step.diff ? `<figure><figcaption>Diff</figcaption><img src="${step.diff}" /></figure>` : ""}
            </div>
          </section>`,
        ),
    )
    .join("");

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(projectName)} — ${escapeHtml(scenarioName)} report</title>
    <style>
      body { font-family: ui-sans-serif, system-ui, sans-serif; margin: 32px; color: #111; }
      .pass { color: #15803d; } .fail { color: #b91c1c; }
      .passed { color: #15803d; } .failed { color: #b91c1c; } .skipped { color: #a16207; }
      table { border-collapse: collapse; width: 100%; }
      td, th { border: 1px solid #e5e5e5; padding: 8px; text-align: left; font-size: 13px; }
      img { max-width: 100%; border: 1px solid #e5e5e5; border-radius: 8px; }
      .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px; }
      .logs { background: #f4f4f5; padding: 12px; border-radius: 8px; white-space: pre-wrap; }
    </style>
  </head>
  <body>
    <h1>Playwright Studio report</h1>
    <p>${escapeHtml(projectName)} / ${escapeHtml(scenarioName)}</p>
    <p>Run <code>${run.id}</code> — <strong class="${run.status}">${run.status}</strong></p>
    <p>Browsers: ${run.browsers.join(", ")} · Device: ${run.device}</p>
    <h2>Steps</h2>
    <table>
      <thead><tr><th>Browser</th><th>Step</th><th>Kind</th><th>Status</th><th>Duration</th><th>Log</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <h2>Logs</h2>
    <pre class="logs">${escapeHtml(run.logs.join("\n"))}</pre>
    ${images}
  </body>
</html>`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
