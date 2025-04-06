import { Timestamp } from "firebase/firestore";

// Application tracking types
export interface JobApplication {
  url: string;
  title: string;
  company?: string;
  date: string;
  timestamp: Timestamp;
  lastTracked: boolean;
  notes?: string;
  tags?: string[];
  status?: 'applied' | 'interviewing' | 'rejected' | 'offer' | 'accepted';
}

export interface ApplicationStats {
  todayCount: number;
  streak: number;
  lastUpdated: string;
  appliedJobs: JobApplication[];
  totalResponses?: number;
  responseRate?: number;
}

// Chart data type
export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string;
    borderColor: string;
    borderWidth: number;
    borderRadius?: number;
    barThickness?: number;
  }[];
}

// Social features types
export interface Friend {
  id: string;
  displayName: string;
  email: string;
  photoURL?: string;
  stats?: ApplicationStats;
  isOnline?: boolean;
  lastActive?: Timestamp;
}

export interface LeaderboardEntry {
  id: string;
  displayName: string;
  photoURL?: string;
  isCurrentUser: boolean;
  streak: number;
  todayCount: number;
  totalApplications: number;
}

// Extension integration types
export interface ExtensionMessage {
  action: string;
  data?: any;
}

export interface ExtensionStorageData {
  userId?: string;
  stats?: any;
  user?: any;
  settings?: any;
}