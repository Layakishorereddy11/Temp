import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  User
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs, 
  arrayUnion, 
  arrayRemove, 
  serverTimestamp,
  Timestamp,
  orderBy,
  limit 
} from "firebase/firestore";

// Initialize Firebase with environment variables or fallback values
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Authentication functions
export const loginWithEmail = async (email: string, password: string) => {
  try {
    return await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    console.error("Error signing in with email", error);
    throw error;
  }
};

export const signupWithEmail = async (name: string, email: string, password: string) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName: name });
    return result;
  } catch (error) {
    console.error("Error signing up with email", error);
    throw error;
  }
};

export const signInWithGoogle = async () => {
  try {
    return await signInWithPopup(auth, googleProvider);
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out", error);
    throw error;
  }
};

// Firestore data functions
export const createUserDocument = async (user: User) => {
  try {
    // Create default user stats
    const defaultStats = {
      todayCount: 0,
      streak: 0,
      lastUpdated: new Date().toISOString().split('T')[0],
      appliedJobs: []
    };

    // Create user document in Firestore
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      displayName: user.displayName || '',
      email: user.email || '',
      photoURL: user.photoURL || '',
      createdAt: serverTimestamp(),
      stats: defaultStats,
      friends: []
    });

    return defaultStats;
  } catch (error) {
    console.error("Error creating user document", error);
    throw error;
  }
};

export const getUserStats = async (userId: string) => {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
      return userDoc.data().stats;
    }
    return null;
  } catch (error) {
    console.error("Error getting user stats", error);
    throw error;
  }
};

export const updateUserStats = async (userId: string, stats: any) => {
  try {
    await updateDoc(doc(db, "users", userId), {
      stats: stats
    });
  } catch (error) {
    console.error("Error updating user stats", error);
    throw error;
  }
};

export const trackApplication = async (userId: string, application: any) => {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const stats = userData.stats || {};
      
      // Update today's count
      const today = new Date().toISOString().split('T')[0];
      if (stats.lastUpdated !== today) {
        stats.todayCount = 1;
        stats.lastUpdated = today;
      } else {
        stats.todayCount = (stats.todayCount || 0) + 1;
      }
      
      // Update streak
      // Logic: If user applied to at least one job today, maintain streak
      // If last update was yesterday, increment streak
      // If last update was older, reset streak to 1
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      if (stats.lastUpdated === yesterdayStr) {
        stats.streak = (stats.streak || 0) + 1;
      } else if (stats.lastUpdated < yesterdayStr) {
        stats.streak = 1;
      }
      
      // Add to applied jobs array
      const appliedJobs = stats.appliedJobs || [];
      // Reset lastTracked flag for all jobs
      appliedJobs.forEach((job: any) => {
        job.lastTracked = false;
      });
      
      // Add new job with lastTracked flag
      appliedJobs.push({
        ...application,
        timestamp: Timestamp.now(),
        lastTracked: true
      });
      
      stats.appliedJobs = appliedJobs;
      
      // Update user document
      await updateDoc(doc(db, "users", userId), {
        stats: stats
      });
      
      return stats;
    }
    return null;
  } catch (error) {
    console.error("Error tracking application", error);
    throw error;
  }
};

export const getFriends = async (userId: string) => {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const friendIds = userData.friends || [];
      
      if (friendIds.length === 0) return [];
      
      const friendsData = [];
      for (const friendId of friendIds) {
        const friendDoc = await getDoc(doc(db, "users", friendId));
        if (friendDoc.exists()) {
          friendsData.push({
            id: friendId,
            ...friendDoc.data()
          });
        }
      }
      
      return friendsData;
    }
    return [];
  } catch (error) {
    console.error("Error getting friends", error);
    throw error;
  }
};

