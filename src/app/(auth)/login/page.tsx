"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  Divider,
  Input,
  Spinner,
} from "@/components/ui";
import type { Role } from "@/lib/auth/types";

const entryMotion = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25 },
};

function getRedirectPath(role: Role) {
  return role === "recruiter" ? "/recruiter/dashboard" : "/candidate/dashboard";
}

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      email: String(formData.get("email") ?? "").trim(),
      password: String(formData.get("password") ?? ""),
    };

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = (await response.json().catch(() => null)) as
        | { user?: { role: Role }; error?: string }
        | null;

      if (!response.ok) {
        setError(result?.error ?? "Login failed.");
        return;
      }

      if (result?.user?.role) {
        router.push(getRedirectPath(result.user.role));
      }
    } catch {
      setError("Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[--background] px-6 py-12 text-[--text-primary]">
      <motion.div
        className="mx-auto flex w-full max-w-lg flex-col gap-6"
        {...entryMotion}
      >
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-[--text-muted]">
            Recrix
          </p>
          <h1 className="mt-3 text-2xl font-semibold">Welcome back</h1>
          <p className="mt-2 text-sm text-[--text-secondary]">
            Sign in to manage your pipeline or applications.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>Use your email and password.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              <div className="grid gap-2">
                <label className="text-sm text-[--text-secondary]" htmlFor="email">
                  Email
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="you@company.com"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm text-[--text-secondary]" htmlFor="password">
                  Password
                </label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  minLength={8}
                  placeholder="Minimum 8 characters"
                />
              </div>

              <div className="flex items-center justify-between text-sm text-[--text-secondary]">
                <Checkbox name="remember">Remember me</Checkbox>
                <Link className="text-[--text-primary]" href="/forgot-password">
                  Forgot password?
                </Link>
              </div>

              <AnimatePresence>
                {error ? (
                  <motion.p
                    className="text-sm text-[--destructive]"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                  >
                    {error}
                  </motion.p>
                ) : null}
              </AnimatePresence>

              <Button className="w-full" type="submit" disabled={loading}>
                {loading ? <Spinner size="sm" /> : "Sign in"}
              </Button>
            </form>

            <Divider />

            <div className="grid gap-2">
              <Button variant="ghost" type="button" className="w-full">
                Continue with Google
              </Button>
              <Button variant="ghost" type="button" className="w-full">
                Continue with LinkedIn
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-[--text-secondary]">
          Need an account?{" "}
          <Link className="text-[--text-primary] hover:underline" href="/register">
            Create one
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
