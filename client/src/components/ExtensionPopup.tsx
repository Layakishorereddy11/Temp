import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CheckCircle2, Award, Flame, Plus, Trash2, RefreshCw, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import useFirebaseAuth from "@/hooks/useFirebaseAuth";
import useApplicationStats from "@/hooks/useApplicationStats";
import useExtension from "@/hooks/useExtension";
import { JobApplication } from "@/types";

/**
 * A simplified popup component designed for the Chrome extension
 */
export default function ExtensionPopup() {
  const { user, loading: authLoading, error: authError, signOut } = useFirebaseAuth();
  const { 
    stats, 
    recentApplications, 
    loading: statsLoading, 
    error: statsError 
  } = useApplicationStats(user?.uid || null);
  
  const { 
    isExtension, 
    trackCurrentTabApplication, 
    removeLastApplication, 
    loading: extLoading, 
    error: extError 
  } = useExtension();
  
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("dashboard");

  // Show toast for errors
  useEffect(() => {
    const error = authError || statsError || extError;
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive"
      });
    }
  }, [authError, statsError, extError, toast]);

  const handleTrackApplication = async () => {
    if (!user) {
      toast({
        title: "Not logged in",
        description: "You must be logged in to track applications",
        variant: "destructive"
      });
      return;
    }

    try {
      await trackCurrentTabApplication(user);
      toast({
        title: "Success",
        description: "Application tracked successfully",
        variant: "default"
      });
    } catch (error) {
      // Error will be handled by the useExtension hook
    }
  };

  const handleRemoveApplication = async () => {
    if (!user) {
      toast({
        title: "Not logged in",
        description: "You must be logged in to remove applications",
        variant: "destructive"
      });
      return;
    }

    try {
      await removeLastApplication(user);
      toast({
        title: "Success",
        description: "Application removed successfully",
        variant: "default"
      });
    } catch (error) {
      // Error will be handled by the useExtension hook
    }
  };

  const openFullDashboard = () => {
    if (isExtension) {
      chrome.tabs.create({ url: chrome.runtime.getURL("dashboard.html") });
    } else {
      window.open("/dashboard", "_blank");
    }
  };

  const loading = authLoading || statsLoading || extLoading;

  // Not in extension environment message
  if (!isExtension) {
    return (
      <div className="p-4 max-w-sm mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Extension Mode Not Available</CardTitle>
            <CardDescription>This component is designed for the Chrome extension environment.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              You're currently viewing this component in a web browser, not in the Chrome extension.
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={() => window.location.href = "/"}>
              Go to Web App
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Login view
  if (!user) {
    return (
      <div className="p-4 max-w-sm mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Jobs Streak</CardTitle>
            <CardDescription>Track your job applications and compete with friends</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              Please log in to track your job applications
            </p>
            <Button 
              variant="default" 
              className="w-full" 
              onClick={() => chrome.tabs.create({ url: chrome.runtime.getURL("dashboard.html") })}
            >
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-sm mx-auto">
      <Card className="border-0 shadow-none">
        <CardHeader className="p-4 pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Jobs Streak</CardTitle>
            <Button variant="ghost" size="sm" onClick={signOut}>Sign Out</Button>
          </div>
          <div className="flex items-center space-x-2 mt-1">
            <img 
              src={user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${user.displayName}`} 
              alt="Profile" 
              className="w-6 h-6 rounded-full" 
            />
            <CardDescription className="text-xs font-medium">
              {user.displayName || user.email}
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="p-4 pt-2">
          {/* Stats summary */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-gray-50 rounded p-2 text-center">
              <div className="text-sm text-gray-500">Today</div>
              <div className="text-xl font-semibold flex items-center justify-center">
                {stats?.todayCount || 0}
              </div>
            </div>
            <div className="bg-gray-50 rounded p-2 text-center">
              <div className="text-sm text-gray-500">Streak</div>
              <div className="text-xl font-semibold flex items-center justify-center">
                {stats?.streak || 0} <Flame className="h-4 w-4 ml-1 text-orange-500" />
              </div>
            </div>
            <div className="bg-gray-50 rounded p-2 text-center">
              <div className="text-sm text-gray-500">Total</div>
              <div className="text-xl font-semibold">
                {stats?.appliedJobs?.length || 0}
              </div>
            </div>
          </div>
          
          <Tabs defaultValue="dashboard" onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="actions">Actions</TabsTrigger>
            </TabsList>
            
            <TabsContent value="dashboard" className="mt-0">
              {/* Recent applications */}
              <h4 className="text-sm font-medium mb-2">Recent Applications</h4>
              <div className="space-y-2 mb-4">
                {loading ? (
                  <div className="py-4 text-center">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-xs text-gray-500">Loading applications...</p>
                  </div>
                ) : recentApplications && recentApplications.length > 0 ? (
                  recentApplications.slice(0, 3).map((app, index) => (
                    <div key={index} className="bg-gray-50 rounded p-2 text-sm">
                      <div className="font-medium truncate">{app.title}</div>
                      <div className="text-xs text-gray-500 truncate">{app.url}</div>
                      <div className="flex items-center justify-between mt-1">
                        <div className="flex flex-wrap gap-1">
                          {app.tags && app.tags.slice(0, 2).map((tag, i) => (
                            <Badge key={i} variant="outline" className="text-xs py-0">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(app.date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-4 text-center">
                    <p className="text-xs text-gray-500">No applications yet</p>
                  </div>
                )}
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full mt-2" 
                onClick={openFullDashboard}
              >
                <ExternalLink className="h-4 w-4 mr-2" /> View Full Dashboard
              </Button>
            </TabsContent>
            
            <TabsContent value="actions" className="mt-0">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Track Current Page</h4>
                  <p className="text-xs text-gray-500 mb-2">
                    Add the current page as a job application to your tracking.
                  </p>
                  <Button 
                    className="w-full" 
                    onClick={handleTrackApplication}
                    disabled={loading}
                  >
                    <Plus className="h-4 w-4 mr-2" /> Track Application
                  </Button>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="text-sm font-medium mb-2">Remove Last Application</h4>
                  <p className="text-xs text-gray-500 mb-2">
                    Remove the most recently tracked job application.
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full text-red-500 border-red-200 hover:bg-red-50" 
                    onClick={handleRemoveApplication}
                    disabled={loading || !recentApplications || recentApplications.length === 0}
                  >
                    <Trash2 className="h-4 w-4 mr-2" /> Remove Application
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        
        <CardFooter className="p-4 pt-0 text-xs text-gray-500 flex justify-between">
          <div>
            Last updated: {stats?.lastUpdated ? new Date(stats.lastUpdated).toLocaleDateString() : 'Never'}
          </div>
          <div>
            Streak Goal: {Math.min(stats?.todayCount || 0, 20)}/20
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}