import { db, auth } from "./firebase";
import { 
  doc, 
  updateDoc, 
  Timestamp, 
  arrayUnion, 
  getDoc, 
  setDoc, 
  collection, 
  where, 
  query, 
  getDocs 
} from "firebase/firestore";
import { JobApplication, ApplicationStats, Friend } from "@/types";

/**
 * Service to generate demo data for testing the application
 */
export const demoDataService = {
  /**
   * Generate and insert demo job applications for the current user
   */
  async generateDemoData(userId: string): Promise<ApplicationStats> {
    if (!userId) throw new Error("User ID is required");
    
    // Get the user document
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error("User document not found");
    }
    
    // Generate demo job applications
    const today = new Date();
    const applications: JobApplication[] = [];
    
    // For the past 14 days
    for (let i = 0; i < 14; i++) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      
      // Generate 0-3 applications per day
      const count = Math.floor(Math.random() * 4);
      
      for (let j = 0; j < count; j++) {
        const application: JobApplication = {
          url: this.getDemoJobURL(),
          title: this.getDemoJobTitle(),
          company: this.getDemoCompany(),
          date: dateString,
          timestamp: Timestamp.fromDate(new Date(date.getTime() - j * 3600000)),
          lastTracked: i === 0 && j === 0, // Mark the most recent as lastTracked
          tags: this.getDemoTags(),
          status: this.getDemoStatus()
        };
        
        applications.push(application);
      }
    }
    
    // Sort by timestamp (newest first)
    applications.sort((a, b) => 
      b.timestamp.toMillis() - a.timestamp.toMillis()
    );
    
    // Calculate streak and today's count
    const todayString = today.toISOString().split('T')[0];
    const todayCount = applications.filter(app => app.date === todayString).length;
    
    // Calculate streak (consecutive days with at least one application)
    let streak = 0;
    const daysWithApplications = new Set(applications.map(app => app.date));
    
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      
      if (daysWithApplications.has(dateString)) {
        streak++;
      } else {
        break;
      }
    }
    
    // Update user document with demo data
    const stats: ApplicationStats = {
      todayCount,
      streak,
      lastUpdated: todayString,
      appliedJobs: applications,
      totalResponses: Math.floor(applications.length * 0.3),
      responseRate: 30
    };
    
    await updateDoc(userRef, { stats });
    
    return stats;
  },
  
  /**
   * Generate demo friends for the current user
   */
  async generateDemoFriends(userId: string): Promise<Friend[]> {
    if (!userId) throw new Error("User ID is required");
    
    // Get the user document
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error("User document not found");
    }
    
    // Create demo friends
    const demoFriends: { 
      id: string; 
      name: string; 
      email: string; 
      stats: ApplicationStats; 
    }[] = [
      {
        id: "demo-friend-1",
        name: "Alex Johnson",
        email: "alex.j@example.com",
        stats: this.generateUserStats(5, 12)
      },
      {
        id: "demo-friend-2",
        name: "Sam Rivera",
        email: "sam.r@example.com",
        stats: this.generateUserStats(3, 8)
      },
      {
        id: "demo-friend-3",
        name: "Taylor Kim",
        email: "taylor.k@example.com",
        stats: this.generateUserStats(7, 21)
      }
    ];
    
    // Create friend documents in Firestore
    const friendIds: string[] = [];
    
    for (const friend of demoFriends) {
      const friendRef = doc(db, "users", friend.id);
      const friendDoc = await getDoc(friendRef);
      
      // Only create if it doesn't exist
      if (!friendDoc.exists()) {
        await setDoc(friendRef, {
          uid: friend.id,
          displayName: friend.name,
          email: friend.email,
          photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.id}`,
          createdAt: Timestamp.now(),
          stats: friend.stats,
          friends: [userId] // Connect with the current user
        });
      }
      
      friendIds.push(friend.id);
    }
    
    // Update user's friends list
    await updateDoc(userRef, {
      friends: [...friendIds]
    });
    
    // Return the created friends
    const friends: Friend[] = demoFriends.map(f => ({
      id: f.id,
      displayName: f.name,
      email: f.email,
      photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${f.id}`,
      stats: f.stats,
      isOnline: Math.random() > 0.5,
      lastActive: Timestamp.now()
    }));
    
    return friends;
  },
  
  /**
   * Helper to generate user stats
   */
  generateUserStats(streak: number, totalApplications: number): ApplicationStats {
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    const applications: JobApplication[] = [];
    
    // Generate applications for the streak duration
    for (let i = 0; i < streak; i++) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      
      // Generate 1-3 applications per day
      const count = Math.floor(Math.random() * 3) + 1;
      
      for (let j = 0; j < count; j++) {
        applications.push({
          url: this.getDemoJobURL(),
          title: this.getDemoJobTitle(),
          company: this.getDemoCompany(),
          date: dateString,
          timestamp: Timestamp.fromDate(new Date(date.getTime() - j * 3600000)),
          lastTracked: i === 0 && j === 0,
          tags: this.getDemoTags(),
          status: this.getDemoStatus()
        });
      }
    }
    
    // Generate more random applications if needed
    while (applications.length < totalApplications) {
      const daysAgo = streak + Math.floor(Math.random() * 10);
      const date = new Date();
      date.setDate(today.getDate() - daysAgo);
      const dateString = date.toISOString().split('T')[0];
      
      applications.push({
        url: this.getDemoJobURL(),
        title: this.getDemoJobTitle(),
        company: this.getDemoCompany(),
        date: dateString,
        timestamp: Timestamp.fromDate(date),
        lastTracked: false,
        tags: this.getDemoTags(),
        status: this.getDemoStatus()
      });
    }
    
    // Sort by timestamp (newest first)
    applications.sort((a, b) => 
      b.timestamp.toMillis() - a.timestamp.toMillis()
    );
    
    return {
      todayCount: applications.filter(app => app.date === todayString).length,
      streak,
      lastUpdated: todayString,
      appliedJobs: applications,
      totalResponses: Math.floor(totalApplications * 0.3),
      responseRate: 30
    };
  },
  
  /**
   * Helper functions to generate random job data
   */
  getDemoJobTitle(): string {
    const titles = [
      "Software Developer",
      "Frontend Engineer",
      "Full Stack Developer",
      "React Developer",
      "Software Engineer",
      "Web Developer",
      "UI Developer",
      "JavaScript Developer",
      "TypeScript Developer",
      "Junior Developer",
      "Senior Developer",
      "Mobile Developer",
      "DevOps Engineer",
      "Backend Developer",
      "React Native Developer"
    ];
    
    return titles[Math.floor(Math.random() * titles.length)];
  },
  
  getDemoCompany(): string {
    const companies = [
      "Google",
      "Microsoft",
      "Amazon",
      "Apple",
      "Meta",
      "Netflix",
      "Airbnb",
      "Dropbox",
      "Shopify",
      "Spotify",
      "Twitter",
      "LinkedIn",
      "Uber",
      "Lyft",
      "Square",
      "Stripe",
      "Slack",
      "GitHub",
      "Atlassian",
      "Adobe"
    ];
    
    return companies[Math.floor(Math.random() * companies.length)];
  },
  
  getDemoJobURL(): string {
    const domains = [
      "linkedin.com",
      "indeed.com",
      "glassdoor.com",
      "monster.com",
      "angellist.com",
      "hired.com",
      "dice.com",
      "zip-recruiter.com",
      "stackoverflow.com",
      "wellfound.com",
      "remote-ok.com"
    ];
    
    const domain = domains[Math.floor(Math.random() * domains.length)];
    const id = Math.floor(10000000 + Math.random() * 90000000);
    
    return `https://www.${domain}/jobs/${id}`;
  },
  
  getDemoTags(): string[] {
    const allTags = [
      "Remote",
      "In-Office",
      "Hybrid",
      "Full-Time",
      "Contract",
      "Part-Time",
      "Entry-Level",
      "Mid-Level",
      "Senior",
      "JavaScript",
      "React",
      "Node",
      "TypeScript",
      "Python",
      "Java",
      "C#",
      "SQL",
      "AWS",
      "DevOps"
    ];
    
    const tags: string[] = [];
    const numTags = 1 + Math.floor(Math.random() * 3); // 1-3 tags
    
    for (let i = 0; i < numTags; i++) {
      const randomTag = allTags[Math.floor(Math.random() * allTags.length)];
      if (!tags.includes(randomTag)) {
        tags.push(randomTag);
      }
    }
    
    return tags;
  },
  
  getDemoStatus(): 'applied' | 'interviewing' | 'rejected' | 'offer' | 'accepted' {
    const statuses: ('applied' | 'interviewing' | 'rejected' | 'offer' | 'accepted')[] = [
      'applied',
      'interviewing',
      'rejected',
      'offer',
      'accepted'
    ];
    
    // More likely to be 'applied' than other statuses
    const random = Math.random();
    if (random < 0.7) {
      return 'applied';
    } else {
      return statuses[Math.floor(random * 4) + 1];
    }
  }
};