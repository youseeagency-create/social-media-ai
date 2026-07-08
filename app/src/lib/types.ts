import type {
  User,
  Workspace,
  WorkspaceClient,
  InspirationItem,
  Note,
  Footage,
  Analysis,
  CalendarItem,
  Message,
  AdminNote,
  NotificationRead,
} from "./schema";

export type { User, Workspace, WorkspaceClient, InspirationItem, Note, Footage, Analysis, CalendarItem, Message, AdminNote, NotificationRead };

// A chat message joined with its sender's display name/role (null if the sender
// account was deleted). Safe to import from client components (type-only).
export type ChatMessage = Message & { senderName: string | null; senderRole: UserRole | null };

export interface Config {
  id: string;
  configName: string;
  creatorsCategory: string;
  analysisInstruction: string;
  newConceptsInstruction: string;
}

export interface Creator {
  id: string;
  username: string;
  category: string;
  profilePicUrl: string;
  followers: number;
  reelsCount30d: number;
  avgViews30d: number;
  lastScrapedAt: string;
}

export interface Video {
  id: string;
  link: string;
  thumbnail: string;
  creator: string;
  views: number;
  likes: number;
  comments: number;
  analysis: string;
  newConcepts: string;
  datePosted: string;
  dateAdded: string;
  configName: string;
  starred: boolean;
}

export type UserRole = "admin" | "client";

export type PublicUser = Omit<User, "passwordHash" | "passwordSalt">;

export interface SessionPayload {
  userId: string;
  role: UserRole;
  exp: number;
}

export interface PipelineParams {
  configName: string;
  maxVideos: number;
  topK: number;
  nDays: number;
}

export interface ActiveTask {
  id: string;
  creator: string;
  step: string;
  views?: number;
}

export interface PipelineProgress {
  status: "idle" | "running" | "completed" | "error";
  phase: "scraping" | "analyzing" | "done";
  activeTasks: ActiveTask[];
  creatorsCompleted: number;
  creatorsTotal: number;
  creatorsScraped: number;
  videosAnalyzed: number;
  videosTotal: number;
  errors: string[];
  log: string[];
}
