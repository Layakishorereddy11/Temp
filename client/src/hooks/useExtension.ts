import { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { JobApplication, ApplicationStats } from '@/types';
import { 
  isExtensionEnvironment, 
  getChromeStorageValue,
  setChromeStorageValue,
  sendExtensionMessage,
  appToExtensionJobApplication,
  extensionToAppStats,
  appToExtensionStats,
  trackApplicationCrossEnvironment
} from '@/lib/extensionAdapter';
import { trackApplication } from '@/lib/firebase';

interface UseExtensionReturn {
  isExtension: boolean;
  extensionVersion: string | null;
  trackCurrentTabApplication: (user: User) => Promise<void>;
  removeLastApplication: (user: User) => Promise<void>;
  syncStats: (userId: string, stats: ApplicationStats) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export default function useExtension(): UseExtensionReturn {
  const [isExtension, setIsExtension] = useState<boolean>(false);
  const [extensionVersion, setExtensionVersion] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Check if running in extension environment on mount
  useEffect(() => {
    setIsExtension(isExtensionEnvironment());
    
    // If in extension environment, get version
    if (isExtensionEnvironment()) {
      try {
        const manifest = chrome.runtime.getManifest();
        setExtensionVersion(manifest.version);
      } catch (err) {
        console.error("Error getting extension version:", err);
      }
    }
  }, []);

  // Function to track the current tab as an application
  const trackCurrentTabApplication = useCallback(async (user: User): Promise<void> => {
    if (!isExtensionEnvironment() || !user?.uid) {
      setError("Not in extension environment or user not logged in");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get current tab using Chrome extension API
      const tabs = await new Promise<chrome.tabs.Tab[]>((resolve) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          resolve(tabs);
        });
      });

      const currentTab = tabs[0];
      const url = currentTab.url || '';
      const title = currentTab.title || '';

      if (!url) {
        setError("Cannot track this tab - URL not available");
        setLoading(false);
        return;
      }

      // Create application object
      const application: Partial<JobApplication> = {
        url,
        title,
        date: new Date().toISOString().split('T')[0],
        lastTracked: true,
        company: title.split(' - ')[0] || '',  // Attempt to extract company name
      };

      // Track in Firebase and update Chrome storage if needed
      await trackApplicationCrossEnvironment(user, application, trackApplication);

      setLoading(false);
    } catch (err) {
      console.error("Error tracking application:", err);
      setError(err instanceof Error ? err.message : "Failed to track application");
      setLoading(false);
    }
  }, [isExtensionEnvironment]);

  // Function to remove the last tracked application
  const removeLastApplication = useCallback(async (user: User): Promise<void> => {
    if (!isExtensionEnvironment() || !user?.uid) {
      setError("Not in extension environment or user not logged in");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get current stats from Chrome storage
      const stats = await getChromeStorageValue('stats');
      
      if (!stats || !stats.appliedJobs || stats.appliedJobs.length === 0) {
        setError("No applications to remove");
        setLoading(false);
        return;
      }
      
      // Find the last tracked application
      const lastTrackedIndex = stats.appliedJobs.findIndex((job: any) => job.lastTracked);
      
      if (lastTrackedIndex === -1) {
        // If no lastTracked flag, remove the most recent one
        stats.appliedJobs.shift();
      } else {
        // Remove the application with lastTracked flag
        stats.appliedJobs.splice(lastTrackedIndex, 1);
        
        // If there are other applications, mark the most recent one as lastTracked
        if (stats.appliedJobs.length > 0) {
          stats.appliedJobs[0].lastTracked = true;
        }
      }
      
      // Update stats
      if (stats.todayCount > 0) {
        stats.todayCount--;
      }
      
      // Save updated stats to Chrome storage
      await setChromeStorageValue('stats', stats);
      
      // Tell background script to sync with Firebase
      await sendExtensionMessage({ action: 'syncStats' });
      
      setLoading(false);
    } catch (err) {
      console.error("Error removing application:", err);
      setError(err instanceof Error ? err.message : "Failed to remove application");
      setLoading(false);
    }
  }, [isExtensionEnvironment]);

  // Function to sync stats between Firebase and Chrome storage
  const syncStats = useCallback(async (userId: string, stats: ApplicationStats): Promise<void> => {
    if (!isExtensionEnvironment() || !userId) {
      return;
    }

    try {
      // Convert stats to extension format
      const extensionStats = appToExtensionStats(stats);
      
      // Add userId to stats object
      extensionStats.userId = userId;
      
      // Save to Chrome storage
      await setChromeStorageValue('stats', extensionStats);
      
      // Tell background script to sync
      await sendExtensionMessage({ action: 'syncStats' });
    } catch (err) {
      console.error("Error syncing stats:", err);
      // We don't set error state here as this is a background operation
    }
  }, [isExtensionEnvironment]);

  return {
    isExtension,
    extensionVersion,
    trackCurrentTabApplication,
    removeLastApplication,
    syncStats,
    loading,
    error
  };
}