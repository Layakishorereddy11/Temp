import { User } from '@/types';
import { Button } from "@/components/ui/button";
import FriendsList from '@/components/FriendsList';

interface SidebarProps {
  user: User | null;
  onSignOut: () => Promise<void>;
  onSelectFriend: (friendId: string) => void;
  selectedFriendId: string | null;
  className?: string;
}

export default function Sidebar({
  user,
  onSignOut,
  onSelectFriend,
  selectedFriendId,
  className = ""
}: SidebarProps) {
  const avatarUrl = user?.photoURL || 'https://api.dicebear.com/7.x/initials/svg?seed=' + user?.displayName;
  
  return (
    <aside className={`w-64 bg-dark-800 text-white flex flex-col z-10 hidden md:flex ${className}`}>
      {/* Sidebar Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center">
          <svg className="h-8 w-8 mr-2 text-primary-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
            <polyline points="7.5 4.21 12 6.81 16.5 4.21"></polyline>
            <polyline points="7.5 19.79 7.5 14.6 3 12"></polyline>
            <polyline points="21 12 16.5 14.6 16.5 19.79"></polyline>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
            <line x1="12" y1="22.08" x2="12" y2="12"></line>
          </svg>
          <h1 className="text-xl font-bold">Jobs Streak</h1>
        </div>
      </div>
      
      {/* User Profile */}
      {user && (
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center">
            <img 
              src={avatarUrl} 
              alt={user.displayName || 'User'} 
              className="h-10 w-10 rounded-full mr-3"
            />
            <div>
              <h2 className="font-medium text-sm">{user.displayName || 'User'}</h2>
              <p className="text-xs text-gray-400">{user.email}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Navigation */}
      <nav className="p-4 border-b border-gray-800">
        <h3 className="text-xs uppercase text-gray-500 font-semibold mb-3">Navigation</h3>
        <ul className="space-y-2">
          <li>
            <a href="/" className="flex items-center px-2 py-2 text-sm font-medium rounded-md bg-gray-700 text-white">
              <svg className="mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Dashboard
            </a>
          </li>
          <li>
            <a href="#" className="flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-300 hover:bg-gray-700 hover:text-white">
              <svg className="mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Applications
            </a>
          </li>
          <li>
            <a href="#" className="flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-300 hover:bg-gray-700 hover:text-white">
              <svg className="mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Profile
            </a>
          </li>
          <li>
            <a href="#" className="flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-300 hover:bg-gray-700 hover:text-white">
              <svg className="mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </a>
          </li>
        </ul>
      </nav>
      
      {/* Friends List */}
      <div className="p-4 flex-grow overflow-y-auto">
        <FriendsList 
          onSelectFriend={onSelectFriend}
          selectedFriendId={selectedFriendId}
        />
      </div>
      
      {/* Logout Button */}
      <div className="p-4 border-t border-gray-800">
        <Button 
          onClick={onSignOut}
          variant="ghost" 
          className="w-full flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-300 hover:bg-gray-700 hover:text-white"
        >
          <svg className="mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </Button>
      </div>
    </aside>
  );
}
