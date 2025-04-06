import { useState } from 'react';
import { Friend, ApplicationStats, JobApplication } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StatsCards from '@/components/StatsCards';
import EnhancedChartComponent from '@/components/EnhancedChartComponent';
import RecentApplications from '@/components/RecentApplications';
import { PieChart, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FriendDashboardProps {
  friend: Friend;
  stats: ApplicationStats | null;
  loading: boolean;
  onClose: () => void;
}

export default function FriendDashboard({ friend, stats, loading, onClose }: FriendDashboardProps) {
  const [timeRange, setTimeRange] = useState(14);
  
  // Generate chart data from friend stats if available
  const applicationChartData = stats?.applicationChartData || null;
  const streakChartData = stats?.streakChartData || null;
  
  // Get recent applications (or empty array if not available)
  const recentApplications: JobApplication[] = stats?.appliedJobs || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <img 
            src={friend.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${friend.displayName}`}
            alt={friend.displayName} 
            className="h-10 w-10 rounded-full"
          />
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center">
              {friend.displayName}'s Dashboard
              {friend.isOnline && (
                <span className="ml-2 h-2.5 w-2.5 rounded-full bg-green-500"></span>
              )}
            </h1>
            <p className="text-sm text-muted-foreground">{friend.email}</p>
          </div>
        </div>
        <Button 
          onClick={onClose}
          variant="ghost"
          size="sm"
          className="p-2 rounded-full"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
      
      {/* Stats Overview */}
      <StatsCards stats={stats} loading={loading} />
      
      {/* Application Charts */}
      <EnhancedChartComponent
        applicationData={applicationChartData}
        streakData={streakChartData}
        title="Application Activity"
        loading={loading}
        onTimeRangeChange={(days) => setTimeRange(days)}
      />
      
      {/* Tabbed Content Section */}
      <Tabs defaultValue="applications" className="space-y-4">
        <TabsList>
          <TabsTrigger value="applications" className="text-sm">
            Recent Applications
          </TabsTrigger>
          <TabsTrigger value="targets" className="text-sm">
            <PieChart className="h-4 w-4 mr-1" />
            Targets
          </TabsTrigger>
        </TabsList>
        
        {/* Recent Applications Tab */}
        <TabsContent value="applications" className="space-y-4">
          <RecentApplications
            applications={recentApplications.slice(0, 5)}
            loading={loading}
          />
        </TabsContent>
        
        {/* Targets Tab */}
        <TabsContent value="targets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>1000 Applications Challenge</CardTitle>
              <CardDescription>
                {friend.displayName}'s progress toward 1000 job applications
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
                        className="text-primary-500" 
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
                      <p className="text-2xl font-bold text-primary-500">{stats?.streak || 0} days</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}