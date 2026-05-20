"use client";

import * as React from "react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Textarea,
} from "@/components/ui";

type ManualOverrideProfile = {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  location?: string | null;
  skills?: string[];
  experience?: string | null;
  education?: string | null;
};

export default function ManualOverrideEditor({
  applicationId,
  initialOverrides,
}: {
  applicationId: string;
  initialOverrides: ManualOverrideProfile | null;
}) {
  const [state, setState] = React.useState({
    name: initialOverrides?.name ?? "",
    email: initialOverrides?.email ?? "",
    phone: initialOverrides?.phone ?? "",
    location: initialOverrides?.location ?? "",
    skills: (initialOverrides?.skills ?? []).join(", "),
    experience: initialOverrides?.experience ?? "",
    education: initialOverrides?.education ?? "",
  });
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  function onChange<K extends keyof typeof state>(key: K, value: string) {
    setState((prev) => ({ ...prev, [key]: value }));
  }

  async function saveOverrides() {
    setSaving(true);
    setMessage(null);
    setError(null);
    const payload = {
      name: state.name || null,
      email: state.email || null,
      phone: state.phone || null,
      location: state.location || null,
      skills: state.skills
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
      experience: state.experience || null,
      education: state.education || null,
    };

    try {
      const response = await fetch(`/api/applications/${applicationId}/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      if (!response.ok) {
        throw new Error(result?.error ?? "Save failed.");
      }
      setMessage("Manual profile overrides saved.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manual Override</CardTitle>
        <CardDescription>
          Edit candidate profile fields before running AI evaluation.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        <div className="grid gap-3 md:grid-cols-2">
          <Input
            value={state.name}
            onChange={(event) => onChange("name", event.target.value)}
            placeholder="Candidate name"
          />
          <Input
            value={state.email}
            onChange={(event) => onChange("email", event.target.value)}
            placeholder="Candidate email"
          />
          <Input
            value={state.phone}
            onChange={(event) => onChange("phone", event.target.value)}
            placeholder="Phone"
          />
          <Input
            value={state.location}
            onChange={(event) => onChange("location", event.target.value)}
            placeholder="Location"
          />
        </div>
        <Input
          value={state.skills}
          onChange={(event) => onChange("skills", event.target.value)}
          placeholder="Skills (comma separated)"
        />
        <Textarea
          value={state.experience}
          onChange={(event) => onChange("experience", event.target.value)}
          placeholder="Experience summary"
          rows={3}
        />
        <Textarea
          value={state.education}
          onChange={(event) => onChange("education", event.target.value)}
          placeholder="Education summary"
          rows={2}
        />
        {message ? (
          <p className="text-xs text-emerald-700">{message}</p>
        ) : null}
        {error ? <p className="text-xs text-red-700">{error}</p> : null}
        <div>
          <Button onClick={saveOverrides} disabled={saving}>
            {saving ? "Saving..." : "Save Overrides"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
