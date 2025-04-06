import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Onboarding from "@/pages/onboarding";
import useFirebaseAuth from '@/hooks/useFirebaseAuth';
import { useEffect } from 'react';

function Router() {
  const { user, loading } = useFirebaseAuth();
  const [location, setLocation] = useLocation();
  
  // Effect to handle routing based on auth status
  useEffect(() => {
    if (!loading) {
      if (user) {
        // User is authenticated, allow dashboard access
        if (location === "/onboarding") {
          setLocation("/");
        }
      } else {
        // User is not authenticated, redirect to onboarding
        if (location === "/") {
          setLocation("/onboarding");
        }
      }
    }
  }, [user, loading, location, setLocation]);
  
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/onboarding" component={Onboarding} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
