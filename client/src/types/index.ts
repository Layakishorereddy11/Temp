// Firebase User interface
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

// Job Application interface
export interface JobApplication {
  id: string;
  title: string;
  company: string;
  url: string;
  date: string; // YYYY-MM-DD format
  status: 'applied' | 'interviewing' | 'rejected' | 'offer' | 'accepted';
  notes?: string;
  tags?: string[];
  salary?: number | string;
  location?: string;
  replied?: boolean;
  updatedAt?: string;
}

// Application Statistics interface
export interface ApplicationStats {
  totalApplications: number;
  weeklyApplications: number;
  monthlyApplications: number;
  streak: number;
  maxStreak: number;
  responseRate: number;
  lastUpdate: string;
  appliedJobs: JobApplication[];
  // Chart data for visualizations
  applicationChartData?: ChartData;
  streakChartData?: ChartData;
  allTimeChartData?: ChartData;
}

// Friend interface
export interface Friend {
  id: string;
  displayName: string;
  photoURL: string | null;
  totalApplications: number;
  streak: number;
  email?: string;
  status?: 'online' | 'offline';
  lastActive?: string;
  isOnline?: boolean;
  stats?: ApplicationStats;
}

// Leaderboard Entry interface
export interface LeaderboardEntry {
  id: string;
  displayName: string;
  photoURL: string | null;
  isCurrentUser: boolean;
  streak: number;
  todayCount: number;
  totalApplications: number;
}

// Chart Data interface
export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: (number | null)[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
    borderRadius?: number;
    barThickness?: number;
    fill?: boolean;
    tension?: number;
    type?: string;
    pointRadius?: number;
    borderDash?: number[];
  }[];
}