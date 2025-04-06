import { User } from "firebase/auth";
import { Timestamp } from "firebase/firestore";
import { ApplicationStats, JobApplication } from "@/types";

/**
 * This adapter module bridges the gap between the React application
 * and the Chrome extension data formats. It provides utility functions
 * for converting data between the two formats.
 */

/**
 * Converts a JobApplication from the React app format to the extension format
 */
export function appToExtensionJobApplication(job: JobApplication): any {
  return {
    url: job.url,
    title: job.title,
    date: job.date,
    timestamp: job.timestamp instanceof Timestamp 
      ? job.timestamp.toDate().toISOString() 
      : job.timestamp,
    lastTracked: job.lastTracked,
    company: job.company || '',
    tags: job.tags || [],
    favicon: `https://www.google.com/s2/favicons?domain=${new URL(job.url).hostname}`,
  };
}

/**
 * Converts a JobApplication from the extension format to the React app format
 */
export function extensionToAppJobApplication(job: any): JobApplication {
  return {
    url: job.url,
    title: job.title,
    date: job.date,
    // Create a Timestamp if we have a string
    timestamp: typeof job.timestamp === 'string' 
      ? Timestamp.fromDate(new Date(job.timestamp)) 
      : job.timestamp,
    lastTracked: Boolean(job.lastTracked),
    company: job.company || '',
    tags: job.tags || [],
    notes: job.notes || '',
  };
}

/**
 * Converts stats from the React app format to the extension format
 */
export function appToExtensionStats(stats: ApplicationStats): any {
  return {
    todayCount: stats.todayCount || 0,
    streak: stats.streak || 0,
    lastUpdated: stats.lastUpdated || new Date().toISOString().split('T')[0],
    appliedJobs: stats.appliedJobs 
      ? stats.appliedJobs.map(job => appToExtensionJobApplication(job))
      : [],
    totalResponses: stats.totalResponses || 0,
    responseRate: stats.responseRate || 0
  };
}

/**
 * Converts stats from the extension format to the React app format
 */
export function extensionToAppStats(stats: any): ApplicationStats {
  return {
    todayCount: stats.todayCount || 0,
    streak: stats.streak || 0,
    lastUpdated: stats.lastUpdated || new Date().toISOString().split('T')[0],
    appliedJobs: stats.appliedJobs 
      ? stats.appliedJobs.map((job: any) => extensionToAppJobApplication(job))
      : [],
    totalResponses: stats.totalResponses || 0,
    responseRate: stats.responseRate || 0
  };
}

/**
 * Detects if the app is running in a Chrome extension environment
 */
export function isExtensionEnvironment(): boolean {
  return typeof window !== 'undefined' && 
         typeof (window as any).chrome !== 'undefined' && 
         (window as any).chrome.runtime && 
         (window as any).chrome.runtime.id;
}

/**
 * Sends a message to the extension's background script
 */
export function sendExtensionMessage(message: any): Promise<any> {
  return new Promise((resolve, reject) => {
    if (!isExtensionEnvironment()) {
      reject(new Error("Not in extension environment"));
      return;
    }

    try {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(response);
        }
      });
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Gets a value from Chrome's storage
 */
export function getChromeStorageValue(key: string): Promise<any> {
  return new Promise((resolve, reject) => {
    if (!isExtensionEnvironment()) {
      reject(new Error("Not in extension environment"));
      return;
    }

    try {
      chrome.storage.local.get([key], (result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(result[key]);
        }
      });
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Sets a value in Chrome's storage
 */
export function setChromeStorageValue(key: string, value: any): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!isExtensionEnvironment()) {
      reject(new Error("Not in extension environment"));
      return;
    }

    try {
      chrome.storage.local.set({ [key]: value }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Tracks a job application in both Firebase and Chrome extension storage if available
 */
export async function trackApplicationCrossEnvironment(
  user: User,
  application: Partial<JobApplication>,
  trackFn: (userId: string, application: any) => Promise<any>
): Promise<any> {
  const userId = user.uid;
  
  try {
    // First track in Firebase using the provided function
    const result = await trackFn(userId, application);
    
    // If we're in an extension environment, also update Chrome storage
    if (isExtensionEnvironment()) {
      try {
        // Get current stats from Chrome storage
        const stats = await getChromeStorageValue('stats') || {};
        
        // Update stats with the new application
        const extensionApplication = appToExtensionJobApplication(application as JobApplication);
        
        // Create a new stats object following the extension format
        const updatedStats = {
          ...stats,
          userId,
          todayCount: result.stats.todayCount,
          streak: result.stats.streak,
          lastUpdated: result.stats.lastUpdated,
          appliedJobs: result.stats.appliedJobs.map((job: any) => appToExtensionJobApplication(job))
        };
        
        // Save to Chrome storage
        await setChromeStorageValue('stats', updatedStats);
        
        // Tell background script to sync
        await sendExtensionMessage({ action: 'syncStats' });
      } catch (chromeErr) {
        console.error("Failed to update Chrome storage:", chromeErr);
        // Continue even if Chrome storage update failed
      }
    }
    
    return result;
  } catch (error) {
    console.error("Error tracking application:", error);
    throw error;
  }
}