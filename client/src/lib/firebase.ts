import { initializeApp } from "firebase/app";
import { getAuth, signOut, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirestore, doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";
import { isExtensionEnvironment } from "./extensionAdapter";
import { Friend, ApplicationStats, JobApplication } from '@/types';

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  messagingSenderId: "", // Not needed for basic auth
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase - different instance for extension vs web app
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and Firestore
const auth = getAuth(app);
const db = getFirestore(app);

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

// Get user's friends list
export const getFriends = async (userId: string): Promise<Friend[]> => {
  try {
    // In a real app, we'd query the friends collection for this user
    // For demo purposes, we'll return mock friends data
    
    // Generate demo friends with realistic data
    const demoFriends: Friend[] = [
      {
        id: "friend1",
        displayName: "Alex Johnson",
        photoURL: "https://randomuser.me/api/portraits/men/32.jpg",
        totalApplications: 42,
        streak: 7,
        status: "online",
        lastActive: new Date().toISOString()
      },
      {
        id: "friend2",
        displayName: "Taylor Smith",
        photoURL: "https://randomuser.me/api/portraits/women/44.jpg",
        totalApplications: 38,
        streak: 5,
        status: "offline",
        lastActive: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
      },
      {
        id: "friend3",
        displayName: "Jamie Lee",
        photoURL: "https://randomuser.me/api/portraits/women/68.jpg",
        totalApplications: 64,
        streak: 12,
        status: "online",
        lastActive: new Date().toISOString()
      }
    ];
    
    return demoFriends;
  } catch (error) {
    console.error("Error getting friends:", error);
    throw error;
  }
};

// Get user's statistics
export const getUserStats = async (userId: string): Promise<ApplicationStats> => {
  try {
    // In a real app, we'd fetch this from Firestore
    // For demo purposes, create some sample data based on userId
    
    // Generate some applications with different statuses
    const generateDemoApplications = (): JobApplication[] => {
      const applications: JobApplication[] = [];
      const companies = ["Google", "Apple", "Microsoft", "Amazon", "Facebook", "Twitter", "LinkedIn", "Airbnb", "Uber", "Netflix"];
      const statuses: ("applied" | "interviewing" | "rejected" | "offer" | "accepted")[] = ["applied", "interviewing", "rejected", "offer", "accepted"];
      const tags = ["Remote", "Full-time", "Entry Level", "Senior", "Engineering", "Design", "Product", "Marketing"];
      
      // Generate between 10-20 applications
      const count = 10 + Math.floor(Math.random() * 10);
      
      for (let i = 0; i < count; i++) {
        // Generate date within last 30 days
        const date = new Date();
        date.setDate(date.getDate() - Math.floor(Math.random() * 30));
        
        // Generate application
        applications.push({
          id: `app-${i}`,
          title: `${companies[Math.floor(Math.random() * companies.length)]} ${["Software Engineer", "Product Manager", "Designer", "Data Scientist"][Math.floor(Math.random() * 4)]}`,
          company: companies[Math.floor(Math.random() * companies.length)],
          url: `https://example.com/job/${i}`,
          date: date.toISOString().split('T')[0],
          status: statuses[Math.floor(Math.random() * statuses.length)],
          tags: [tags[Math.floor(Math.random() * tags.length)], tags[Math.floor(Math.random() * tags.length)]],
          notes: Math.random() > 0.5 ? "Applied through company website" : undefined
        });
      }
      
      // Sort by date (newest first)
      return applications.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    };
    
    // Calculate streak and response rate from applications
    const calculateStats = (applications: JobApplication[]): ApplicationStats => {
      // Count applications in the last 7 and 30 days
      const now = new Date();
      const last7Days = new Date();
      last7Days.setDate(now.getDate() - 7);
      
      const last30Days = new Date();
      last30Days.setDate(now.getDate() - 30);
      
      const weeklyApplications = applications.filter(
        app => new Date(app.date) >= last7Days
      ).length;
      
      const monthlyApplications = applications.filter(
        app => new Date(app.date) >= last30Days
      ).length;
      
      // Calculate response rate
      const respondedApps = applications.filter(
        app => app.status !== 'applied'
      ).length;
      
      const responseRate = applications.length ? (respondedApps / applications.length) * 100 : 0;
      
      // Calculate current streak (simplified)
      const streak = 1 + Math.floor(Math.random() * 10); // Just for demo
      
      return {
        totalApplications: applications.length,
        weeklyApplications,
        monthlyApplications,
        streak,
        maxStreak: streak + Math.floor(Math.random() * 5),
        responseRate,
        lastUpdate: new Date().toISOString(),
        appliedJobs: applications
      };
    };
    
    // Generate demo applications and stats
    const applications = generateDemoApplications();
    const stats = calculateStats(applications);
    
    return stats;
  } catch (error) {
    console.error("Error getting user stats:", error);
    throw error;
  }
};

// Add a new friend (for demo purposes)
export const addFriend = async (userId: string, friendEmail: string): Promise<Friend> => {
  try {
    // In a real app, we would search for the user by email and add them as a friend
    // For demo purposes, return a mock friend
    const newFriend: Friend = {
      id: `friend-${Date.now()}`,
      displayName: friendEmail.split('@')[0], // Use part before @ as display name
      photoURL: `https://randomuser.me/api/portraits/${Math.random() > 0.5 ? 'men' : 'women'}/${Math.floor(Math.random() * 100)}.jpg`,
      totalApplications: Math.floor(Math.random() * 50) + 5,
      streak: Math.floor(Math.random() * 8) + 1,
      status: 'online',
      lastActive: new Date().toISOString()
    };
    
    return newFriend;
  } catch (error) {
    console.error("Error adding friend:", error);
    throw error;
  }
};

// Remove a friend (for demo purposes)
export const removeFriend = async (userId: string, friendId: string): Promise<void> => {
  try {
    // In a real app, we would update the user's friends list in Firestore
    // For demo purposes, just log the removal
    console.log(`Removing friend ${friendId} from user ${userId}`);
    // No actual Firebase operation in this demo implementation
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

// Export the Firebase services
export { app, auth, db };