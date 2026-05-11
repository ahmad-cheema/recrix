"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Button, Input, Modal, Spinner } from "@/components/ui";

export default function InviteActions({
  applicationId,
  status,
  invitedAt,
}: {
  applicationId: string;
  status: string;
  invitedAt: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [proposedTime, setProposedTime] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const isInvited = status === "interview_scheduled";

  async function handleInvite() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/applications/${applicationId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposedTime: proposedTime || undefined }),
      });

      const result = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        setError(result?.error ?? "Invite failed.");
        return;
      }

      setOpen(false);
      setProposedTime("");
      router.refresh();
    } catch {
      setError("Invite failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button onClick={() => setOpen(true)} disabled={isInvited}>
        {isInvited ? "Interview scheduled" : "Invite to interview"}
      </Button>
      {invitedAt ? (
        <p className="text-xs text-[--text-muted]">
          Invite sent {new Date(invitedAt).toLocaleString()}
        </p>
      ) : null}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Invite to interview"
        description="Send the candidate an email with the interview link."
      >
        <div className="flex flex-col gap-4">
          <div className="grid gap-2">
            <label className="text-sm text-[--text-secondary]" htmlFor="time">
              Proposed time (optional)
            </label>
            <Input
              id="time"
              value={proposedTime}
              onChange={(event) => setProposedTime(event.target.value)}
              placeholder="Next week, Tuesday 10:00 AM"
            />
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

          <div className="flex items-center justify-end gap-3">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleInvite} disabled={loading}>
              {loading ? <Spinner size="sm" /> : "Send invite"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
