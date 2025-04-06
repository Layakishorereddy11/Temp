import { Friend, ApplicationStats } from '@/types';

interface FriendViewProps {
  friend: Friend | null;
  stats: ApplicationStats | null;
  onClose: () => void;
  loading?: boolean;
}

export default function FriendView({ friend, stats, onClose, loading = false }: FriendViewProps) {
  if (!friend) return null;

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4 mb-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="h-12 w-12 rounded-full bg-gray-200 mr-4"></div>
            <div>
              <div className="h-5 bg-gray-200 rounded w-32 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-48"></div>
            </div>
          </div>
          
          <div className="flex items-center">
            <div className="h-8 bg-gray-200 rounded w-24 mr-4"></div>
            <button 
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <svg className="h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <img 
            src={friend.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${friend.displayName}`}
            alt={friend.displayName || 'Friend'} 
            className="h-12 w-12 rounded-full mr-4"
          />
          <div>
            <h3 className="text-lg font-semibold">{friend.displayName}</h3>
            <p className="text-sm text-gray-500">{friend.email}</p>
          </div>
        </div>
        
        <div className="flex items-center">
          <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800 mr-4">
            <span>{stats?.streak || 0}</span> Day Streak 🔥
          </span>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <svg className="h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
