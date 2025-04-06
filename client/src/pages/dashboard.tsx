import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import useFirebaseAuth from '@/hooks/useFirebaseAuth';
import useApplicationStats from '@/hooks/useApplicationStats';
import useFriends from '@/hooks/useFriends';
import Sidebar from '@/components/Sidebar';
import StatsCards from '@/components/StatsCards';
import ChartComponent from '@/components/ChartComponent';
import LeaderboardTable from '@/components/LeaderboardTable';
import RecentApplications from '@/components/RecentApplications';
import FriendView from '@/components/FriendView';
import DemoDataButton from '@/components/DemoDataButton';

export default function Dashboard() {
  const { user, loading: authLoading, signOut } = useFirebaseAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  
  // Fetch application stats
  const { 
    stats, 
    chartData, 
    recentApplications, 
    leaderboard,
    loading: statsLoading, 
    error: statsError,
    lastUpdated,
    addApplication
  } = useApplicationStats(user?.uid || null);
  
  // Fetch friends data
  const { 
    friends, 
    selectedFriend, 
    selectedFriendStats,
    loading: friendsLoading,
    selectFriend,
    clearSelectedFriend
  } = useFriends(user?.uid || null);

  // Handle errors
  useEffect(() => {
    if (statsError) {
      toast({
        title: "Error",
        description: statsError,
        variant: "destructive",
      });
    }
  }, [statsError, toast]);

  // Redirect to onboarding if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      setLocation('/onboarding');
    }
  }, [user, authLoading, setLocation]);

  // Handle friend selection
  const handleSelectFriend = (friendId: string) => {
    setSelectedFriendId(friendId);
    selectFriend(friendId);
  };

  // Handle track application button click
  const handleTrackApplication = async () => {
    try {
      await addApplication({
        title: "New Job Application",
        url: window.location.href,
        date: new Date().toISOString().split('T')[0]
      });
      
      toast({
        title: "Application Tracked",
        description: "Your job application has been successfully tracked!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to track application. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to onboarding
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar 
        user={user}
        onSignOut={signOut}
        onSelectFriend={handleSelectFriend}
        selectedFriendId={selectedFriendId}
      />
      
      {/* Mobile Sidebar Toggle */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-gray-200 flex">
        <button className="flex-1 p-2 text-center text-xs text-primary-500">
          <svg className="h-6 w-6 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Dashboard
        </button>
        <button className="flex-1 p-2 text-center text-xs text-gray-500">
          <svg className="h-6 w-6 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Applications
        </button>
        <button className="flex-1 p-2 text-center text-xs text-gray-500">
          <svg className="h-6 w-6 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          Friends
        </button>
        <button className="flex-1 p-2 text-center text-xs text-gray-500">
          <svg className="h-6 w-6 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Profile
        </button>
      </div>
      
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-gray-50 focus:outline-none p-4 md:p-6">
        {/* Header with mobile menu button */}
        <div className="px-2 mb-6 flex items-center justify-between md:hidden">
          <button 
            type="button" 
            className="p-2 rounded-md inline-flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            <span className="sr-only">Open menu</span>
            <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          <div className="flex items-center">
            <svg className="h-8 w-8 text-primary-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              <polyline points="7.5 4.21 12 6.81 16.5 4.21"></polyline>
              <polyline points="7.5 19.79 7.5 14.6 3 12"></polyline>
              <polyline points="21 12 16.5 14.6 16.5 19.79"></polyline>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
              <line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>
            <h1 className="text-xl font-bold">Jobs Streak</h1>
          </div>
          
          <div className="flex items-center">
            <img 
              src={user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${user.displayName}`} 
              alt={user.displayName || 'User'} 
              className="h-8 w-8 rounded-full" 
            />
          </div>
        </div>
        
        {/* Dashboard header */}
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Dashboard
            </h2>
            <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Last updated: <span id="last-updated" className="ml-1">{lastUpdated || 'Today'}</span>
              </div>
            </div>
          </div>
          
          <div className="mt-5 flex lg:mt-0 lg:ml-4">
            <span>
              <DemoDataButton 
                onSuccess={() => {
                  // Refresh data after demo data is generated
                  setTimeout(() => {
                    window.location.reload();
                  }, 1000);
                }}
              />
            </span>
            
            <span className="hidden sm:block ml-3">
              <a 
                href="#" 
                onClick={() => window.open('popup.html', '_blank')} 
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Open Popup
              </a>
            </span>
            
            <span className="sm:ml-3">
              <Button 
                onClick={handleTrackApplication}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Track New Application
              </Button>
            </span>
          </div>
        </div>
        
        {/* Friends view toggle */}
        {selectedFriend && (
          <FriendView 
            friend={selectedFriend}
            stats={selectedFriendStats}
            onClose={clearSelectedFriend}
            loading={friendsLoading}
          />
        )}
        
        {/* Stats Grid */}
        <StatsCards stats={stats} loading={statsLoading} />
        
        {/* Charts Row */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Daily Applications Chart */}
          <ChartComponent 
            data={chartData} 
            title="Daily Applications" 
            loading={statsLoading}
          />
          
          {/* Leaderboard */}
          <LeaderboardTable 
            entries={leaderboard} 
            loading={statsLoading} 
          />
        </div>
        
        {/* Recent Applications */}
        <RecentApplications 
          applications={recentApplications}
          loading={statsLoading}
        />
      </main>
    </div>
  );
}
