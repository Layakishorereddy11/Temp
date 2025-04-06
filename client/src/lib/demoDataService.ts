import { db, auth } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';

/**
 * Service to populate the user's Firestore data with sample data for demonstration
 */
export const demoDataService = {
  /**
   * Checks if the user exists in Firestore
   */
  async checkUserExists(userId: string): Promise<boolean> {
    const userDoc = await getDoc(doc(db, "users", userId));
    return userDoc.exists();
  },

  /**
   * Creates a new user document with default fields
   */
  async createUserDocument(userId: string, userData: any): Promise<void> {
    await setDoc(doc(db, "users", userId), {
      uid: userId,
      displayName: userData.displayName || '',
      email: userData.email || '',
      photoURL: userData.photoURL || '',
      createdAt: serverTimestamp(),
      stats: {
        todayCount: 0,
        streak: 0,
        lastUpdated: new Date().toISOString().split('T')[0],
        appliedJobs: []
      },
      friends: []
    });
  },

  /**
   * Creates sample job application data for the current user
   */
  async populateApplicationData(userId: string): Promise<void> {
    // Get current user document
    const userDoc = await getDoc(doc(db, "users", userId));
    if (!userDoc.exists()) return;

    // Generate dates for the past 30 days
    const dates = [];
    for (let i = 30; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(date);
    }

    // Sample company and job data
    const companies = [
      { name: 'TechCorp', domain: 'techcorp.com' },
      { name: 'InnovateTech', domain: 'innovatetech.io' },
      { name: 'DigitalSolutions', domain: 'digitalsolutions.co' },
      { name: 'CloudWave', domain: 'cloudwave.tech' },
      { name: 'CodeMasters', domain: 'codemasters.dev' },
      { name: 'DataInsights', domain: 'datainsights.ai' },
      { name: 'WebFrontier', domain: 'webfrontier.io' },
      { name: 'AppGenius', domain: 'appgenius.app' }
    ];

    const positions = [
      'Frontend Developer',
      'Backend Engineer',
      'Full Stack Developer',
      'UI/UX Designer',
      'Product Manager',
      'DevOps Engineer',
      'Data Scientist',
      'Mobile Developer',
      'QA Engineer',
      'Technical Writer'
    ];

    const tags = [
      ['React', 'TypeScript', 'Remote'],
      ['Node.js', 'Express', 'MongoDB'],
      ['React', 'Next.js', 'GraphQL'],
      ['Figma', 'UI/UX', 'Hybrid'],
      ['Product', 'Agile', 'Scrum'],
      ['AWS', 'Docker', 'Kubernetes'],
      ['Python', 'TensorFlow', 'Remote'],
      ['React Native', 'TypeScript', 'Mobile'],
      ['Jest', 'Cypress', 'Testing'],
      ['Technical Writing', 'Documentation', 'Remote']
    ];

    // Generate applications with progressive pattern
    // Early days (1-10): 0-2 applications per day
    // Mid days (11-20): 2-5 applications per day
    // Recent days (21-30): 5-10 applications per day
    const appliedJobs = [];
    let totalApplications = 0;
    let streakDays = 0;
    let lastApplicationDate = null;

    for (let i = 0; i < dates.length; i++) {
      const date = dates[i];
      const dateStr = date.toISOString().split('T')[0];
      
      // Determine how many applications for this day
      let applicationsCount = 0;
      if (i < 10) {
        // Early days: 0-2 applications (less activity)
        applicationsCount = Math.floor(Math.random() * 3);
      } else if (i < 20) {
        // Mid days: 2-5 applications (increasing activity)
        applicationsCount = Math.floor(Math.random() * 4) + 2;
      } else {
        // Recent days: 5-10 applications (high activity)
        applicationsCount = Math.floor(Math.random() * 6) + 5;
      }
      
      // Create applications for this day
      for (let j = 0; j < applicationsCount; j++) {
        // Select random company and position
        const company = companies[Math.floor(Math.random() * companies.length)];
        const position = positions[Math.floor(Math.random() * positions.length)];
        const tagSet = tags[Math.floor(Math.random() * tags.length)];
        
        // Generate random timestamps throughout the day
        const hours = Math.floor(Math.random() * 8) + 9; // 9 AM to 5 PM
        const minutes = Math.floor(Math.random() * 60);
        const seconds = Math.floor(Math.random() * 60);
        const applicationDate = new Date(date);
        applicationDate.setHours(hours, minutes, seconds);
        
        const title = `${position} at ${company.name}`;
        const url = `https://${company.domain}/careers/${position.toLowerCase().replace(/ /g, '-')}`;
        
        // Add the application
        appliedJobs.push({
          title,
          url,
          company: company.name,
          date: dateStr,
          timestamp: Timestamp.fromDate(applicationDate),
          lastTracked: i === dates.length - 1 && j === applicationsCount - 1, // Only the most recent is lastTracked
          tags: tagSet
        });
        
        totalApplications++;
      }
      
      // Update streak calculation
      if (applicationsCount > 0) {
        if (!lastApplicationDate || isYesterday(lastApplicationDate, date)) {
          streakDays++;
        } else if (!isYesterday(lastApplicationDate, date)) {
          // Reset streak if there's a gap
          streakDays = 1;
        }
        lastApplicationDate = date;
      }
    }
    
    // Calculate other stats
    const totalResponses = Math.floor(totalApplications * (Math.random() * 0.3 + 0.1)); // 10-40% response rate
    const responseRate = totalResponses / totalApplications;
    
    // Today's applications count (from the last day)
    const today = new Date().toISOString().split('T')[0];
    const todayCount = appliedJobs.filter(job => job.date === today).length;
    
    // Update user document with generated data
    await updateDoc(doc(db, "users", userId), {
      stats: {
        todayCount,
        streak: streakDays,
        lastUpdated: today,
        appliedJobs,
        totalResponses,
        responseRate
      }
    });
  },

  /**
   * Creates demo friend accounts if they don't exist and links them to the current user
   */
  async populateFriendsData(userId: string): Promise<void> {
    const demoFriends = [
      {
        id: 'demo-friend-1',
        displayName: 'Sarah Johnson',
        email: 'sarah.johnson@example.com',
        photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
        streak: 21,
        applications: 85
      },
      {
        id: 'demo-friend-2',
        displayName: 'Michael Chen',
        email: 'michael.chen@example.com',
        photoURL: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
        streak: 12,
        applications: 65
      },
      {
        id: 'demo-friend-3',
        displayName: 'Jessica Wilson',
        email: 'jessica.wilson@example.com',
        photoURL: 'https://images.unsplash.com/photo-1550525811-e5869dd03032?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
        streak: 8,
        applications: 42
      },
      {
        id: 'demo-friend-4',
        displayName: 'David Thompson',
        email: 'david.thompson@example.com',
        photoURL: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
        streak: 4,
        applications: 37
      }
    ];

    // Create each demo friend and connect them to the user
    const friendIds = [];
    for (const friend of demoFriends) {
      const friendDoc = await getDoc(doc(db, "users", friend.id));
      
      if (!friendDoc.exists()) {
        // Create the friend document
        await setDoc(doc(db, "users", friend.id), {
          uid: friend.id,
          displayName: friend.displayName,
          email: friend.email,
          photoURL: friend.photoURL,
          createdAt: serverTimestamp(),
          stats: await this.generateFriendStats(friend.streak, friend.applications),
          friends: [userId] // Add the current user as their friend
        });
      } else {
        // Update the friend's friends list to include the current user
        const friendData = friendDoc.data();
        const friendsList = friendData.friends || [];
        if (!friendsList.includes(userId)) {
          await updateDoc(doc(db, "users", friend.id), {
            friends: [...friendsList, userId]
          });
        }
      }
      
      friendIds.push(friend.id);
    }
    
    // Update the current user's friends list
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const existingFriends = userData.friends || [];
      const newFriends = friendIds.filter(id => !existingFriends.includes(id));
      
      if (newFriends.length > 0) {
        await updateDoc(doc(db, "users", userId), {
          friends: [...existingFriends, ...newFriends]
        });
      }
    }
  },

  /**
   * Generate realistic stats for a friend
   */
  async generateFriendStats(streakDays: number, totalApplications: number): Promise<any> {
    // Generate dates for the past 30 days
    const dates = [];
    for (let i = 30; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(date);
    }

    // Sample company and job data (same as before)
    const companies = [
      { name: 'TechCorp', domain: 'techcorp.com' },
      { name: 'InnovateTech', domain: 'innovatetech.io' },
      { name: 'DigitalSolutions', domain: 'digitalsolutions.co' },
      { name: 'CloudWave', domain: 'cloudwave.tech' },
      { name: 'CodeMasters', domain: 'codemasters.dev' }
    ];

    const positions = [
      'Frontend Developer',
      'Backend Engineer',
      'Full Stack Developer',
      'UI/UX Designer',
      'Product Manager'
    ];

    const tags = [
      ['React', 'TypeScript', 'Remote'],
      ['Node.js', 'Express', 'MongoDB'],
      ['React', 'Next.js', 'GraphQL'],
      ['Figma', 'UI/UX', 'Hybrid'],
      ['Product', 'Agile', 'Scrum']
    ];

    // Calculate daily applications needed to reach the total
    const avgApplicationsPerDay = totalApplications / streakDays;
    
    // Generate applications with a realistic pattern
    const appliedJobs = [];
    let remainingApplications = totalApplications;

    for (let i = 0; i < dates.length; i++) {
      const date = dates[i];
      const dateStr = date.toISOString().split('T')[0];
      
      // If we're in the streak days, add applications
      let applicationsCount = 0;
      if (i >= dates.length - streakDays) {
        applicationsCount = Math.min(
          Math.max(1, Math.round(avgApplicationsPerDay + (Math.random() * 4 - 2))),
          remainingApplications
        );
        remainingApplications -= applicationsCount;
      }
      
      // Create applications for this day
      for (let j = 0; j < applicationsCount; j++) {
        // Select random company and position
        const company = companies[Math.floor(Math.random() * companies.length)];
        const position = positions[Math.floor(Math.random() * positions.length)];
        const tagSet = tags[Math.floor(Math.random() * tags.length)];
        
        // Generate random timestamps throughout the day
        const hours = Math.floor(Math.random() * 8) + 9; // 9 AM to 5 PM
        const minutes = Math.floor(Math.random() * 60);
        const applicationDate = new Date(date);
        applicationDate.setHours(hours, minutes);
        
        const title = `${position} at ${company.name}`;
        const url = `https://${company.domain}/careers/${position.toLowerCase().replace(/ /g, '-')}`;
        
        // Add the application
        appliedJobs.push({
          title,
          url,
          company: company.name,
          date: dateStr,
          timestamp: Timestamp.fromDate(applicationDate),
          lastTracked: i === dates.length - 1 && j === applicationsCount - 1,
          tags: tagSet
        });
      }
    }
    
    // Calculate other stats
    const totalResponses = Math.floor(totalApplications * (Math.random() * 0.3 + 0.1)); // 10-40% response rate
    const responseRate = totalResponses / totalApplications;
    
    // Today's applications count
    const today = new Date().toISOString().split('T')[0];
    const todayCount = appliedJobs.filter(job => job.date === today).length;
    
    // Return stats object
    return {
      todayCount,
      streak: streakDays,
      lastUpdated: today,
      appliedJobs,
      totalResponses,
      responseRate
    };
  },

  /**
   * Populates everything at once
   */
  async populateAllDemoData(userId: string): Promise<boolean> {
    try {
      const exists = await this.checkUserExists(userId);
      
      if (!exists) {
        const user = auth.currentUser;
        await this.createUserDocument(userId, {
          displayName: user?.displayName,
          email: user?.email,
          photoURL: user?.photoURL
        });
      }
      
      // Populate with application data
      await this.populateApplicationData(userId);
      
      // Populate with friends data
      await this.populateFriendsData(userId);
      
      return true;
    } catch (error) {
      console.error('Error populating demo data:', error);
      return false;
    }
  }
};

// Helper function to check if two dates are consecutive
function isYesterday(date1: Date, date2: Date): boolean {
  const day1 = new Date(date1);
  const day2 = new Date(date2);
  
  // Reset hours to compare just the dates
  day1.setHours(0, 0, 0, 0);
  day2.setHours(0, 0, 0, 0);
  
  // Calculate difference in days
  const diffTime = Math.abs(day2.getTime() - day1.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays === 1;
}