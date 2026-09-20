import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Scenario } from "@/lib/newTypes";
import axios from "axios";
import { useRouter } from "next/router";
export default function HomePage() {
  const router = useRouter();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    axios
      .get(`/api/projects/scenarios`)
      .then((res) => setScenarios(res.data.scenarios))
      .then((err) => console.log("err", err));
  }, []);

  async function create() {
    const payload: Scenario = {
      name: name,
      description: description,
      browsers: [],
      device: "",
      user_id: "4e2d4559-dac9-4b9d-a019-92162f3373be",
    };

    await axios
      .post(`/api/projects/scenarios`, payload)
      .then((res) => {
        setScenarios([...scenarios, res.data.scenario]);
        toast.success("Scenario created");
        setOpen(false);
        router.push(`/builder/${res.data.scenario.id}`);
      })
      .catch(() => {
        toast.error("Could not create scenario");
      });
  }

  async function remove(scenario: Scenario) {
    if (
      !window.confirm(
        `Delete “${scenario.name}”? This also removes its screenshot baselines.`,
      )
    ) {
      return;
    }

    await axios
      .delete(`/api/projects/scenarios`, { params: { id: scenario.id } })
      .then(() => {
        setScenarios(scenarios.filter((s) => s.id !== scenario.id));
        toast.success("Scenario deleted");
      })
      .catch((err) => {
        toast.error("Could not delete scenario");
        console.log("err", err);
      });
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Scenarios</h1>
          <p className="text-sm text-muted-foreground">
            Build no-code e2e and Figma visual tests. Runs stay in memory until
            the server restarts.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus data-icon="inline-start" />
              New scenario
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New scenario</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
              </div>
              <Button onClick={create}>Create and open composer</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid gap-4">
        {scenarios.map((scenario) => (
          <Card key={scenario.id}>
            <CardHeader>
              <CardTitle>{scenario.name}</CardTitle>
              <CardDescription>{scenario.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>{scenario?.steps?.length} steps</span>
              <span>· {scenario.browsers.join(", ")}</span>
              <span>· {scenario.device}</span>
              <div className="ml-auto flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => remove(scenario)}
                >
                  <Trash2 data-icon="inline-start" />
                  Delete
                </Button>
                <Button asChild>
                  <Link href={`/builder/${scenario.id}`}>Edit in composer</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
