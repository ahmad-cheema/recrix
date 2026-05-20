"use client";

import * as React from "react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Textarea,
} from "@/components/ui";

function formatNoteDate(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type Note = {
  id: string;
  text: string;
  createdAt: string;
};

function getStorageKey(applicationId: string) {
  return `recrix_notes_${applicationId}`;
}

function loadNotes(applicationId: string): Note[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = localStorage.getItem(getStorageKey(applicationId));
    return raw ? (JSON.parse(raw) as Note[]) : [];
  } catch {
    return [];
  }
}

function saveNotes(applicationId: string, notes: Note[]) {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(getStorageKey(applicationId), JSON.stringify(notes));
}

export default function ApplicationDetailClient({
  applicationId,
}: {
  applicationId: string;
}) {
  const [notes, setNotes] = React.useState<Note[]>([]);
  const [draft, setDraft] = React.useState("");

  React.useEffect(() => {
    setNotes(loadNotes(applicationId));
  }, [applicationId]);

  function addNote() {
    const text = draft.trim();
    if (!text) {
      return;
    }
    const note: Note = {
      id: crypto.randomUUID(),
      text,
      createdAt: new Date().toISOString(),
    };
    const updated = [note, ...notes];
    setNotes(updated);
    saveNotes(applicationId, updated);
    setDraft("");
  }

  function removeNote(noteId: string) {
    const updated = notes.filter((n) => n.id !== noteId);
    setNotes(updated);
    saveNotes(applicationId, updated);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Internal notes</CardTitle>
        <CardDescription>
          Private notes saved in your browser only.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a note about this candidate…"
          rows={3}
          aria-label="Add internal note"
        />
        <Button size="sm" onClick={addNote} disabled={!draft.trim()}>
          Add note
        </Button>

        {notes.length > 0 ? (
          <div className="flex flex-col gap-2">
            {notes.map((note) => (
              <div
                key={note.id}
                className="rounded-lg border border-[--border] bg-[--surface-raised] px-3 py-2"
              >
                <p className="text-xs text-[--text-secondary] whitespace-pre-wrap">
                  {note.text}
                </p>
                <div className="mt-2 flex items-center justify-between text-[10px] text-[--text-muted]">
                  <span>{formatNoteDate(note.createdAt)}</span>
                  <button
                    type="button"
                    onClick={() => removeNote(note.id)}
                    className="text-[--destructive] hover:underline"
                    aria-label="Delete note"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
