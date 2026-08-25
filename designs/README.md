# Import the Aurora Analytics design into Figma

Figma’s **REST API cannot create canvas frames**, even with `FIGMA_ACCESS_TOKEN`. Writing to the canvas needs either:

1. Manual import (fastest), or  
2. **Figma MCP** “write to canvas” (agent writes into an open file).

## Option A — Import the SVG (recommended now)

File already in this repo:

`designs/aurora-analytics-figma-dummy.svg`

1. Open [Figma](https://www.figma.com) and create a new **Design** file (e.g. `VTA — Aurora Analytics`).
2. Drag `aurora-analytics-figma-dummy.svg` onto the canvas (or **File → Place image** / paste SVG).
3. Rename the top frame to `compare-target` if you flatten/group it.
4. Copy the **node link**: select the frame → **Copy link** (must include `node-id=…`).
5. Paste that URL into Playwright Studio’s **Figma visual** field (with `FIGMA_ACCESS_TOKEN` set) so the app exports that node via the Figma API.

This SVG matches the dummy copy used by `/demo/figma` (Company Name, Product headline here, John Doe, lorem, etc.) so dummy-text whitelisting still works against `/demo/webpage`.

## Option B — Let the agent write into your file (Figma MCP)

1. In Cursor, connect the **official Figma MCP** server and sign in with your Figma account (Full seat required to write).
2. Create or open an empty Design file and paste its URL here.
3. Ask: *“Write the Aurora Analytics compare-target design into this Figma file.”*

The agent will use Figma’s Plugin API through MCP (`use_figma`), not the REST token alone.

## What the design contains

| Region | Dummy content (for whitelist demos) |
| --- | --- |
| Kicker | Company Name |
| Title | Product headline here |
| Subtitle | Lorem ipsum… Placeholder copy… |
| CTAs | Primary CTA / Secondary |
| Metrics | Metric label $99.99, Card title 1,234, NPS 00 |
| People | John Doe, Jane Smith, Alex Smith |

Live page counterpart in the app: `/demo/webpage` (real names/metrics).
