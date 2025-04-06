import { useState, useEffect } from 'react';
import { 
  getUserStats, 
  updateUserStats, 
  trackApplication, 
  getApplicationsChartData,
  getRecentApplications,
  getLeaderboard
} from '@/lib/firebase';
import { ApplicationStats, ChartData, JobApplication, LeaderboardEntry } from '@/types';

export default function useApplicationStats(userId: string | null) {
  const [stats, setStats] = useState<ApplicationStats | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [recentApplications, setRecentApplications] = useState<JobApplication[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // Fetch user stats
  const fetchStats = async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const userStats = await getUserStats(userId);
      setStats(userStats);
      
      // Get chart data for the last 7 days
      const chartData = await getApplicationsChartData(userId, 7);
      setChartData(chartData);
      
      // Get recent applications
      const applications = await getRecentApplications(userId, 5);
      setRecentApplications(applications);
      
      // Get leaderboard
      const leaderboardData = await getLeaderboard(userId);
      setLeaderboard(leaderboardData);
      
      // Set last updated time
      setLastUpdated(new Date().toLocaleString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }));
      
      setLoading(false);
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  };

  // Track a new job application
  const addApplication = async (application: Partial<JobApplication>) => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Create job application object
      const newApplication = {
        url: application.url || window.location.href,
        title: application.title || document.title,
        date: new Date().toISOString().split('T')[0],
        ...application
      };
      
      // Track the application
      const updatedStats = await trackApplication(userId, newApplication);
      setStats(updatedStats);
      
      // Refresh data
      await fetchStats();
      
      setLoading(false);
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  };

  // Load data when userId changes
  useEffect(() => {
    if (userId) {
      fetchStats();
    } else {
      setStats(null);
      setChartData(null);
      setRecentApplications([]);
      setLeaderboard([]);
      setLoading(false);
    }
  }, [userId]);

  // Refresh data function
  const refreshData = () => fetchStats();

  return {
    stats,
    chartData,
    recentApplications,
    leaderboard,
    loading,
    error,
    lastUpdated,
    addApplication,
    refreshData
  };
}
