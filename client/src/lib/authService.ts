import { User } from 'firebase/auth';
import { auth } from '@/lib/firebaseShared';

// Helper function to call the API
const apiRequest = async (url: string, options: RequestInit = {}) => {
  try {
    const response = await fetch(url, {
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

// Create or update Firebase user in our database when they sign in
export const syncUserWithDatabase = async (user: User | null) => {
  if (!user) return null;
  
  try {
    // Create or update user in our database
    const userData = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email?.split('@')[0] || 'User',
      photoURL: user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${user.email}`
    };
    
    const response = await apiRequest('/api/firebase/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    
    console.log('User synced with database:', response);
    return response;
  } catch (error) {
    console.error('Error syncing user with database:', error);
    return null;
  }
};

// Set up auth state listener to sync user with database on sign in
export const setupAuthListener = () => {
  return auth.onAuthStateChanged(async (user) => {
    if (user) {
      await syncUserWithDatabase(user);
    }
  });
};

// Initialize auth listener when app starts
export const initializeAuth = () => {
  const unsubscribe = setupAuthListener();
  return unsubscribe; // Return unsubscribe function for cleanup
};

export default {
  syncUserWithDatabase,
  setupAuthListener,
  initializeAuth
};