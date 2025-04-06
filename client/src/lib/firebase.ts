import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  User,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged
} from "firebase/auth";
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  addDoc, 
  getDocs, 
  query, 
  where,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  Timestamp,
  limit,
  orderBy
} from "firebase/firestore";

// Import shared Firebase configuration
import app, { auth, db } from './firebaseShared';

// Re-export Firebase services for backward compatibility
export { auth, db };

// Authentication helpers
export const loginWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw error;
  }
};

export const signupWithEmail = async (name: string, email: string, password: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: name });
    await createUserDocument(userCredential.user);
    return userCredential.user;
  } catch (error) {
    throw error;
  }
};

export const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    await createUserDocument(result.user);
    return result.user;
  } catch (error) {
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    throw error;
  }
};

// Firestore helpers
export const createUserDocument = async (user: User) => {
  if (!user?.uid) return;

  try {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        displayName: user.displayName || '',
        email: user.email || '',
        photoURL: user.photoURL || '',
        createdAt: serverTimestamp(),
        stats: {
          todayCount: 0,
          streak: 0,
          lastUpdated: new Date().toISOString().split('T')[0],
          appliedJobs: []
        },
        friends: []
      });
    }
  } catch (error) {
    console.error("Error creating user document:", error);
  }
};

// Application stats helpers
export const getUserStats = async (userId: string) => {
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      return userDoc.data().stats || null;
    }
    return null;
  } catch (error) {
    console.error("Error getting user stats:", error);
    throw error;
  }
};

export const updateUserStats = async (userId: string, stats: any) => {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, { stats });
  } catch (error) {
    console.error("Error updating user stats:", error);
    throw error;
  }
};

// Application tracking
export const trackApplication = async (userId: string, application: any) => {
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const stats = userData.stats || {};
      const appliedJobs = stats.appliedJobs || [];
      const today = new Date().toISOString().split('T')[0];
      
      // Reset any previous lastTracked flags
      const updatedJobs = appliedJobs.map((job: any) => ({
        ...job,
        lastTracked: false
      }));
      
      // Add the new application
      const newApplication = {
        ...application,
        timestamp: Timestamp.now(),
        lastTracked: true,
        date: today
      };
      
      // Check if it's a new day for streak calculation
      const lastUpdated = stats.lastUpdated || '';
      let streak = stats.streak || 0;
      let todayCount = 0;
      
      if (lastUpdated !== today) {
        const lastDate = new Date(lastUpdated);
        const currentDate = new Date(today);
        
        // Check if yesterday - for streak continuation
        const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          // Consecutive day, increase streak
          streak++;
        } else if (diffDays > 1) {
          // Streak broken, reset
          streak = 1;
        }
        
        todayCount = 1; // First application of the day
      } else {
        // Same day, increment today's count
        todayCount = (stats.todayCount || 0) + 1;
      }
      
      await updateDoc(userRef, {
        stats: {
          ...stats,
          appliedJobs: [newApplication, ...updatedJobs],
          lastUpdated: today,
          todayCount,
          streak
        }
      });
      
      return { 
        success: true,
        stats: {
          appliedJobs: [newApplication, ...updatedJobs],
          lastUpdated: today,
          todayCount,
          streak
        }
      };
    }
    
    throw new Error("User document not found");
  } catch (error) {
    console.error("Error tracking application:", error);
    throw error;
  }
};

// Friends management
export const getFriends = async (userId: string) => {
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const friendIds = userData.friends || [];
      
      if (friendIds.length === 0) return [];
      
      const friends = [];
      for (const friendId of friendIds) {
        const friendRef = doc(db, "users", friendId);
        const friendDoc = await getDoc(friendRef);
        
        if (friendDoc.exists()) {
          const friendData = friendDoc.data();
          friends.push({
            id: friendId,
            displayName: friendData.displayName,
            email: friendData.email,
            photoURL: friendData.photoURL,
            stats: friendData.stats
          });
        }
      }
      
      return friends;
    }
    
    return [];
  } catch (error) {
    console.error("Error getting friends:", error);
    throw error;
  }
};

