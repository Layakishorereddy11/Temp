import { createRoot } from "react-dom/client";
import { useEffect } from 'react';
import App from "./App";
import "./index.css";
import { initializeAuth } from "@/lib/authService";
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from "@/lib/queryClient";

// Initialize auth listener when app starts
const AppWithAuth = () => {
  useEffect(() => {
    // Set up auth listener and get unsubscribe function
    const unsubscribe = initializeAuth();
    
    // Clean up by unsubscribing when component unmounts
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);
  
  return <App />;
};

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <AppWithAuth />
  </QueryClientProvider>
);
