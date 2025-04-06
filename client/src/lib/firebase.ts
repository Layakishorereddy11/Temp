import { signOut, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";
import { isExtensionEnvironment } from "./extensionAdapter";
import { Friend, ApplicationStats, JobApplication } from '@/types';
import { auth, db, app } from './firebaseShared';

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();

// Auth Helper Functions
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

// Firestore Helper Functions

// API Helper Functions
const API_BASE = '';  // Empty string for relative URLs

// Helper function to call the API
const apiRequest = async (url: string, options: RequestInit = {}) => {
  try {
    const response = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API request failed with status ${response.status}`);
    }
    
    // For 204 No Content
    if (response.status === 204) {
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
};

// Get user's friends list
export const getFriends = async (userId: string): Promise<Friend[]> => {
  try {
    if (!userId) {
      return [];
    }
    
    const friends = await apiRequest(`/api/firebase/users/${userId}/friends`);
    
    // Transform the server response into the expected Friend type
    return friends.map((friend: any) => ({
      id: friend.uid,
      displayName: friend.displayName,
      photoURL: friend.photoURL,
      totalApplications: friend.totalApplications || 0,
      streak: friend.streak || 0,
      status: friend.lastActive && (new Date().getTime() - new Date(friend.lastActive).getTime() < 3600000) ? 'online' : 'offline',
      lastActive: friend.lastActive || new Date().toISOString(),
      email: friend.email
    }));
  } catch (error) {
    console.error("Error getting friends:", error);
    // Return empty array on error to prevent UI breakage
    return [];
  }
};

// Get user's statistics
export const getUserStats = async (userId: string): Promise<ApplicationStats> => {
  try {
    if (!userId) {
      throw new Error("User ID is required");
    }
    
    // Fetch user stats from API
    const statsData = await apiRequest(`/api/firebase/users/${userId}/stats`);
    
    // Fetch applications from API
    const applications = await apiRequest(`/api/firebase/users/${userId}/applications`);
    
    // Transform the applications data
    const formattedApplications: JobApplication[] = applications.map((app: any) => ({
      id: app.id.toString(),
      title: app.title,
      company: app.company,
      url: app.url,
      date: app.date instanceof Date ? app.date.toISOString().split('T')[0] : 
            typeof app.date === 'string' ? app.date : new Date(app.date).toISOString().split('T')[0],
      status: app.status,
      tags: app.tags || [],
      notes: app.notes
    }));
    
    // Calculate response rate
    const respondedApps = formattedApplications.filter(
      app => app.status !== 'applied'
    ).length;
    
    const responseRate = formattedApplications.length ? 
      (respondedApps / formattedApplications.length) * 100 : 0;
    
    // Build ApplicationStats object
    const stats: ApplicationStats = {
      totalApplications: statsData.totalApplications || 0,
      weeklyApplications: statsData.weeklyApplications || 0,
      monthlyApplications: statsData.monthlyApplications || 0,
      streak: statsData.streak || 0,
      maxStreak: statsData.maxStreak || 0,
      responseRate,
      lastUpdate: new Date().toISOString(),
      appliedJobs: formattedApplications.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      )
    };
    
    return stats;
  } catch (error) {
    console.error("Error getting user stats:", error);
    
    // Return default stats to prevent UI breakage
    return {
      totalApplications: 0,
      weeklyApplications: 0,
      monthlyApplications: 0,
      streak: 0,
      maxStreak: 0,
      responseRate: 0,
      lastUpdate: new Date().toISOString(),
      appliedJobs: []
    };
  }
};

// Add a new friend
export const addFriend = async (userId: string, friendEmail: string): Promise<Friend> => {
  try {
    if (!userId || !friendEmail) {
      throw new Error("User ID and friend email are required");
    }
    
    // Call API to add friend
    const newFriend = await apiRequest(`/api/firebase/users/${userId}/friends`, {
      method: 'POST',
      body: JSON.stringify({ email: friendEmail })
    });
    
    // Transform API response to Friend type
    return {
      id: newFriend.uid,
      displayName: newFriend.displayName,
      photoURL: newFriend.photoURL,
      totalApplications: newFriend.totalApplications || 0,
      streak: newFriend.streak || 0,
      status: 'online',
      lastActive: newFriend.lastActive || new Date().toISOString(),
      email: newFriend.email
    };
  } catch (error) {
    console.error("Error adding friend:", error);
    throw error;
  }
};

// Remove a friend
export const removeFriend = async (userId: string, friendId: string): Promise<void> => {
  try {
    if (!userId || !friendId) {
      throw new Error("User ID and friend ID are required");
    }
    
    // Call API to remove friend
    await apiRequest(`/api/firebase/users/${userId}/friends/${friendId}`, {
      method: 'DELETE'
    });
    
    return Promise.resolve();
  } catch (error) {
    console.error("Error removing friend:", error);
    throw error;
  }
};

// Format the application time for display
export const formatApplicationTime = (timestamp: string | number | Date): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInMilliseconds = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMilliseconds / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) {
    // Today
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    return `Today at ${formattedHours}:${formattedMinutes} ${period}`;
  } else if (diffInDays === 1) {
    // Yesterday
    return 'Yesterday';
  } else if (diffInDays < 7) {
    // Within the last week
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  } else {
    // More than a week ago
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    if (date.getFullYear() !== now.getFullYear()) {
      options.year = 'numeric';
    }
    return date.toLocaleDateString('en-US', options);
  }
};

// Re-export the Firebase services from firebaseShared.ts
export { auth, db, app } from './firebaseShared';