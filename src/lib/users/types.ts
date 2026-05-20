export type CandidateProfile = {
  fullName: string;
  currentTitle: string;
  location: string;
  portfolioUrl: string;
  summary: string;
  resume: {
    fileName: string;
    uploadedAt: string;
    downloadUrl: string | null;
  } | null;
};

export type CandidateNotificationSettings = {
  interviewInvites: boolean;
  weeklyUpdates: boolean;
  smsReminders: boolean;
};

export type CandidateSettings = {
  email: string;
  notifications: CandidateNotificationSettings;
};

export type RecruiterCompanyProfile = {
  companyName: string;
  industry: string;
  website: string;
  hqLocation: string;
  companyOverview: string;
};

export type RecruiterHiringPreferences = {
  autoScoreResumes: boolean;
  notifyHighMatch: boolean;
  allowSlotRequests: boolean;
};

export type RecruiterNotificationSettings = {
  dailySummaries: boolean;
  slackAlerts: boolean;
  weeklyReport: boolean;
};

export type RecruiterSettings = {
  companyProfile: RecruiterCompanyProfile;
  hiringPreferences: RecruiterHiringPreferences;
  notifications: RecruiterNotificationSettings;
};
