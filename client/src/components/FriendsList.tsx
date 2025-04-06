import { useState, useEffect } from 'react';
import { Friend } from '@/types';
import { getFriends, removeFriend } from '@/lib/firebase';
import { auth } from '@/lib/firebase';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import AddFriendDialog from './AddFriendDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Plus, UserPlus, UserX } from 'lucide-react';

interface FriendsListProps {
  onSelectFriend: (friendId: string) => void;
  selectedFriendId: string | null;
}

export default function FriendsList({ onSelectFriend, selectedFriendId }: FriendsListProps) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [addFriendOpen, setAddFriendOpen] = useState<boolean>(false);
  const { toast } = useToast();

  const loadFriends = async () => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;
    
    try {
      setLoading(true);
      const friendsData = await getFriends(userId);
      
      // Add online status for UI (this would be real data in production)
      const friendsWithStatus = friendsData.map((friend: Friend) => ({
        ...friend,
        isOnline: Math.random() > 0.5,
        stats: {
          ...friend.stats,
          streak: friend.stats?.streak || Math.floor(Math.random() * 30) // Fallback for demo
        }
      }));
      
      setFriends(friendsWithStatus);
    } catch (error) {
      console.error('Error loading friends:', error);
      toast({
        title: "Error",
        description: "Failed to load friends list",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFriends();
  }, []);

  const handleRemoveFriend = async (friendId: string) => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;
    
    try {
      await removeFriend(userId, friendId);
      
      // Update the friends list
      setFriends(prevFriends => prevFriends.filter(friend => friend.id !== friendId));
      
      if (selectedFriendId === friendId) {
        onSelectFriend('');
      }
      
      toast({
        title: "Friend removed",
        description: "The friend has been removed from your list",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove friend",
        variant: "destructive",
      });
    }
  };

  // If no real friends, use demo friends
  const demoFriends: Friend[] = [
    {
      id: 'friend1',
      displayName: 'Sarah Johnson',
      photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      isOnline: true,
      stats: {
        streak: 21,
        todayCount: 24,
        lastUpdated: new Date().toISOString().split('T')[0],
        appliedJobs: []
      }
    },
    {
      id: 'friend2',
      displayName: 'Michael Chen',
      photoURL: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      isOnline: true,
      stats: {
        streak: 12,
        todayCount: 18,
        lastUpdated: new Date().toISOString().split('T')[0],
        appliedJobs: []
      }
    },
    {
      id: 'friend3',
      displayName: 'Jessica Wilson',
      photoURL: 'https://images.unsplash.com/photo-1550525811-e5869dd03032?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      isOnline: false,
      stats: {
        streak: 8,
        todayCount: 12,
        lastUpdated: new Date().toISOString().split('T')[0],
        appliedJobs: []
      }
    },
    {
      id: 'friend4',
      displayName: 'David Thompson',
      photoURL: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      isOnline: true,
      stats: {
        streak: 4,
        todayCount: 8,
        lastUpdated: new Date().toISOString().split('T')[0],
        appliedJobs: []
      }
    }
  ];

  // Use demo friends until real friends are loaded or if there are no friends
  const displayFriends = friends.length > 0 ? friends : demoFriends;

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-xs uppercase text-gray-500 font-semibold">Friends</h3>
        <Button 
          size="sm" 
          variant="ghost" 
          className="h-8 w-8 p-0 text-primary-300 hover:text-primary-200"
          onClick={() => setAddFriendOpen(true)}
        >
          <UserPlus className="h-4 w-4" />
        </Button>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-4">
          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : (
        <>
          {displayFriends.length === 0 ? (
            <div className="py-4 text-center">
              <p className="text-sm text-gray-400">No friends yet</p>
              <Button 
                size="sm" 
                variant="outline" 
                className="mt-2"
                onClick={() => setAddFriendOpen(true)}
              >
                <Plus className="mr-1 h-4 w-4" /> Add Friends
              </Button>
            </div>
          ) : (
            <ul className="space-y-2">
              {displayFriends.map((friend) => (
                <li key={friend.id} className="group">
                  <div className="flex items-center">
                    <button 
                      className={`flex-grow flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                        selectedFriendId === friend.id 
                          ? 'bg-gray-700 text-white' 
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }`}
                      onClick={() => onSelectFriend(friend.id)}
                    >
                      <div className="relative">
                        <img 
                          src={friend.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${friend.displayName}`} 
                          alt={friend.displayName || "Friend"} 
                          className="h-6 w-6 rounded-full mr-3"
                        />
                        {friend.isOnline && (
                          <span 
                            className={`absolute bottom-0 right-2 block h-2 w-2 rounded-full ring-2 ${
                              selectedFriendId === friend.id ? 'ring-gray-700' : 'ring-gray-800'
                            } bg-green-400`}
                          ></span>
                        )}
                      </div>
                      <span className="truncate">{friend.displayName}</span>
                      <span className={`ml-auto text-xs ${
                        friend.stats?.streak && friend.stats.streak > 5 
                          ? 'bg-primary-500 text-white' 
                          : 'bg-gray-700 text-white'
                      } px-1.5 py-0.5 rounded-full`}>
                        {friend.stats?.streak || 0} 🔥
                      </span>
                    </button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          className="ml-1 p-0 h-8 w-8 opacity-0 group-hover:opacity-100"
                        >
                          <MoreHorizontal className="h-4 w-4 text-gray-400" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => handleRemoveFriend(friend.id)}>
                          <UserX className="mr-2 h-4 w-4" />
                          <span>Remove</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {/* Add Friend Dialog */}
      <AddFriendDialog 
        userId={auth.currentUser?.uid || null} 
        open={addFriendOpen}
        onOpenChange={setAddFriendOpen}
        onFriendAdded={loadFriends}
      />
    </div>
  );
}
