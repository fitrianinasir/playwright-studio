"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function DemoLoginPage() {
  const router = useRouter();
  const [corporateId, setCorporateId] = useState("");
  const [userId, setUserId] = useState("");
  const [keybca, setKeybca] = useState("");
  const [error, setError] = useState("");

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (corporateId === "ACME01" && userId === "designer" && keybca === "123456") {
      router.push("/demo/app/home");
      return;
    }
    setError("Invalid demo credentials.");
  }

  return (
    <div className="flex min-h-full flex-1 items-center justify-center px-6 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Acme workspace</CardTitle>
          <CardDescription>
            Dummy app under test. Inputs have no id — Playwright can use name
            selectors such as [name=&quot;Corporate_id&quot;]. Demo values: ACME01 /
            designer / 123456
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={onSubmit}>
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">Corporate_id</span>
              <Input
                name="Corporate_id"
                autoComplete="off"
                value={corporateId}
                onChange={(event) => setCorporateId(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">user_id</span>
              <Input
                name="user_id"
                autoComplete="username"
                value={userId}
                onChange={(event) => setUserId(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">keybca</span>
              <Input
                name="keybca"
                type="password"
                autoComplete="off"
                value={keybca}
                onChange={(event) => setKeybca(event.target.value)}
              />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button type="submit">Sign in</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
