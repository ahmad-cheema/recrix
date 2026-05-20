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
import type { JobStatus } from "@/lib/jobs/types";

const draftStorageKey = "recrix.jobDraft";

type JobFormMode = "create" | "edit";

type JobFormJob = {
  id: string;
  title: string;
  department: string;
  location: string;
  employment_type: string;
  required_skills: string[];
  preferred_skills: string[] | null;
  experience_level: string;
  description: string;
  status: JobStatus;
};

type JobFormProps = {
  mode: JobFormMode;
  initialJob?: JobFormJob;
};

type DescriptionParts = {
  base: string;
  requirements: string;
  salaryRange: string;
  templateName: string;
};

function extractSection(source: string, heading: string) {
  const pattern = new RegExp(`## ${heading}\\n([\\s\\S]*?)(?=\\n## |$)`, "i");
  const match = source.match(pattern);
  return match ? match[1].trim() : "";
}

function stripSection(source: string, heading: string) {
  const pattern = new RegExp(`\\n?## ${heading}\\n[\\s\\S]*?(?=\\n## |$)`, "i");
  return source.replace(pattern, "").trim();
}

function splitDescription(description: string): DescriptionParts {
  const requirements = extractSection(description, "Requirements");
  const salaryRange = extractSection(description, "Salary Range");
  const templateName = extractSection(description, "Template");

  let base = description;
  base = stripSection(base, "Requirements");
  base = stripSection(base, "Salary Range");
  base = stripSection(base, "Template");

  return {
    base: base.trim(),
    requirements,
    salaryRange,
    templateName,
  };
}

function buildDescription(
  base: string,
  requirements: string,
  salaryRange: string,
  templateName: string
) {
  const sections = [base.trim()].filter(Boolean);

  if (requirements.trim()) {
    sections.push(`## Requirements\n${requirements.trim()}`);
  }

  if (salaryRange.trim()) {
    sections.push(`## Salary Range\n${salaryRange.trim()}`);
  }

  if (templateName.trim()) {
    sections.push(`## Template\n${templateName.trim()}`);
  }

  return sections.join("\n\n").trim();
}

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
              x
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

