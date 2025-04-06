import { useState, useEffect, useCallback } from 'react';
import { 
  getUserStats, 
  getApplicationsChartData, 
  getRecentApplications, 
  getLeaderboard,
  trackApplication
} from '@/lib/firebase';
import { ApplicationStats, ChartData, JobApplication, LeaderboardEntry } from '@/types';

interface UseApplicationStatsReturn {
  stats: ApplicationStats | null;
  chartData: ChartData | null;
  recentApplications: JobApplication[];
  leaderboard: LeaderboardEntry[];
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
  addApplication: (application: Partial<JobApplication>) => Promise<void>;
}

export default function useApplicationStats(userId: string | null): UseApplicationStatsReturn {
  const [stats, setStats] = useState<ApplicationStats | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [recentApplications, setRecentApplications] = useState<JobApplication[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Function to load all application stats
  const loadStats = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Load user stats
      const stats = await getUserStats(userId);
      setStats(stats);
      
      if (stats?.lastUpdated) {
        // Format lastUpdated to a readable format
        const date = new Date(stats.lastUpdated);
        const options: Intl.DateTimeFormatOptions = {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        };
        setLastUpdated(date.toLocaleDateString('en-US', options));
      }
      
      // Load chart data for applications over time
      const chartData = await getApplicationsChartData(userId);
      setChartData(chartData);
      
      // Load recent applications
      const recentApps = await getRecentApplications(userId);
      setRecentApplications(recentApps);
      
      // Load leaderboard data
      const leaderboardData = await getLeaderboard(userId);
      setLeaderboard(leaderboardData);
      
      setError(null);
    } catch (err) {
      console.error('Error loading application stats:', err);
      setError('Failed to load application stats');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Load stats on mount and when userId changes
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Function to add a new application
  const addApplication = async (application: Partial<JobApplication>): Promise<void> => {
    if (!userId) return;
    
    try {
      const result = await trackApplication(userId, application);
      
      if (result.success) {
        // Update local state with the new stats
        setStats(result.stats);
        
        // Reload all data to ensure consistency
        loadStats();
      }
    } catch (err) {
      console.error('Error adding application:', err);
      throw err;
    }
  };

  return {
    stats,
    chartData,
    recentApplications,
    leaderboard,
    loading,
    error,
    lastUpdated,
    addApplication
  };
}