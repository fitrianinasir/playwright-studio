type Copy = {
  kicker: string;
  headline: string;
  subtitle: string;
  primaryCta: string;
  secondaryCta: string;
  metrics: Array<{ label: string; value: string; hint: string }>;
  people: Array<{
    initials: string;
    name: string;
    role: string;
    meta: string;
  }>;
};

const FIGMA_COPY: Copy = {
  kicker: "Company Name",
  headline: "Product headline here",
  subtitle:
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Placeholder copy fills this design.",
  primaryCta: "Primary CTA",
  secondaryCta: "Secondary",
  metrics: [
    { label: "Metric label", value: "$99.99", hint: "+00.0% vs Q2" },
    { label: "Card title", value: "1,234", hint: "Sample data here" },
    { label: "NPS", value: "00", hint: "Subtitle goes here" },
  ],
  people: [
    {
      initials: "JO",
      name: "John Doe",
      role: "User name",
      meta: "Coming soon",
    },
    {
      initials: "JA",
      name: "Jane Smith",
      role: "Job title",
      meta: "dummy@example.com",
    },
    {
      initials: "AL",
      name: "Alex Smith",
      role: "Role name",
      meta: "Lorem ipsum",
    },
  ],
};

const LIVE_COPY: Copy = {
  kicker: "Northwind Inc",
  headline: "Northwind dashboard",
  subtitle:
    "Track pipeline, usage, and customer health in one workspace built for revenue teams.",
  primaryCta: "Primary CTA",
  secondaryCta: "Secondary",
  metrics: [
    { label: "Annual ARR", value: "$84.20", hint: "+12.4% vs Q2" },
    { label: "Active seats", value: "8,642", hint: "Across all teams" },
    { label: "NPS", value: "72", hint: "Vs last quarter" },
  ],
  people: [
    {
      initials: "MC",
      name: "Maya Chen",
      role: "Product lead",
      meta: "2 hours ago",
    },
    {
      initials: "PS",
      name: "Priya Shah",
      role: "Design ops",
      meta: "priya@north.io",
    },
    {
      initials: "KM",
      name: "Kenji Mori",
      role: "CS manager",
      meta: "In review",
    },
  ],
};

export function AuroraCompareTarget({
  variant,
}: {
  variant: "live" | "figma";
}) {
  const copy = variant === "figma" ? FIGMA_COPY : LIVE_COPY;

  return (
    <section
      id="compare-target"
      className="flex w-[864px] flex-col overflow-hidden rounded-[16px] border border-solid border-[#e5e5e5] bg-white"
    >
      <header className="flex w-full shrink-0 items-center justify-between bg-white px-[24px] py-[16px]">
        <div className="flex items-center gap-[12px]">
          <div className="flex size-[36px] shrink-0 items-center justify-center rounded-[8px] bg-[#252525] text-[12px] font-semibold leading-[normal] text-white">
            AA
          </div>
          <div className="flex flex-col gap-[2px]">
            <p className="text-[14px] font-medium leading-[normal] whitespace-nowrap text-[#252525]">
              Aurora Analytics
            </p>
            <p className="text-[12px] font-normal leading-[normal] whitespace-nowrap text-[#737373]">
              Workspace preview
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center rounded-[12px] bg-[#f5f5f5] px-[10px] py-[4px]">
          <p className="text-[12px] font-medium leading-[normal] whitespace-nowrap text-[#252525]">
            Live
          </p>
        </div>
      </header>

      <div className="h-px w-full bg-[#e5e5e5]" />

      <div className="flex w-full items-start gap-[24px] bg-white p-[24px]">
        <div className="flex min-w-px flex-1 flex-col items-start gap-[16px]">
          <div className="flex items-center justify-center rounded-[12px] border border-solid border-[#e5e5e5] bg-white px-[10px] py-[4px]">
            <p className="text-[12px] font-medium leading-[normal] whitespace-nowrap text-[#252525]">
              {copy.kicker}
            </p>
          </div>
          <p className="text-[32px] font-semibold leading-[normal] whitespace-nowrap text-[#252525]">
            {copy.headline}
          </p>
          <p className="w-full text-[14px] font-normal leading-[normal] text-[#737373]">
            {copy.subtitle}
          </p>
          <div className="flex items-start gap-[8px]">
            <button
              type="button"
              className="rounded-[8px] bg-[#252525] px-[14px] py-[8px] text-[13px] font-medium leading-[normal] whitespace-nowrap text-white"
            >
              {copy.primaryCta}
            </button>
            <button
              type="button"
              className="rounded-[8px] border border-solid border-[#e5e5e5] bg-white px-[14px] py-[8px] text-[13px] font-medium leading-[normal] whitespace-nowrap text-[#252525]"
            >
              {copy.secondaryCta}
            </button>
          </div>
        </div>

        <div className="flex w-[280px] shrink-0 flex-col gap-[12px]">
          {copy.metrics.map((metric) => (
            <div
              key={metric.label}
              className="flex w-full flex-col items-start gap-[4px] rounded-[12px] bg-[#fafafa] px-[16px] py-[14px]"
            >
              <p className="text-[12px] font-normal leading-[normal] whitespace-nowrap text-[#737373]">
                {metric.label}
              </p>
              <p className="text-[22px] font-semibold leading-[normal] whitespace-nowrap text-[#252525]">
                {metric.value}
              </p>
              <p className="text-[12px] font-normal leading-[normal] whitespace-nowrap text-[#737373]">
                {metric.hint}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="h-px w-full bg-[#e5e5e5]" />

      <div className="flex w-full flex-col items-start gap-[12px] bg-white px-[24px] pt-[20px] pb-[24px]">
        <p className="text-[14px] font-medium leading-[normal] whitespace-nowrap text-[#252525]">
          Team activity
        </p>
        {copy.people.map((person) => (
          <div
            key={person.name}
            className="flex w-full items-center gap-[12px] rounded-[12px] bg-[#fafafa] p-[12px]"
          >
            <div className="flex size-[36px] shrink-0 items-center justify-center rounded-[18px] bg-[#f5f5f5] text-[10px] font-medium leading-[normal] text-[#252525]">
              {person.initials}
            </div>
            <div className="flex min-w-px flex-1 flex-col items-start gap-[2px]">
              <p className="text-[14px] font-medium leading-[normal] whitespace-nowrap text-[#252525]">
                {person.name}
              </p>
              <p className="text-[12px] font-normal leading-[normal] whitespace-nowrap text-[#737373]">
                {person.role}
              </p>
            </div>
            <p className="shrink-0 text-[12px] font-normal leading-[normal] whitespace-nowrap text-[#737373]">
              {person.meta}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