export default function JobForm({ mode, initialJob }: JobFormProps) {
  const router = useRouter();
  const isCreate = mode === "create";
  const parsedDescription = initialJob
    ? splitDescription(initialJob.description)
    : {
        base: "",
        requirements: "",
        salaryRange: "",
        templateName: "",
      };

  const [title, setTitle] = React.useState(initialJob?.title ?? "");
  const [department, setDepartment] = React.useState(
    initialJob?.department ?? ""
  );
  const [location, setLocation] = React.useState(initialJob?.location ?? "");
  const [employmentType, setEmploymentType] = React.useState(
    initialJob?.employment_type ?? ""
  );
  const [experienceLevel, setExperienceLevel] = React.useState(
    initialJob?.experience_level ?? ""
  );
  const [description, setDescription] = React.useState(parsedDescription.base);
  const [requirements, setRequirements] = React.useState(
    parsedDescription.requirements
  );
  const [salaryRange, setSalaryRange] = React.useState(
    parsedDescription.salaryRange
  );
  const [templateName, setTemplateName] = React.useState(
    parsedDescription.templateName
  );
  const [templateFile, setTemplateFile] = React.useState<File | null>(null);
  const [requiredInput, setRequiredInput] = React.useState("");
  const [preferredInput, setPreferredInput] = React.useState("");
  const [requiredSkills, setRequiredSkills] = React.useState<string[]>(
    initialJob?.required_skills ?? []
  );
  const [preferredSkills, setPreferredSkills] = React.useState<string[]>(
    initialJob?.preferred_skills ?? []
  );
  const [status, setStatus] = React.useState<JobStatus>(
    initialJob?.status ?? "active"
  );
  const [previewMode, setPreviewMode] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [draftSavedAt, setDraftSavedAt] = React.useState<string | null>(null);
  const [draftRestored, setDraftRestored] = React.useState(false);

  React.useEffect(() => {
    if (!isCreate) {
      return;
    }

    const stored = localStorage.getItem(draftStorageKey);
    if (!stored) {
      setDraftRestored(true);
      return;
    }

    try {
      const parsed = JSON.parse(stored) as {
        title?: string;
        department?: string;
        location?: string;
        employmentType?: string;
        experienceLevel?: string;
        description?: string;
        requirements?: string;
        salaryRange?: string;
        templateName?: string;
        requiredSkills?: string[];
        preferredSkills?: string[];
      };

      setTitle(parsed.title ?? "");
      setDepartment(parsed.department ?? "");
      setLocation(parsed.location ?? "");
      setEmploymentType(parsed.employmentType ?? "");
      setExperienceLevel(parsed.experienceLevel ?? "");
      setDescription(parsed.description ?? "");
      setRequirements(parsed.requirements ?? "");
      setSalaryRange(parsed.salaryRange ?? "");
      setTemplateName(parsed.templateName ?? "");
      setRequiredSkills(parsed.requiredSkills ?? []);
      setPreferredSkills(parsed.preferredSkills ?? []);
    } catch {
      localStorage.removeItem(draftStorageKey);
    } finally {
      setDraftRestored(true);
    }
  }, [isCreate]);

  React.useEffect(() => {
    if (!isCreate || !draftRestored) {
      return;
    }

    const handle = window.setTimeout(() => {
      const payload = {
        title,
        department,
        location,
        employmentType,
        experienceLevel,
        description,
        requirements,
        salaryRange,
        templateName,
        requiredSkills,
        preferredSkills,
      };
      localStorage.setItem(draftStorageKey, JSON.stringify(payload));
      setDraftSavedAt(new Date().toISOString());
    }, 400);

    return () => window.clearTimeout(handle);
  }, [
    isCreate,
    draftRestored,
    title,
    department,
    location,
    employmentType,
    experienceLevel,
    description,
    requirements,
    salaryRange,
    templateName,
    requiredSkills,
    preferredSkills,
  ]);

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

  function buildPayload(nextStatus?: JobStatus) {
    const finalDescription = buildDescription(
      description,
      requirements,
      salaryRange,
      templateName
    );

    return {
      title: title.trim(),
      department: department.trim(),
      location: location.trim(),
      employmentType: employmentType.trim(),
      experienceLevel: experienceLevel.trim(),
      description: finalDescription.trim(),
      requiredSkills,
      preferredSkills,
      status: nextStatus ?? status,
    };
  }

  async function submitJob(nextStatus?: JobStatus) {
    setError(null);

    if (!requiredSkills.length) {
      setError("Add at least one required skill.");
      return;
    }

    setLoading(true);

    try {
      const payload = buildPayload(nextStatus ?? status);
      const response = await fetch(
        isCreate ? "/api/jobs" : `/api/jobs/${initialJob?.id}`,
        {
          method: isCreate ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const result = (await response.json().catch(() => null)) as
        | { job?: { id: string }; error?: string }
        | null;

      if (!response.ok) {
        setError(result?.error ?? "Failed to save job.");
        return;
      }

      if (isCreate) {
        localStorage.removeItem(draftStorageKey);
      }

      if (isCreate) {
        router.push("/recruiter/jobs");
        return;
      }

      router.refresh();
    } catch {
      setError("Failed to save job.");
    } finally {
      setLoading(false);
    }
  }

  function handleTemplateChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setTemplateFile(file);
    setTemplateName(file?.name ?? templateName);
  }

  const previewText = buildDescription(
    description,
    requirements,
    salaryRange,
    templateName
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isCreate ? "Job details" : "Edit job"}</CardTitle>
        <CardDescription>
          {isCreate
            ? "All required fields must be completed."
            : "Update role details and keep applicants aligned."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-5"
          onSubmit={(event) => {
            event.preventDefault();
            submitJob(isCreate ? "active" : status);
          }}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-sm text-[--text-secondary]" htmlFor="title">
                Job title
              </label>
              <Input
                id="title"
                name="title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
                placeholder="Senior UX Designer"
              />
            </div>
            <div className="grid gap-2">
              <label
                className="text-sm text-[--text-secondary]"
                htmlFor="department"
              >
                Department
              </label>
              <Input
                id="department"
                name="department"
                value={department}
                onChange={(event) => setDepartment(event.target.value)}
                required
                placeholder="Design"
              />
            </div>
            <div className="grid gap-2">
              <label
                className="text-sm text-[--text-secondary]"
                htmlFor="location"
              >
                Location
              </label>
              <Input
                id="location"
                name="location"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                required
                placeholder="Remote"
              />
            </div>
            <div className="grid gap-2">
              <label
                className="text-sm text-[--text-secondary]"
                htmlFor="employmentType"
              >
                Job type
              </label>
              <select
                id="employmentType"
                name="employmentType"
                value={employmentType}
                onChange={(event) => setEmploymentType(event.target.value)}
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
                value={experienceLevel}
                onChange={(event) => setExperienceLevel(event.target.value)}
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
            <div className="grid gap-2">
              <label
                className="text-sm text-[--text-secondary]"
                htmlFor="salaryRange"
              >
                Salary range
              </label>
              <Input
                id="salaryRange"
                name="salaryRange"
                value={salaryRange}
                onChange={(event) => setSalaryRange(event.target.value)}
                placeholder="$90k - $120k"
              />
            </div>
            {isCreate ? null : (
              <div className="grid gap-2">
                <label className="text-sm text-[--text-secondary]" htmlFor="status">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={status}
                  onChange={(event) =>
                    setStatus(event.target.value as JobStatus)
                  }
                  className={cn(
                    "h-10 w-full rounded-lg border border-[--border] bg-[--surface-raised] px-3 text-sm text-[--text-primary] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--border] focus-visible:ring-offset-2 focus-visible:ring-offset-[--background]"
                  )}
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            )}
          </div>

          <div className="grid gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label
                className="text-sm text-[--text-secondary]"
                htmlFor="description"
              >
                Role description
              </label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setPreviewMode((prev) => !prev)}
              >
                {previewMode ? "Edit" : "Preview"}
              </Button>
            </div>
            {previewMode ? (
              <div className="min-h-[180px] rounded-lg border border-[--border] bg-[--surface-raised] px-3 py-2 text-sm text-[--text-secondary] whitespace-pre-wrap">
                {previewText || "Add a description to preview."}
              </div>
            ) : (
              <Textarea
                id="description"
                name="description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                required
                placeholder="Describe the role, responsibilities, and expectations."
              />
            )}
            <p className="text-xs text-[--text-muted]">
              Markdown is supported for headings and lists.
            </p>
          </div>

          <div className="grid gap-2">
            <label className="text-sm text-[--text-secondary]" htmlFor="requirements">
              Requirements summary
            </label>
            <Textarea
              id="requirements"
              name="requirements"
              value={requirements}
              onChange={(event) => setRequirements(event.target.value)}
              placeholder="List must-have requirements or compliance items."
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

          <div className="grid gap-2">
            <label className="text-sm text-[--text-secondary]" htmlFor="template">
              Template upload
            </label>
            <input
              id="template"
              type="file"
              onChange={handleTemplateChange}
              className="block w-full rounded-lg border border-[--border] bg-[--surface-raised] px-3 py-2 text-sm text-[--text-secondary] file:mr-3 file:rounded-md file:border-0 file:bg-[--surface] file:px-3 file:py-1 file:text-xs file:font-semibold file:text-[--text-primary]"
            />
            {templateFile ? (
              <p className="text-xs text-[--text-muted]">
                Template attached: {templateFile.name}
              </p>
            ) : null}
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

          <div className="flex flex-wrap items-center justify-between gap-4">
            {isCreate ? (
              <p className="text-xs text-[--text-muted]">
                {draftSavedAt
                  ? `Draft autosaved ${new Date(draftSavedAt).toLocaleTimeString()}`
                  : "Draft autosave enabled"}
              </p>
            ) : (
              <span className="text-xs text-[--text-muted]">
                Status updates go live instantly.
              </span>
            )}
            <div className="flex items-center gap-3">
              {isCreate ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => submitJob("draft")}
                  disabled={loading}
                >
                  Save draft
                </Button>
              ) : null}
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <Spinner size="sm" />
                ) : isCreate ? (
                  "Publish job"
                ) : (
                  "Save changes"
                )}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