export const addFriend = async (userId: string, friendEmail: string) => {
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", friendEmail));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      throw new Error("User not found with that email");
    }
    
    const friendDoc = querySnapshot.docs[0];
    const friendId = friendDoc.id;
    
    // Don't add yourself as a friend
    if (friendId === userId) {
      throw new Error("You can't add yourself as a friend");
    }
    
    // Check if already a friend
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const friends = userData.friends || [];
      
      if (friends.includes(friendId)) {
        throw new Error("This user is already in your friends list");
      }
      
      // Add to current user's friends
      await updateDoc(userRef, {
        friends: arrayUnion(friendId)
      });
      
      // Add current user to friend's friends list (reciprocal)
      const friendRef = doc(db, "users", friendId);
      await updateDoc(friendRef, {
        friends: arrayUnion(userId)
      });
      
      return {
        id: friendId,
        displayName: friendDoc.data().displayName,
        email: friendDoc.data().email,
        photoURL: friendDoc.data().photoURL,
        stats: friendDoc.data().stats
      };
    }
    
    throw new Error("User document not found");
  } catch (error) {
    console.error("Error adding friend:", error);
    throw error;
  }
};

export const removeFriend = async (userId: string, friendId: string) => {
  try {
    // Remove from current user's friends
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      friends: arrayRemove(friendId)
    });
    
    // Remove current user from friend's friends (reciprocal)
    const friendRef = doc(db, "users", friendId);
    await updateDoc(friendRef, {
      friends: arrayRemove(userId)
    });
    
    return true;
  } catch (error) {
    console.error("Error removing friend:", error);
    throw error;
  }
};

// Leaderboard
export const getLeaderboard = async (userId: string) => {
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const friendIds = userData.friends || [];
      
      // Include current user in leaderboard
      const leaderboard = [
        {
          id: userId,
          displayName: userData.displayName,
          photoURL: userData.photoURL,
          isCurrentUser: true,
          streak: userData.stats?.streak || 0,
          todayCount: userData.stats?.todayCount || 0,
          totalApplications: userData.stats?.appliedJobs?.length || 0
        }
      ];
      
      // Add friends to leaderboard
      for (const friendId of friendIds) {
        const friendRef = doc(db, "users", friendId);
        const friendDoc = await getDoc(friendRef);
        
        if (friendDoc.exists()) {
          const friendData = friendDoc.data();
          leaderboard.push({
            id: friendId,
            displayName: friendData.displayName,
            photoURL: friendData.photoURL,
            isCurrentUser: false,
            streak: friendData.stats?.streak || 0,
            todayCount: friendData.stats?.todayCount || 0,
            totalApplications: friendData.stats?.appliedJobs?.length || 0
          });
        }
      }
      
      // Sort by streak, then by today's applications
      return leaderboard.sort((a, b) => {
        if (b.streak !== a.streak) {
          return b.streak - a.streak;
        }
        return b.todayCount - a.todayCount;
      });
    }
    
    return [];
  } catch (error) {
    console.error("Error getting leaderboard:", error);
    throw error;
  }
};

// Chart data
export const getApplicationsChartData = async (userId: string, days = 7) => {
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const appliedJobs = userData.stats?.appliedJobs || [];
      
      // Generate dates for the past N days
      const dates = [];
      const labels = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateString = date.toISOString().split('T')[0];
        dates.push(dateString);
        
        // Format date for display (e.g., "Mon 12")
        const options: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric' };
        labels.push(date.toLocaleDateString('en-US', options));
      }
      
      // Count applications per day
      const counts = dates.map(date => {
        return appliedJobs.filter((job: any) => job.date === date).length;
      });
      
      return {
        labels,
        datasets: [
          {
            label: 'Applications',
            data: counts,
            backgroundColor: 'rgba(99, 102, 241, 0.5)',
            borderColor: 'rgb(99, 102, 241)',
            borderWidth: 1,
            borderRadius: 4,
            barThickness: 16
          }
        ]
      };
    }
    
    return null;
  } catch (error) {
    console.error("Error getting chart data:", error);
    throw error;
  }
};

// Recent applications
export const getRecentApplications = async (userId: string, limit = 5) => {
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const appliedJobs = userData.stats?.appliedJobs || [];
      
      // Sort by timestamp (newest first) and limit
      return appliedJobs
        .sort((a: any, b: any) => b.timestamp.toMillis() - a.timestamp.toMillis())
        .slice(0, limit);
    }
    
    return [];
  } catch (error) {
    console.error("Error getting recent applications:", error);
    throw error;
  }
};

// Helper to format timestamp
export const formatApplicationTime = (timestamp: Timestamp) => {
  const now = new Date();
  const date = timestamp.toDate();
  const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffMinutes < 1) {
    return 'Just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  } else if (diffMinutes < 1440) {
    const hours = Math.floor(diffMinutes / 60);
    return `${hours}h ago`;
  } else {
    const days = Math.floor(diffMinutes / 1440);
    if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return `${days}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  }
};