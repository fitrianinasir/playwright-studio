# Visual-Testing-Automation

Compare a live webpage section to a Figma frame (or a design page) with Playwright. Dummy design copy is detected and masked so layout accuracy can still approach 100% even when the product uses real data.

There is no database. Each run lives in memory for that browser session and disappears on refresh.

## Scripts

```bash
npm install
npx playwright install chromium
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), click **Use local demo**, then **Run visual test**.

- Live page: `/demo/webpage` (`#compare-target`)
- Dummy Figma stand-in: `/demo/figma` (same id, placeholder copy)

## Real Figma files

1. Select the frame in Figma and copy the link (it must include `node-id`).
2. Create `.env.local` with a personal access token:

```
FIGMA_ACCESS_TOKEN=figd_...
```

3. Restart `npm run dev` and paste the Figma URL into the form.
