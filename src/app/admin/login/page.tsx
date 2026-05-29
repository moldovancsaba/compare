"use client";

import { Button, Code, Container, Paper, PasswordInput, Stack, Text, Title } from "@mantine/core";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/notify";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        toast.error((j as { error?: string }).error || "Login failed");
        return;
      }
      toast.success("Signed in");
      router.push("/admin");
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Container size="xs" py="xl">
      <Paper withBorder radius="xl" p="xl" mt="xl">
        <form onSubmit={submit}>
          <Stack gap="md">
        <Title order={1} size="h3">
          Class Scout Admin
        </Title>
        <Text size="sm" c="dimmed">
          Use the value of <Code>ADMIN_PASSWORD</Code> from <Code>.env</Code> or <Code>.env.local</Code> locally, or from your
          host&apos;s environment. <Code>.env.example</Code> is not loaded by the app. For local dev, run <Code>npm run
          env:generate</Code> to write a strong password into <Code>.env.local</Code>.
        </Text>
        <PasswordInput
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
        />
        <Button type="submit" fullWidth disabled={busy || !password} loading={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </Button>
        <Button component={Link} href="/" variant="subtle" color="teal" fullWidth>
          Back to site
        </Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}
