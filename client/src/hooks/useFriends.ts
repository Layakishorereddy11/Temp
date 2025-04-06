import { useState, useEffect, useCallback } from 'react';
import { Friend, ApplicationStats, ChartData, JobApplication } from '@/types';
import { getFriends, getUserStats } from '@/lib/firebase';
import { format, subDays, parseISO } from 'date-fns';
import { auth } from '@/lib/firebaseShared';
import useWebSocket from './useWebSocket';

// Helper function to generate chart data from stats for friends
function generateChartDataFromStats(stats: ApplicationStats): { 
  applicationChartData: ChartData; 
  streakChartData: ChartData;
} {
  // Default to 14 days of data
  const days = 14;
  const today = new Date();
  
  // Generate labels for the last N days (most recent first)
  const labels = Array.from({ length: days }, (_, i) => {
    return format(subDays(today, days - 1 - i), 'MMM d');
  });
  
  // Generate application chart data
  const applications = Array(days).fill(0);
  
  // Process job applications to populate the data array
  if (stats.appliedJobs && stats.appliedJobs.length > 0) {
    for (const job of stats.appliedJobs) {
      try {
        // Get the date from the job application
        const jobDate = job.date ? parseISO(job.date) : new Date();
        
        // Calculate days difference from today
        const daysDiff = Math.floor((today.getTime() - jobDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // If the application is within our date range, count it
        if (daysDiff >= 0 && daysDiff < days) {
          applications[days - 1 - daysDiff]++;
        }
      } catch (err) {
        console.error('Error processing job date:', err);
      }
    }
  }
  
  // Generate streak chart data
  const streak = Array(days).fill(0);
  let currentStreak = stats.streak || 0;
  
  // Work backwards from today to show streak progression
  for (let i = days - 1; i >= 0; i--) {
    if (i < days - 1) {
      // Decrease streak by 1 for each day going back, but don't go below 0
      if (applications[i + 1] > 0) {
        streak[i] = Math.max(0, streak[i + 1] - 1);
      } else {
        streak[i] = Math.max(0, streak[i + 1]);
      }
    } else {
      // Today's streak
      streak[i] = currentStreak;
    }
  }
  
  // Create chart data objects
  const applicationChartData: ChartData = {
    labels,
    datasets: [
      {
        label: 'Applications',
        data: applications,
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        borderRadius: 4,
        barThickness: 12
      }
    ]
  };
  
  const streakChartData: ChartData = {
    labels,
    datasets: [
      {
        label: 'Streak',
        data: streak,
        backgroundColor: 'rgba(249, 115, 22, 0.2)',
        borderColor: 'rgba(249, 115, 22, 1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true
      }
    ]
  };
  
  return { applicationChartData, streakChartData };
}

interface UseFriendsReturn {
  friends: Friend[];
  selectedFriend: Friend | null;
  selectedFriendStats: ApplicationStats | null;
  loading: boolean;
  error: string | null;
  selectFriend: (friendId: string) => void;
  clearSelectedFriend: () => void;
  refreshFriends: () => Promise<void>;
}

export default function useFriends(userId: string | null): UseFriendsReturn {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [selectedFriendStats, setSelectedFriendStats] = useState<ApplicationStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { lastMessage, sendMessage, connected, socket } = useWebSocket();

  // Function to load friends
  const loadFriends = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const friendsData = await getFriends(userId);
      
      // Process friend data to ensure all required properties are present
      const friendsWithStatus = friendsData.map((friend: Friend) => ({
        ...friend,
        isOnline: friend.isOnline ?? friend.status === 'online',
        email: friend.email || `${friend.displayName?.toLowerCase().replace(/\s/g, '.')}@example.com`
      }));
      
      setFriends(friendsWithStatus);
      setError(null);
    } catch (err) {
      console.error('Error loading friends:', err);
      setError('Failed to load friends');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Load friends on mount and when userId changes
  useEffect(() => {
    loadFriends();
  }, [loadFriends]);
  
  // Listen for WebSocket messages about friend changes
  useEffect(() => {
    if (lastMessage && lastMessage.type === 'FRIEND_ADDED') {
      console.log('Friend added websocket notification received');
      // Refresh the friends list when a friend is added
      loadFriends();
    }
  }, [lastMessage, loadFriends]);

  // Function to select a friend and load their stats
  const selectFriend = useCallback(async (friendId: string) => {
    if (!friendId) {
      setSelectedFriend(null);
      setSelectedFriendStats(null);
      return;
    }
    
    try {
      setLoading(true);
      
      // Find friend in current friends list - check both id and uid fields
      // Some entries might have id while others might have uid
      const friend = friends.find(f => (f.id === friendId || f.uid === friendId));
      
      if (friend) {
        setSelectedFriend(friend);
        
        // If we already have stats from the friends list, use those
        if (friend.stats) {
          setSelectedFriendStats(friend.stats);
        } else {
          // Otherwise, fetch stats - use uid if available, otherwise use id
          const friendUid = friend.uid || friend.id;
          const stats = await getUserStats(friendUid);
          
          // If chart data doesn't exist, create it from the stats
          if (!stats.applicationChartData || !stats.streakChartData) {
            // Get data for charts from the application data if available
            const chartData = generateChartDataFromStats(stats);
            stats.applicationChartData = chartData.applicationChartData;
            stats.streakChartData = chartData.streakChartData;
          }
          
          setSelectedFriendStats(stats);
          
          // Update the friend in the friends list with the new stats
          const updatedFriends = friends.map(f => 
            (f.id === friendId || f.uid === friendId) ? { ...f, stats } : f
          );
          setFriends(updatedFriends);
        }
      } else {
        console.error('Friend not found:', friendId);
        setError('Friend not found');
      }
      
    } catch (err) {
      console.error('Error selecting friend:', err);
      setError('Failed to load friend data');
    } finally {
      setLoading(false);
    }
  }, [friends]);

  // Function to clear selected friend
  const clearSelectedFriend = useCallback(() => {
    setSelectedFriend(null);
    setSelectedFriendStats(null);
  }, []);

  return {
    friends,
    selectedFriend,
    selectedFriendStats,
    loading,
    error,
    selectFriend,
    clearSelectedFriend,
    refreshFriends: loadFriends
  };
}