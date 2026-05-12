"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
} from "@/components/ui";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);

  return (
    <div className="min-h-screen bg-[--background] px-6 py-12 text-[--text-primary]">
      <div className="mx-auto flex w-full max-w-md flex-col gap-6">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-[--text-muted]">
            Recrix
          </p>
          <h1 className="mt-3 text-2xl font-semibold">Reset your password</h1>
          <p className="mt-2 text-sm text-[--text-secondary]">
            We will send a reset link to your inbox.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Forgot password</CardTitle>
            <CardDescription>Enter your account email.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Input type="email" placeholder="you@company.com" />
            <Button onClick={() => setSent(true)}>Send reset link</Button>
            {sent ? (
              <p className="text-sm text-[--text-secondary]">
                Check your email for the reset link.
              </p>
            ) : null}
          </CardContent>
        </Card>

        <p className="text-center text-sm text-[--text-secondary]">
          Remembered your password?{" "}
          <Link className="text-[--text-primary] hover:underline" href="/login">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
