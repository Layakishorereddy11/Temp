import { useState, useEffect, useCallback } from 'react';
import { Friend, ApplicationStats } from '@/types';
import { getFriends, getUserStats } from '@/lib/firebase';

interface UseFriendsReturn {
  friends: Friend[];
  selectedFriend: Friend | null;
  selectedFriendStats: ApplicationStats | null;
  loading: boolean;
  error: string | null;
  selectFriend: (friendId: string) => void;
  clearSelectedFriend: () => void;
}

export default function useFriends(userId: string | null): UseFriendsReturn {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [selectedFriendStats, setSelectedFriendStats] = useState<ApplicationStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Function to load friends
  const loadFriends = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const friendsData = await getFriends(userId);
      
      // Add online status for UI (this would be real data in production)
      const friendsWithStatus = friendsData.map((friend: Friend) => ({
        ...friend,
        isOnline: Math.random() > 0.5 // Simulate online status for demo
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

  // Function to select a friend and load their stats
  const selectFriend = useCallback(async (friendId: string) => {
    if (!friendId) {
      setSelectedFriend(null);
      setSelectedFriendStats(null);
      return;
    }
    
    try {
      setLoading(true);
      
      // Find friend in current friends list
      const friend = friends.find(f => f.id === friendId);
      
      if (friend) {
        setSelectedFriend(friend);
        
        // If we already have stats from the friends list, use those
        if (friend.stats) {
          setSelectedFriendStats(friend.stats);
        } else {
          // Otherwise, fetch stats
          const stats = await getUserStats(friendId);
          setSelectedFriendStats(stats);
          
          // Update the friend in the friends list with the new stats
          const updatedFriends = friends.map(f => 
            f.id === friendId ? { ...f, stats } : f
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
    clearSelectedFriend
  };
}