export const getLeaderboard = async (userId: string) => {
  try {
    // Get user's friends first
    const userDoc = await getDoc(doc(db, "users", userId));
    if (!userDoc.exists()) return [];
    
    const userData = userDoc.data();
    const friendIds = [...(userData.friends || []), userId];
    
    // Get all users data for leaderboard
    const leaderboardData = [];
    for (const id of friendIds) {
      const userDoc = await getDoc(doc(db, "users", id));
      if (userDoc.exists()) {
        const data = userDoc.data();
        leaderboardData.push({
          id: id,
          displayName: data.displayName,
          photoURL: data.photoURL,
          isCurrentUser: id === userId,
          streak: data.stats?.streak || 0,
          todayCount: data.stats?.todayCount || 0,
          totalApplications: data.stats?.appliedJobs?.length || 0
        });
      }
    }
    
    // Sort by streak (primary) and total applications (secondary)
    return leaderboardData.sort((a, b) => {
      if (b.streak !== a.streak) return b.streak - a.streak;
      return b.totalApplications - a.totalApplications;
    });
  } catch (error) {
    console.error("Error getting leaderboard", error);
    throw error;
  }
};

export const getApplicationsChartData = async (userId: string, days = 7) => {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const appliedJobs = userData.stats?.appliedJobs || [];
      
      // Generate dates for the last 'days' days
      const dates = [];
      const counts = [];
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        dates.push(dateStr);
        
        // Count jobs applied on this date
        const count = appliedJobs.filter((job: any) => {
          const jobDate = job.date || (job.timestamp?.toDate().toISOString().split('T')[0]);
          return jobDate === dateStr;
        }).length;
        
        counts.push(count);
      }
      
      // Format dates for display
      const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const formattedDates = dates.map(date => {
        const day = new Date(date).getDay();
        return dayNames[day === 0 ? 6 : day - 1]; // Adjust for Sunday
      });
      
      return {
        labels: formattedDates,
        datasets: [{
          label: 'Applications Submitted',
          data: counts,
          backgroundColor: 'rgba(0, 112, 243, 0.2)',
          borderColor: 'rgba(0, 112, 243, 1)',
          borderWidth: 2,
          borderRadius: 4,
          barThickness: 16,
        }]
      };
    }
    
    return {
      labels: [],
      datasets: [{
        label: 'Applications Submitted',
        data: [],
        backgroundColor: 'rgba(0, 112, 243, 0.2)',
        borderColor: 'rgba(0, 112, 243, 1)',
        borderWidth: 2,
        borderRadius: 4,
        barThickness: 16,
      }]
    };
  } catch (error) {
    console.error("Error getting applications chart data", error);
    throw error;
  }
};

export const getRecentApplications = async (userId: string, limit = 5) => {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const appliedJobs = userData.stats?.appliedJobs || [];
      
      // Sort by timestamp (descending)
      return appliedJobs
        .sort((a: any, b: any) => {
          const aTime = a.timestamp?.toMillis() || 0;
          const bTime = b.timestamp?.toMillis() || 0;
          return bTime - aTime;
        })
        .slice(0, limit);
    }
    
    return [];
  } catch (error) {
    console.error("Error getting recent applications", error);
    throw error;
  }
};

// Helper to format time
export const formatApplicationTime = (timestamp: Timestamp) => {
  if (!timestamp) return 'Unknown';
  
  const date = timestamp.toDate();
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  const isToday = date.getDate() === today.getDate() && 
                  date.getMonth() === today.getMonth() && 
                  date.getFullYear() === today.getFullYear();
  
  const isYesterday = date.getDate() === yesterday.getDate() && 
                      date.getMonth() === yesterday.getMonth() && 
                      date.getFullYear() === yesterday.getFullYear();
  
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const formattedHours = hours % 12 || 12; // Convert to 12-hour format
  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
  const timeStr = `${formattedHours}:${formattedMinutes} ${ampm}`;
  
  if (isToday) {
    return `Today, ${timeStr}`;
  } else if (isYesterday) {
    return `Yesterday, ${timeStr}`;
  } else {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    }) + `, ${timeStr}`;
  }
};

export { auth, db, onAuthStateChanged };
