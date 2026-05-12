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
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/auth/types";

const entryMotion = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25 },
};

function getRedirectPath(role: Role) {
  return role === "recruiter" ? "/recruiter/dashboard" : "/candidate/dashboard";
}

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = React.useState<Role>("recruiter");
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
      role,
    };

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = (await response.json().catch(() => null)) as
        | { user?: { role: Role }; error?: string }
        | null;

      if (!response.ok) {
        setError(result?.error ?? "Registration failed.");
        return;
      }

      if (result?.user?.role) {
        router.push(getRedirectPath(result.user.role));
      }
    } catch {
      setError("Registration failed.");
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
          <h1 className="mt-3 text-2xl font-semibold">Create your account</h1>
          <p className="mt-2 text-sm text-[--text-secondary]">
            Choose a role and start your hiring or job search workflow.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign up</CardTitle>
            <CardDescription>Pick a role and verify your email.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              <div className="grid gap-2">
                <span className="text-sm text-[--text-secondary]">Role</span>
                <div className="grid grid-cols-2 rounded-lg border border-[--border] bg-[--surface-raised] p-1">
                  {(["recruiter", "candidate"] as const).map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRole(value)}
                      className={cn(
                        "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        role === value
                          ? "bg-[--text-primary] text-[--background]"
                          : "text-[--text-secondary] hover:text-[--text-primary]"
                      )}
                    >
                      {value === "recruiter" ? "Recruiter" : "Candidate"}
                    </button>
                  ))}
                </div>
              </div>

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
                  autoComplete="new-password"
                  required
                  minLength={8}
                  placeholder="Minimum 8 characters"
                />
                <ul className="text-xs text-[--text-muted]">
                  <li>Minimum 8 characters</li>
                  <li>Include one letter and one number</li>
                </ul>
              </div>

              <Checkbox required>
                I agree to the Terms and Conditions and Privacy Policy
              </Checkbox>

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
                {loading ? <Spinner size="sm" /> : "Create account"}
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
          Already have an account?{" "}
          <Link className="text-[--text-primary] hover:underline" href="/login">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
