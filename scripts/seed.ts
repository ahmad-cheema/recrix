/**
 * Seed script for Recrix development database.
 * Usage: npx tsx scripts/seed.ts
 *
 * Requires environment variables:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import {
  MOCK_USERS,
  MOCK_JOBS,
  MOCK_APPLICATIONS,
  MOCK_INTERVIEW_SESSIONS,
  MOCK_SAVED_JOBS,
} from "../src/lib/mock-data";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function seed() {
  console.log("Seeding Recrix database...\n");

  // 1. Users
  console.log("Users:");
  for (const user of MOCK_USERS) {
    const passwordHash = await bcrypt.hash(user.password, 12);
    const { error } = await supabase.from("users").upsert(
      {
        id: user.id,
        email: user.email,
        password_hash: passwordHash,
        role: user.role,
      },
      { onConflict: "id" }
    );
    if (error) {
      console.log(`  x ${user.email}: ${error.message}`);
    } else {
      console.log(`  ok ${user.email} (${user.role})`);
    }
  }

  // 2. Jobs
  console.log("\nJobs:");
  for (const job of MOCK_JOBS) {
    const { error } = await supabase.from("jobs").upsert(
      {
        id: job.id,
        recruiter_id: job.recruiter_id,
        title: job.title,
        department: job.department,
        location: job.location,
        employment_type: job.employment_type,
        experience_level: job.experience_level,
        description: job.description,
        required_skills: job.required_skills,
        preferred_skills: job.preferred_skills,
        status: job.status,
      },
      { onConflict: "id" }
    );
    if (error) {
      console.log(`  x ${job.title}: ${error.message}`);
    } else {
      console.log(`  ok ${job.title} (${job.department})`);
    }
  }

  // 3. Applications
  console.log("\nApplications:");
  for (const app of MOCK_APPLICATIONS) {
    const { error } = await supabase.from("applications").upsert(
      {
        id: app.id,
        job_id: app.job_id,
        candidate_id: app.candidate_id,
        status: app.status,
        match_score: app.match_score,
        risk_evaluation: app.risk_evaluation,
        invited_at: app.invited_at,
        parsed_resume: app.parsed_resume,
      },
      { onConflict: "id" }
    );
    if (error) {
      console.log(`  x app ${app.id.slice(0, 8)}: ${error.message}`);
    } else {
      console.log(
        `  ok app ${app.id.slice(0, 8)} - status: ${app.status}, score: ${app.match_score ?? "N/A"}`
      );
    }
  }

  // 4. Interview Sessions
  console.log("\nInterview Sessions:");
  for (const session of MOCK_INTERVIEW_SESSIONS) {
    const { error } = await supabase.from("interview_sessions").upsert(
      {
        id: session.id,
        application_id: session.application_id,
        status: session.status,
        questions: session.questions,
        answers: session.answers,
        summary: session.summary,
      },
      { onConflict: "id" }
    );
    if (error) {
      console.log(`  x session ${session.id.slice(0, 8)}: ${error.message}`);
    } else {
      console.log(
        `  ok session ${session.id.slice(0, 8)} - status: ${session.status}`
      );
    }
  }

  // 5. Saved Jobs
  console.log("\nSaved Jobs:");
  for (const savedJob of MOCK_SAVED_JOBS) {
    const { error } = await supabase.from("saved_jobs").upsert(savedJob, {
      onConflict: "candidate_id,job_id",
    });
    if (error) {
      console.log(
        `  x saved ${savedJob.candidate_id.slice(0, 8)} -> ${savedJob.job_id.slice(0, 8)}: ${error.message}`
      );
    } else {
      console.log(
        `  ok saved ${savedJob.candidate_id.slice(0, 8)} -> ${savedJob.job_id.slice(0, 8)}`
      );
    }
  }

  console.log("\nSeed complete!");
  console.log(`   ${MOCK_USERS.length} users`);
  console.log(`   ${MOCK_JOBS.length} jobs`);
  console.log(`   ${MOCK_APPLICATIONS.length} applications`);
  console.log(`   ${MOCK_INTERVIEW_SESSIONS.length} interview sessions`);
  console.log(`   ${MOCK_SAVED_JOBS.length} saved jobs`);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
