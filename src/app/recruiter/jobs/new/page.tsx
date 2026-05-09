"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Spinner,
  Textarea,
} from "@/components/ui";
import { cn } from "@/lib/utils";

const entryMotion = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25 },
};

type SkillFieldProps = {
  label: string;
  placeholder: string;
  value: string;
  items: string[];
  onChange: (value: string) => void;
  onAdd: (value: string) => void;
  onRemove: (value: string) => void;
};

function SkillField({
  label,
  placeholder,
  value,
  items,
  onChange,
  onAdd,
  onRemove,
}: SkillFieldProps) {
  return (
    <div className="grid gap-2">
      <label className="text-sm text-[--text-secondary]">{label}</label>
      <Input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === ",") {
            event.preventDefault();
            onAdd(value);
          }
        }}
      />
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item}
            className="flex items-center gap-2 rounded-full border border-[--border] px-3 py-1 text-xs text-[--text-secondary]"
          >
            {item}
            <button
              type="button"
              className="text-[--text-muted] hover:text-[--text-primary]"
              onClick={() => onRemove(item)}
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

function normalizeSkill(value: string) {
  return value.replace(/,+$/, "").trim();
}

export default function NewJobPage() {
  const router = useRouter();
  const [requiredInput, setRequiredInput] = React.useState("");
  const [preferredInput, setPreferredInput] = React.useState("");
  const [requiredSkills, setRequiredSkills] = React.useState<string[]>([]);
  const [preferredSkills, setPreferredSkills] = React.useState<string[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  function addSkill(
    value: string,
    items: string[],
    setItems: React.Dispatch<React.SetStateAction<string[]>>,
    setValue: React.Dispatch<React.SetStateAction<string>>
  ) {
    const trimmed = normalizeSkill(value);
    if (!trimmed) {
      return;
    }
    if (items.some((item) => item.toLowerCase() === trimmed.toLowerCase())) {
      setValue("");
      return;
    }
    setItems([...items, trimmed]);
    setValue("");
  }

  function removeSkill(
    value: string,
    items: string[],
    setItems: React.Dispatch<React.SetStateAction<string[]>>
  ) {
    setItems(items.filter((item) => item !== value));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!requiredSkills.length) {
      setError("Add at least one required skill.");
      return;
    }

    setLoading(true);
    const formData = new FormData(event.currentTarget);
    const payload = {
      title: String(formData.get("title") ?? "").trim(),
      department: String(formData.get("department") ?? "").trim(),
      location: String(formData.get("location") ?? "").trim(),
      employmentType: String(formData.get("employmentType") ?? "").trim(),
      experienceLevel: String(formData.get("experienceLevel") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim(),
      requiredSkills,
      preferredSkills,
      status: "active",
    };

    try {
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = (await response.json().catch(() => null)) as
        | { job?: { id: string }; error?: string }
        | null;

      if (!response.ok) {
        setError(result?.error ?? "Failed to create job.");
        return;
      }

      router.push("/recruiter/jobs");
    } catch {
      setError("Failed to create job.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[--background] px-6 py-10 text-[--text-primary]">
      <motion.div
        className="mx-auto flex w-full max-w-4xl flex-col gap-6"
        {...entryMotion}
      >
        <div>
          <h1 className="text-2xl font-semibold">Post a new job</h1>
          <p className="mt-2 text-sm text-[--text-secondary]">
            Fill in the details and publish when ready.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Job details</CardTitle>
            <CardDescription>All required fields must be completed.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-5" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <label className="text-sm text-[--text-secondary]" htmlFor="title">
                    Job title
                  </label>
                  <Input id="title" name="title" required placeholder="Senior UX Designer" />
                </div>
                <div className="grid gap-2">
                  <label
                    className="text-sm text-[--text-secondary]"
                    htmlFor="department"
                  >
                    Department
                  </label>
                  <Input id="department" name="department" required placeholder="Design" />
                </div>
                <div className="grid gap-2">
                  <label
                    className="text-sm text-[--text-secondary]"
                    htmlFor="location"
                  >
                    Location
                  </label>
                  <Input id="location" name="location" required placeholder="Remote" />
                </div>
                <div className="grid gap-2">
                  <label
                    className="text-sm text-[--text-secondary]"
                    htmlFor="employmentType"
                  >
                    Employment type
                  </label>
                  <select
                    id="employmentType"
                    name="employmentType"
                    required
                    className={cn(
                      "h-10 w-full rounded-lg border border-[--border] bg-[--surface-raised] px-3 text-sm text-[--text-primary] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--border] focus-visible:ring-offset-2 focus-visible:ring-offset-[--background]"
                    )}
                  >
                    <option value="">Select type</option>
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <label
                    className="text-sm text-[--text-secondary]"
                    htmlFor="experienceLevel"
                  >
                    Experience level
                  </label>
                  <select
                    id="experienceLevel"
                    name="experienceLevel"
                    required
                    className={cn(
                      "h-10 w-full rounded-lg border border-[--border] bg-[--surface-raised] px-3 text-sm text-[--text-primary] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--border] focus-visible:ring-offset-2 focus-visible:ring-offset-[--background]"
                    )}
                  >
                    <option value="">Select level</option>
                    <option value="Entry">Entry</option>
                    <option value="Mid">Mid</option>
                    <option value="Senior">Senior</option>
                    <option value="Lead">Lead</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-2">
                <label
                  className="text-sm text-[--text-secondary]"
                  htmlFor="description"
                >
                  Description
                </label>
                <Textarea
                  id="description"
                  name="description"
                  required
                  placeholder="Describe the role, responsibilities, and expectations."
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <SkillField
                  label="Required skills"
                  placeholder="Type a skill and press Enter"
                  value={requiredInput}
                  items={requiredSkills}
                  onChange={setRequiredInput}
                  onAdd={(value) =>
                    addSkill(value, requiredSkills, setRequiredSkills, setRequiredInput)
                  }
                  onRemove={(value) =>
                    removeSkill(value, requiredSkills, setRequiredSkills)
                  }
                />
                <SkillField
                  label="Preferred skills"
                  placeholder="Optional skills"
                  value={preferredInput}
                  items={preferredSkills}
                  onChange={setPreferredInput}
                  onAdd={(value) =>
                    addSkill(value, preferredSkills, setPreferredSkills, setPreferredInput)
                  }
                  onRemove={(value) =>
                    removeSkill(value, preferredSkills, setPreferredSkills)
                  }
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
                <Button type="submit" disabled={loading}>
                  {loading ? <Spinner size="sm" /> : "Publish job"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
