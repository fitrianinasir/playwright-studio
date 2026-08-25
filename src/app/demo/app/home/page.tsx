import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DemoHomePage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10">
      <section id="welcome-panel" className="rounded-2xl bg-card p-6 ring-1 ring-foreground/10">
        <Badge variant="secondary">Live workspace</Badge>
        <h1 id="welcome-title" className="mt-3 text-3xl font-semibold tracking-tight">
          Welcome back
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You signed in as Maya Chen · Product Design
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Card size="sm">
            <CardHeader>
              <CardTitle className="text-base">Open specs</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">18</CardContent>
          </Card>
          <Card size="sm">
            <CardHeader>
              <CardTitle className="text-base">Reviews</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">4</CardContent>
          </Card>
          <Card size="sm">
            <CardHeader>
              <CardTitle className="text-base">Ship window</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">Fri</CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
