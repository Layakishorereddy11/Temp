import { useState, useEffect } from 'react';
import { getFriends, getUserStats } from '@/lib/firebase';
import { Friend, ApplicationStats } from '@/types';

export default function useFriends(userId: string | null) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [selectedFriendStats, setSelectedFriendStats] = useState<ApplicationStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch friends list
  const fetchFriends = async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const friendsData = await getFriends(userId);
      
      // Add some random online status for UI
      const friendsWithStatus = friendsData.map((friend: Friend) => ({
        ...friend,
        isOnline: Math.random() > 0.5
      }));
      
      setFriends(friendsWithStatus);
      setLoading(false);
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  };

  // Select a friend to view their stats
  const selectFriend = async (friendId: string) => {
    const friend = friends.find(f => f.id === friendId);
    if (!friend) return;
    
    setSelectedFriend(friend);
    setLoading(true);
    
    try {
      const stats = await getUserStats(friendId);
      setSelectedFriendStats(stats);
      setLoading(false);
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  };

  // Clear selected friend
  const clearSelectedFriend = () => {
    setSelectedFriend(null);
    setSelectedFriendStats(null);
  };

  // Load friends when userId changes
  useEffect(() => {
    if (userId) {
      fetchFriends();
    } else {
      setFriends([]);
      setSelectedFriend(null);
      setSelectedFriendStats(null);
      setLoading(false);
    }
  }, [userId]);

  return {
    friends,
    selectedFriend,
    selectedFriendStats,
    loading,
    error,
    selectFriend,
    clearSelectedFriend,
    refreshFriends: fetchFriends
  };
}
