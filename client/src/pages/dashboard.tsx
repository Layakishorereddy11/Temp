import { useState } from 'react';
import { Redirect } from 'wouter';
import useFirebaseAuth from '@/hooks/useFirebaseAuth';
import useEnhancedStats from '@/hooks/useEnhancedStats';
import useFriends from '@/hooks/useFriends';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Sidebar from '@/components/Sidebar';
import StatsCards from '@/components/StatsCards';
import EnhancedChartComponent from '@/components/EnhancedChartComponent';
import RecentApplications from '@/components/RecentApplications';
import LeaderboardTable from '@/components/LeaderboardTable';
import FriendDashboard from '@/components/FriendDashboard';
import { PieChart, Share2, Trophy } from 'lucide-react';

export default function DashboardPage() {
  const { user, loading: authLoading, signOut } = useFirebaseAuth();
  const [timeRange, setTimeRange] = useState(14);
  
  // Only fetch if user is logged in
  const {
    stats,
    applicationChartData,
    streakChartData,
    responseRateData,
    loading: statsLoading,
    refreshData
  } = useEnhancedStats(user ? user.uid : null, timeRange);
  
  const {
    friends,
    selectedFriend,
    selectedFriendStats,
    loading: friendsLoading,
    selectFriend,
    clearSelectedFriend
  } = useFriends(user ? user.uid : null);
  
  const handleTimeRangeChange = (days: number) => {
    setTimeRange(days);
    refreshData(days);
  };
  
  // Redirect to onboarding if not authenticated
  if (!user && !authLoading) {
    return <Redirect to="/onboarding" />;
  }
  
  const loading = authLoading || statsLoading;
  
  // Generate leaderboard data from friends
  const currentDate = new Date().toISOString().split('T')[0]; // Today's date in YYYY-MM-DD format
  
  // Create leaderboard entries from user and friends
  const leaderboardEntries = [
    // Add current user to leaderboard
    ...(stats ? [{
      id: user?.uid || '',
      displayName: user?.displayName || 'You',
      photoURL: user?.photoURL || null,
      isCurrentUser: true,
      streak: stats.streak,
      todayCount: stats.appliedJobs.filter(job => job.date === currentDate).length,
      totalApplications: stats.totalApplications
    }] : []),
    // Add friends
    ...friends.map(friend => {
      // Calculate todayCount for each friend
      const friendTodayCount = friend.stats?.appliedJobs?.filter(job => job.date === currentDate).length || 0;
      
      return {
        id: friend.id,
        displayName: friend.displayName,
        photoURL: friend.photoURL || null,
        isCurrentUser: false,
        streak: friend.streak,
        todayCount: friendTodayCount,
        totalApplications: friend.totalApplications
      };
    })
  ];
  
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar 
        user={user}
        onSignOut={signOut}
        onSelectFriend={selectFriend}
        selectedFriendId={selectedFriend?.id || null}
        className="w-64 hidden md:block"
      />
      
      {/* Main Content */}
      <main className="flex-1 p-6 pb-16 md:pb-6 overflow-y-auto">
        {selectedFriend ? (
          // Friend Dashboard View
          <FriendDashboard 
            friend={selectedFriend}
            stats={selectedFriendStats}
            onClose={clearSelectedFriend}
            loading={friendsLoading}
          />
        ) : (
          // User Dashboard View
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            </div>
            
            {/* Stats Overview */}
            <StatsCards stats={stats} loading={loading} />
            
            {/* Application Charts */}
            <EnhancedChartComponent
              applicationData={applicationChartData}
              streakData={streakChartData}
              title="Application Activity"
              loading={loading}
              onTimeRangeChange={handleTimeRangeChange}
            />
            
            {/* Tabbed Content Section */}
            <Tabs defaultValue="applications" className="space-y-4">
              <TabsList>
                <TabsTrigger value="applications" className="text-sm">
                  Recent Applications
                </TabsTrigger>
                <TabsTrigger value="leaderboard" className="text-sm">
                  <Trophy className="h-4 w-4 mr-1" />
                  Leaderboard
                </TabsTrigger>
                <TabsTrigger value="targets" className="text-sm">
                  <PieChart className="h-4 w-4 mr-1" />
                  Targets
                </TabsTrigger>
              </TabsList>
              
              {/* Recent Applications Tab */}
              <TabsContent value="applications" className="space-y-4">
                <RecentApplications
                  applications={stats?.appliedJobs.slice(0, 5) || []}
                  loading={loading}
                />
              </TabsContent>
              
              {/* Leaderboard Tab */}
              <TabsContent value="leaderboard" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
                      Job Application Leaderboard
                    </CardTitle>
                    <CardDescription>
                      See how you rank against your friends
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <LeaderboardTable
                      entries={leaderboardEntries}
                      loading={loading || friendsLoading}
                    />
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Share2 className="h-5 w-5 mr-2 text-blue-500" />
                      Invite Friends
                    </CardTitle>
                    <CardDescription>
                      Grow your network to compete and support each other
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center justify-center p-6 space-y-4 border border-dashed border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                      <p className="text-sm text-muted-foreground text-center">
                        Coming soon: Invite your friends to join the job hunt together. 
                        Share progress, celebrate wins, and keep each other motivated!
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Targets Tab */}
              <TabsContent value="targets" className="space-y-4">
                <Card className="mx-auto max-w-md">
                  <CardHeader>
                    <CardTitle>1000 Applications Challenge</CardTitle>
                    <CardDescription>
                      Track your progress toward 1000 job applications
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="h-[200px] flex items-center justify-center">
                        <div className="animate-pulse h-8 w-8 rounded-full bg-muted-foreground/10"></div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center space-y-4">
                        <div className="h-[200px] w-[200px] relative flex items-center justify-center">
                          <svg className="h-full w-full" viewBox="0 0 100 100">
                            {/* Background circle */}
                            <circle 
                              cx="50" 
                              cy="50" 
                              r="40" 
                              fill="none" 
                              stroke="currentColor" 
                              className="text-gray-100 dark:text-gray-800" 
                              strokeWidth="10" 
                            />
                            
                            {/* Progress arc - calculate stroke dasharray and dashoffset */}
                            <circle 
                              cx="50" 
                              cy="50" 
                              r="40" 
                              fill="none" 
                              stroke="currentColor" 
                              className="text-primary" 
                              strokeWidth="10" 
                              strokeDasharray="251.2" 
                              strokeDashoffset={251.2 * (1 - (stats?.totalApplications || 0) / 1000)} 
                              strokeLinecap="round"
                              transform="rotate(-90, 50, 50)" 
                            />
                          </svg>
                          <div className="absolute flex flex-col items-center justify-center">
                            <span className="text-3xl font-bold">
                              {stats?.totalApplications || 0}
                            </span>
                            <span className="text-xs text-muted-foreground">of 1000 applications</span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 w-full text-center">
                          <div>
                            <p className="text-sm font-medium">Progress</p>
                            <p className="text-2xl font-bold">
                              {Math.round(((stats?.totalApplications || 0) / 1000) * 100)}%
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Remaining</p>
                            <p className="text-2xl font-bold">
                              {1000 - (stats?.totalApplications || 0)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Current Streak</p>
                            <p className="text-2xl font-bold text-primary">{stats?.streak || 0} days</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>
    </div>
  );
}