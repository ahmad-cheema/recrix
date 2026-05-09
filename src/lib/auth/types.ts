export type Role = "recruiter" | "candidate";

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
}

export interface AuthTokenPayload {
  sub: string;
  role: Role;
  email: string;
}
