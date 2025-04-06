import { Timestamp } from "firebase/firestore";

export interface User {
  uid: string;
  displayName?: string | null;
  email?: string | null;
  photoURL?: string | null;
  createdAt?: Timestamp;
}

export interface ApplicationStats {
  todayCount: number;
  streak: number;
  lastUpdated: string;
  appliedJobs: JobApplication[];
  totalResponses?: number;
  responseRate?: number;
}

export interface JobApplication {
  url: string;
  title: string;
  date: string;
  timestamp: Timestamp;
  lastTracked: boolean;
  tags?: string[];
  company?: string;
  notes?: string;
}

export interface Friend {
  id: string;
  displayName?: string | null;
  email?: string | null;
  photoURL?: string | null;
  stats?: ApplicationStats;
  isOnline?: boolean;
}

export interface LeaderboardEntry {
  id: string;
  displayName?: string | null;
  photoURL?: string | null;
  isCurrentUser: boolean;
  streak: number;
  todayCount: number;
  totalApplications: number;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string;
    borderColor: string;
    borderWidth: number;
    borderRadius: number;
    barThickness: number;
  }[];
}
