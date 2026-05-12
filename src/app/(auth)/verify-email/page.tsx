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

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-[--background] px-6 py-12 text-[--text-primary]">
      <div className="mx-auto flex w-full max-w-md flex-col gap-6">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-[--text-muted]">
            Recrix
          </p>
          <h1 className="mt-3 text-2xl font-semibold">Verify your email</h1>
          <p className="mt-2 text-sm text-[--text-secondary]">
            Enter the verification code sent to your inbox.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Email verification</CardTitle>
            <CardDescription>Paste the 6-digit code.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Input placeholder="123456" />
            <Button>Verify email</Button>
            <p className="text-xs text-[--text-muted]">
              Did not get the email? Check spam or request a new code.
            </p>
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
