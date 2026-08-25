import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export type DemoMetric = {
  label: string;
  value: string;
  delta: string;
};

export type DemoPerson = {
  name: string;
  role: string;
  detail: string;
};

export type DemoLandingContent = {
  kicker: string;
  title: string;
  subtitle: string;
  primaryCta: string;
  secondaryCta: string;
  metrics: [DemoMetric, DemoMetric, DemoMetric];
  people: [DemoPerson, DemoPerson, DemoPerson];
};

export function DemoLanding({ content }: { content: DemoLandingContent }) {
  return (
    <main className="min-h-full bg-background">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-10">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Demo surface
        </p>
        <section
          id="compare-target"
          className="overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10"
        >
          <div className="flex items-center justify-between gap-4 border-b px-6 py-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
                AA
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">Aurora Analytics</p>
                <p className="truncate text-xs text-muted-foreground">
                  Workspace preview
                </p>
              </div>
            </div>
            <Badge variant="secondary">Live</Badge>
          </div>

          <div className="grid gap-6 px-6 py-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="flex min-w-0 flex-col gap-4">
              <Badge variant="outline" className="w-fit">
                {content.kicker}
              </Badge>
              <h1 className="truncate text-3xl font-semibold tracking-tight">
                {content.title}
              </h1>
              <p className="line-clamp-2 min-h-12 text-sm leading-6 text-muted-foreground">
                {content.subtitle}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button>{content.primaryCta}</Button>
                <Button variant="outline">{content.secondaryCta}</Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {content.metrics.map((metric) => (
                <Card key={metric.label} size="sm" className="bg-muted/40">
                  <CardContent className="flex flex-col gap-1 pt-1">
                    <p className="truncate text-xs text-muted-foreground">
                      {metric.label}
                    </p>
                    <p className="truncate text-xl font-semibold">{metric.value}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {metric.delta}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Separator />

          <div className="px-6 py-5">
            <p className="mb-3 text-sm font-medium">Team activity</p>
            <div className="grid gap-3">
              {content.people.map((person) => (
                <div
                  key={person.name}
                  className="flex items-center gap-3 rounded-xl bg-muted/40 px-3 py-3"
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-medium">
                    {person.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{person.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {person.role}
                    </p>
                  </div>
                  <p className="max-w-48 truncate text-xs text-muted-foreground">
                    {person.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export const realWebpageContent: DemoLandingContent = {
  kicker: "Northstar Retail",
  title: "Q3 revenue is up 18%",
  subtitle:
    "APAC stores outperformed forecast after the July assortment refresh and faster restock cycles.",
  primaryCta: "Open report",
  secondaryCta: "Share snapshot",
  metrics: [
    { label: "Revenue", value: "$2.41M", delta: "+18.4% vs Q2" },
    { label: "Active shops", value: "1,284", delta: "42 new this month" },
    { label: "NPS", value: "64", delta: "Support queue at 2h" },
  ],
  people: [
    {
      name: "Maya Chen",
      role: "Regional lead",
      detail: "Closed Seoul restock",
    },
    {
      name: "Luis Ortega",
      role: "Ops analyst",
      detail: "Flagged SKU 4481",
    },
    {
      name: "Priya Nair",
      role: "CS manager",
      detail: "NPS rebound in IN",
    },
  ],
};

export const figmaDummyContent: DemoLandingContent = {
  kicker: "Company Name",
  title: "Product headline here",
  subtitle:
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Placeholder copy fills this design.",
  primaryCta: "Primary CTA",
  secondaryCta: "Secondary",
  metrics: [
    { label: "Metric label", value: "$99.99", delta: "+00.0% vs Q2" },
    { label: "Card title", value: "1,234", delta: "Sample data here" },
    { label: "NPS", value: "00", delta: "Subtitle goes here" },
  ],
  people: [
    {
      name: "John Doe",
      role: "User name",
      detail: "Coming soon",
    },
    {
      name: "Jane Smith",
      role: "Job title",
      detail: "dummy@example.com",
    },
    {
      name: "Alex Smith",
      role: "Role name",
      detail: "Lorem ipsum",
    },
  ],
};
