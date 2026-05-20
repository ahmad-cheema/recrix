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
import type { CandidateProfile } from "@/lib/users/types";
import { RESUME_ALLOWED_EXTENSIONS } from "@/lib/resume/constants";
import { validateResumeFile } from "@/lib/resume/validation";

type Props = {
  initialProfile: CandidateProfile;
};

const inputClass =
  "text-sm text-[--text-secondary] rounded-lg border border-[--border] bg-[--surface-raised] px-3 py-2";

export default function CandidateProfileClient({ initialProfile }: Props) {
  const [fullName, setFullName] = React.useState(initialProfile.fullName);
  const [currentTitle, setCurrentTitle] = React.useState(initialProfile.currentTitle);
  const [location, setLocation] = React.useState(initialProfile.location);
  const [portfolioUrl, setPortfolioUrl] = React.useState(initialProfile.portfolioUrl);
  const [summary, setSummary] = React.useState(initialProfile.summary);
  const [resume, setResume] = React.useState(initialProfile.resume);

  const [savingProfile, setSavingProfile] = React.useState(false);
  const [profileMessage, setProfileMessage] = React.useState<string | null>(null);
  const [profileError, setProfileError] = React.useState<string | null>(null);

  const [file, setFile] = React.useState<File | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [resumeMessage, setResumeMessage] = React.useState<string | null>(null);
  const [resumeError, setResumeError] = React.useState<string | null>(null);

  async function saveProfile() {
    setSavingProfile(true);
    setProfileError(null);
    setProfileMessage(null);

    try {
      const response = await fetch("/api/candidate/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          currentTitle,
          location,
          portfolioUrl,
          summary,
        }),
      });
      const payload = (await response.json()) as {
        error?: string;
        profile?: CandidateProfile;
      };

      if (!response.ok || !payload.profile) {
        throw new Error(payload.error ?? "Failed to save profile.");
      }

      setProfileMessage("Profile updated.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save profile.";
      setProfileError(message);
    } finally {
      setSavingProfile(false);
    }
  }

  function onFileChange(nextFile: File | null) {
    if (!nextFile) {
      setFile(null);
      return;
    }
    const validation = validateResumeFile(nextFile);
    if (!validation.ok) {
      setResumeError(validation.error);
      setFile(null);
      return;
    }
    setResumeError(null);
    setFile(nextFile);
  }

  async function uploadResume() {
    if (!file) {
      setResumeError("Please select a resume file.");
      return;
    }

    setUploading(true);
    setResumeError(null);
    setResumeMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/candidate/profile/resume", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as {
        error?: string;
        resume?: CandidateProfile["resume"];
      };

      if (!response.ok || !payload.resume) {
        throw new Error(payload.error ?? "Resume upload failed.");
      }

      setResume(payload.resume);
      setFile(null);
      setResumeMessage("Resume uploaded.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Resume upload failed.";
      setResumeError(message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Profile</h1>
        <p className="mt-2 text-sm text-[--text-secondary]">
          Keep your profile updated for better matches.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personal details</CardTitle>
          <CardDescription>Shown on your applications.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" />
            <Input
              value={currentTitle}
              onChange={(e) => setCurrentTitle(e.target.value)}
              placeholder="Current title"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" />
            <Input
              value={portfolioUrl}
              onChange={(e) => setPortfolioUrl(e.target.value)}
              placeholder="LinkedIn or portfolio"
            />
          </div>
          <Textarea
            rows={4}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Summary"
          />
          <div className="flex flex-col gap-2">
            <Button onClick={saveProfile} disabled={savingProfile}>
              {savingProfile ? "Saving..." : "Save profile"}
            </Button>
            {profileMessage ? <p className="text-sm text-emerald-400">{profileMessage}</p> : null}
            {profileError ? <p className="text-sm text-[--destructive]">{profileError}</p> : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resume</CardTitle>
          <CardDescription>Replace the resume used in applications.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {resume ? (
            <div className="rounded-lg border border-[--border] bg-[--surface-raised] p-3 text-sm">
              <p className="font-medium text-[--text-primary]">{resume.fileName}</p>
              <p className="text-xs text-[--text-secondary]">
                Uploaded {new Date(resume.uploadedAt).toLocaleString()}
              </p>
              {resume.downloadUrl ? (
                <a className="mt-2 inline-block text-xs text-[--accent] hover:text-[--accent-hover]" href={resume.downloadUrl} target="_blank" rel="noreferrer">
                  Preview current resume
                </a>
              ) : null}
            </div>
          ) : null}
          <input
            className={inputClass}
            type="file"
            accept={RESUME_ALLOWED_EXTENSIONS.join(",")}
            onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
          />
          <Button onClick={uploadResume} disabled={uploading}>
            {uploading ? "Uploading..." : "Upload resume"}
          </Button>
          {resumeMessage ? <p className="text-sm text-emerald-400">{resumeMessage}</p> : null}
          {resumeError ? <p className="text-sm text-[--destructive]">{resumeError}</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
