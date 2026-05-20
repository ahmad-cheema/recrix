import type { Role } from "@/lib/auth/types";
import type { ApplicationStatus } from "@/lib/applications/types";
import type { InterviewSessionStatus } from "@/lib/interviews/types";
import type { JobStatus } from "@/lib/jobs/types";

type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          password_hash: string;
          role: Role;
          metadata: Json;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          email: string;
          password_hash: string;
          role: Role;
          metadata?: Json;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          email?: string;
          password_hash?: string;
          role?: Role;
          metadata?: Json;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      jobs: {
        Row: {
          id: string;
          recruiter_id: string;
          title: string;
          department: string;
          location: string;
          employment_type: string;
          required_skills: string[];
          preferred_skills: string[] | null;
          experience_level: string;
          description: string;
          status: JobStatus;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          recruiter_id: string;
          title: string;
          department: string;
          location: string;
          employment_type: string;
          required_skills: string[];
          preferred_skills?: string[] | null;
          experience_level: string;
          description: string;
          status?: JobStatus;
          created_at?: string | null;
        };
        Update: {
          title?: string;
          department?: string;
          location?: string;
          employment_type?: string;
          required_skills?: string[];
          preferred_skills?: string[] | null;
          experience_level?: string;
          description?: string;
          status?: JobStatus;
          created_at?: string | null;
        };
        Relationships: [];
      };
      applications: {
        Row: {
          id: string;
          job_id: string;
          candidate_id: string;
          resume_path: string | null;
          parsed_resume: Json | null;
          match_score: number | null;
          risk_evaluation: string | null;
          status: ApplicationStatus;
          invited_at: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          job_id: string;
          candidate_id: string;
          resume_path?: string | null;
          parsed_resume?: Json | null;
          match_score?: number | null;
          risk_evaluation?: string | null;
          status?: ApplicationStatus;
          invited_at?: string | null;
          created_at?: string | null;
        };
        Update: {
          resume_path?: string | null;
          parsed_resume?: Json | null;
          match_score?: number | null;
          risk_evaluation?: string | null;
          status?: ApplicationStatus;
          invited_at?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      interview_sessions: {
        Row: {
          id: string;
          application_id: string;
          questions: Json | null;
          answers: Json | null;
          summary: string | null;
          status: InterviewSessionStatus;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          application_id: string;
          questions?: Json | null;
          answers?: Json | null;
          summary?: string | null;
          status?: InterviewSessionStatus;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          questions?: Json | null;
          answers?: Json | null;
          summary?: string | null;
          status?: InterviewSessionStatus;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      saved_jobs: {
        Row: {
          id: string;
          candidate_id: string;
          job_id: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          candidate_id: string;
          job_id: string;
          created_at?: string | null;
        };
        Update: {
          candidate_id?: string;
          job_id?: string;
          created_at?: string | null;
        };
        Relationships: [];
      };
      application_evaluations: {
        Row: {
          id: string;
          application_id: string;
          model: string;
          prompt_version: string;
          evaluation_version: string;
          overall_match_score: number;
          skills_match_score: number;
          experience_match_score: number;
          education_match_score: number;
          hiring_recommendation: string;
          payload: Json;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          application_id: string;
          model: string;
          prompt_version: string;
          evaluation_version: string;
          overall_match_score: number;
          skills_match_score: number;
          experience_match_score: number;
          education_match_score: number;
          hiring_recommendation: string;
          payload: Json;
          created_at?: string | null;
        };
        Update: {
          model?: string;
          prompt_version?: string;
          evaluation_version?: string;
          overall_match_score?: number;
          skills_match_score?: number;
          experience_match_score?: number;
          education_match_score?: number;
          hiring_recommendation?: string;
          payload?: Json;
          created_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};
