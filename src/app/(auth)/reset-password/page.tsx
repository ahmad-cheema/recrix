"use client";

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

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[--background] px-6 py-12 text-[--text-primary]">
      <div className="mx-auto flex w-full max-w-md flex-col gap-6">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-[--text-muted]">
            Recrix
          </p>
          <h1 className="mt-3 text-2xl font-semibold">Set a new password</h1>
          <p className="mt-2 text-sm text-[--text-secondary]">
            Choose a strong password to secure your account.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Reset password</CardTitle>
            <CardDescription>Enter your new password.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Input type="password" placeholder="New password" />
            <Input type="password" placeholder="Confirm password" />
            <Button>Update password</Button>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-[--text-secondary]">
          <Link className="text-[--text-primary] hover:underline" href="/login">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
