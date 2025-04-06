import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { 
  doc, 
  getDoc, 
  Timestamp, 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { ApplicationStats, ChartData, JobApplication } from '@/types';

interface UseEnhancedStatsReturn {
  stats: ApplicationStats | null;
  applicationChartData: ChartData | null;
  streakChartData: ChartData | null;
  allTimeChartData: ChartData | null;
  applicationsByMonth: Record<string, number>;
  applicationsByCompany: Record<string, number>;
  applicationsByTag: Record<string, number>;
  responseRateData: { responded: number, pending: number, total: number };
  loading: boolean;
  error: string | null;
  refreshData: (days?: number) => Promise<void>;
}

export default function useEnhancedStats(userId: string | null, initialDays = 30): UseEnhancedStatsReturn {
  const [stats, setStats] = useState<ApplicationStats | null>(null);
  const [applicationChartData, setApplicationChartData] = useState<ChartData | null>(null);
  const [streakChartData, setStreakChartData] = useState<ChartData | null>(null);
  const [allTimeChartData, setAllTimeChartData] = useState<ChartData | null>(null);
  const [applicationsByMonth, setApplicationsByMonth] = useState<Record<string, number>>({});
  const [applicationsByCompany, setApplicationsByCompany] = useState<Record<string, number>>({});
  const [applicationsByTag, setApplicationsByTag] = useState<Record<string, number>>({});
  const [responseRateData, setResponseRateData] = useState<{ responded: number, pending: number, total: number }>({ 
    responded: 0, 
    pending: 0, 
    total: 0 
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<number>(initialDays);

  // Function to fetch user stats from Firestore
  const fetchUserStats = useCallback(async (userId: string, days: number = timeRange) => {
    setLoading(true);
    setError(null);
    
    try {
      const userRef = doc(db, "users", userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        setError("User document not found");
        setLoading(false);
        return;
      }
      
      const userData = userDoc.data();
      const userStats = userData.stats || {};
      
      // Get applications and ensure they're properly initialized
      const appliedJobs = userStats.appliedJobs || [];
      
      // Update stats with correct total applications count from database
      // Create a copy of userStats object with correct totalApplications count
      const updatedStats = {
        ...userStats,
        totalApplications: appliedJobs.length
      };
      
      // Set the stats with the correct values
      setStats(updatedStats);
      
      // Generate all chart data
      generateApplicationChartData(appliedJobs, days);
      generateStreakChartData(appliedJobs, userStats.streak || 0, days);
      generateAllTimeChartData(appliedJobs);
      analyzeApplications(appliedJobs);
      
      setLoading(false);
    } catch (err) {
      console.error("Error fetching enhanced stats:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch user stats");
      setLoading(false);
    }
  }, [timeRange]);
  
  // Function to generate applications per day chart data
  const generateApplicationChartData = (applications: JobApplication[], days: number) => {
    // Generate dates for the past N days
    const dates: string[] = [];
    const labels: string[] = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      dates.push(dateString);
      
      // Format date for display (e.g., "Mon 12")
      const options: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric' };
      labels.push(date.toLocaleDateString('en-US', options));
    }
    
    // Count applications per day
    const counts = dates.map(date => {
      return applications.filter(job => job.date === date).length;
    });
    
    // Determine the maximum value for better y-axis scaling
    const maxValue = Math.max(...counts, 1);
    const yAxisMax = Math.ceil(maxValue * 1.2); // Add 20% headroom
    
    // Calculate moving average for trendline (7-day)
    const movingAverage: (number | null)[] = [];
    const windowSize = Math.min(7, counts.length);
    
    for (let i = 0; i < counts.length; i++) {
      if (i < windowSize - 1) {
        // Not enough previous data points
        movingAverage.push(null);
      } else {
        // Calculate average of last windowSize points
        let sum = 0;
        for (let j = 0; j < windowSize; j++) {
          sum += counts[i - j];
        }
        movingAverage.push(sum / windowSize);
      }
    }
    
    const chartData: ChartData = {
      labels,
      datasets: [
        {
          label: 'Applications',
          data: counts,
          backgroundColor: 'rgba(99, 102, 241, 0.5)',
          borderColor: 'rgb(99, 102, 241)',
          borderWidth: 1,
          borderRadius: 4,
          barThickness: 16
        },
        {
          label: 'Trend (7-day avg)',
          data: movingAverage,
          backgroundColor: 'rgba(0, 0, 0, 0)', // Transparent
          borderColor: 'rgba(239, 68, 68, 0.7)', // Red
          borderWidth: 2,
          borderDash: [5, 5]
          // Note: type, tension, and pointRadius will be added by Chart.js
        }
      ]
    };
    
    setApplicationChartData(chartData);
  };
  
  // Function to generate streak progression chart
  const generateStreakChartData = (applications: JobApplication[], currentStreak: number, days: number) => {
    // We need to reconstruct the streak history
    // For this, we need to identify consecutive days with applications
    
    // First, sort applications by date (oldest first)
    const sortedApps = [...applications].sort((a, b) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
    
    // Get unique dates with applications
    const datesWithApps = new Set<string>();
    sortedApps.forEach(app => datesWithApps.add(app.date));
    
    // Create an array of dates from the oldest application to today
    const allDates: string[] = [];
    if (sortedApps.length > 0) {
      const startDate = new Date(sortedApps[0].date);
      const endDate = new Date();
      
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        allDates.push(d.toISOString().split('T')[0]);
      }
    }
    
    // Calculate streak at each date
    let streakByDate: Record<string, number> = {};
    let currentCalcStreak = 0;
    
    for (let i = 0; i < allDates.length; i++) {
      const date = allDates[i];
      
      if (datesWithApps.has(date)) {
        // If this date has applications, increment the streak
        currentCalcStreak++;
      } else if (i > 0) {
        // If no applications today, check if yesterday had applications
        const yesterday = allDates[i - 1];
        if (!datesWithApps.has(yesterday)) {
          // If yesterday also had no applications, reset streak
          currentCalcStreak = 0;
        }
        // If yesterday had applications but today doesn't, keep the streak
      }
      
      streakByDate[date] = currentCalcStreak;
    }
    
    // Limit to the last N days
    const today = new Date();
    const limitedDates: string[] = [];
    const limitedLabels: string[] = [];
    const limitedStreaks: number[] = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      
      limitedDates.push(dateString);
      
      // Format date for display
      const options: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric' };
      limitedLabels.push(date.toLocaleDateString('en-US', options));
      
      // Get streak for this date
      limitedStreaks.push(streakByDate[dateString] || 0);
    }
    
    const chartData: ChartData = {
      labels: limitedLabels,
      datasets: [
        {
          label: 'Streak',
          data: limitedStreaks,
          backgroundColor: 'rgba(99, 102, 241, 0.2)',
          borderColor: 'rgb(99, 102, 241)',
          borderWidth: 2
          // Note: tension and fill will be added in the EnhancedChartComponent
        }
      ]
    };
    
    setStreakChartData(chartData);
  };
  
  // Function to generate all time applications chart (by month)
  const generateAllTimeChartData = (applications: JobApplication[]) => {
    // Group applications by month
    const appsByMonth: Record<string, number> = {};
    
    applications.forEach(app => {
      const date = new Date(app.date);
      const monthYear = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      if (!appsByMonth[monthYear]) {
        appsByMonth[monthYear] = 0;
      }
      
      appsByMonth[monthYear]++;
    });
    
    // Convert to arrays for chart
    const months = Object.keys(appsByMonth);
    const counts = Object.values(appsByMonth);
    
    const chartData: ChartData = {
      labels: months,
      datasets: [
        {
          label: 'Applications',
          data: counts,
          backgroundColor: 'rgba(99, 102, 241, 0.5)',
          borderColor: 'rgb(99, 102, 241)',
          borderWidth: 1,
          borderRadius: 4,
          barThickness: 24
        }
      ]
    };
    
    setAllTimeChartData(chartData);
  };
  
  // Function to analyze applications by various dimensions
  const analyzeApplications = (applications: JobApplication[]) => {
    // Applications by month
    const byMonth: Record<string, number> = {};
    
    // Applications by company
    const byCompany: Record<string, number> = {};
    
    // Applications by tag
    const byTag: Record<string, number> = {};
    
    // Response data
    let responded = 0;
    let pending = 0;
    
    applications.forEach(app => {
      // By month
      const date = new Date(app.date);
      const monthYear = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      if (!byMonth[monthYear]) {
        byMonth[monthYear] = 0;
      }
      byMonth[monthYear]++;
      
      // By company
      if (app.company) {
        if (!byCompany[app.company]) {
          byCompany[app.company] = 0;
        }
        byCompany[app.company]++;
      }
      
      // By tag
      if (app.tags && app.tags.length > 0) {
        app.tags.forEach(tag => {
          if (!byTag[tag]) {
            byTag[tag] = 0;
          }
          byTag[tag]++;
        });
      }
      
      // Response data
      if (app.status && ['interviewing', 'rejected', 'offer', 'accepted'].includes(app.status)) {
        responded++;
      } else {
        pending++;
      }
    });
    
    // Sort companies by application count (descending)
    const sortedCompanies = Object.fromEntries(
      Object.entries(byCompany).sort(([,a], [,b]) => b - a)
    );
    
    // Sort tags by application count (descending)
    const sortedTags = Object.fromEntries(
      Object.entries(byTag).sort(([,a], [,b]) => b - a)
    );
    
    setApplicationsByMonth(byMonth);
    setApplicationsByCompany(sortedCompanies);
    setApplicationsByTag(sortedTags);
    setResponseRateData({
      responded,
      pending,
      total: applications.length
    });
  };

  // Function to refresh data with a specific time range
  const refreshData = useCallback(async (days?: number) => {
    if (userId) {
      if (days !== undefined && days !== timeRange) {
        setTimeRange(days);
      }
      await fetchUserStats(userId, days || timeRange);
    }
  }, [userId, fetchUserStats, timeRange]);

  // Initial data fetch
  useEffect(() => {
    if (userId) {
      fetchUserStats(userId);
    } else {
      setLoading(false);
    }
  }, [userId, fetchUserStats]);

  return {
    stats,
    applicationChartData,
    streakChartData,
    allTimeChartData,
    applicationsByMonth,
    applicationsByCompany,
    applicationsByTag,
    responseRateData,
    loading,
    error,
    refreshData
  };
}