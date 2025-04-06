import { 
  users, 
  firebaseUsers, 
  friends, 
  jobApplications, 
  userStats,
  type User, 
  type InsertUser,
  type FirebaseUser,
  type InsertFirebaseUser,
  type Friend,
  type InsertFriend,
  type JobApplication,
  type InsertJobApplication,
  type UserStats,
  type InsertUserStats
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";

export interface IStorage {
  // Legacy user methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Firebase user methods
  getFirebaseUser(uid: string): Promise<FirebaseUser | undefined>;
  getFirebaseUserByEmail(email: string): Promise<FirebaseUser | undefined>;
  createFirebaseUser(user: InsertFirebaseUser): Promise<FirebaseUser>;
  updateFirebaseUser(uid: string, data: Partial<FirebaseUser>): Promise<FirebaseUser | undefined>;
  
  // Friends methods
  getFriends(userId: string): Promise<FirebaseUser[]>;
  addFriend(userId: string, friendId: string): Promise<void>;
  removeFriend(userId: string, friendId: string): Promise<void>;
  
  // Job application methods
  getJobApplications(userId: string): Promise<JobApplication[]>;
  createJobApplication(application: InsertJobApplication): Promise<JobApplication>;
  
  // User stats methods
  getUserStats(userId: string): Promise<UserStats | undefined>;
  updateUserStats(userId: string, data: Partial<UserStats>): Promise<UserStats | undefined>;
}

export class DatabaseStorage implements IStorage {
  // Legacy user methods
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }
  
  // Firebase user methods
  async getFirebaseUser(uid: string): Promise<FirebaseUser | undefined> {
    const result = await db.select().from(firebaseUsers).where(eq(firebaseUsers.uid, uid));
    return result[0];
  }
  
  async getFirebaseUserByEmail(email: string): Promise<FirebaseUser | undefined> {
    const result = await db.select().from(firebaseUsers).where(eq(firebaseUsers.email, email));
    return result[0];
  }
  
  async createFirebaseUser(user: InsertFirebaseUser): Promise<FirebaseUser> {
    const result = await db.insert(firebaseUsers).values(user).returning();
    return result[0];
  }
  
  async updateFirebaseUser(uid: string, data: Partial<FirebaseUser>): Promise<FirebaseUser | undefined> {
    const result = await db
      .update(firebaseUsers)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(firebaseUsers.uid, uid))
      .returning();
    return result[0];
  }
  
  // Friends methods
  async getFriends(userId: string): Promise<FirebaseUser[]> {
    // Get friend IDs
    const friendRelations = await db
      .select()
      .from(friends)
      .where(eq(friends.userId, userId));
    
    if (friendRelations.length === 0) {
      return [];
    }
    
    // Get actual friend data
    const friendIds = friendRelations.map(relation => relation.friendId);
    
    // Create an array of conditions for each friendId
    const friendsData = await Promise.all(
      friendIds.map(async (friendId) => {
        const result = await db
          .select()
          .from(firebaseUsers)
          .where(eq(firebaseUsers.uid, friendId));
        return result[0];
      })
    );
    
    // Filter out any undefined results
    return friendsData.filter(Boolean);
  }
  
  async addFriend(userId: string, friendId: string): Promise<void> {
    // Check if the friendship already exists
    const existingFriendship = await db
      .select()
      .from(friends)
      .where(
        and(
          eq(friends.userId, userId),
          eq(friends.friendId, friendId)
        )
      );
    
    // Only add if it doesn't exist
    if (existingFriendship.length === 0) {
      await db.insert(friends).values({
        userId,
        friendId
      });
    }
  }
  
  async removeFriend(userId: string, friendId: string): Promise<void> {
    await db
      .delete(friends)
      .where(
        and(
          eq(friends.userId, userId),
          eq(friends.friendId, friendId)
        )
      );
  }
  
  // Job application methods
  async getJobApplications(userId: string): Promise<JobApplication[]> {
    return await db
      .select()
      .from(jobApplications)
      .where(eq(jobApplications.userId, userId))
      .orderBy(desc(jobApplications.date));
  }
  
  async createJobApplication(application: InsertJobApplication): Promise<JobApplication> {
    const result = await db
      .insert(jobApplications)
      .values(application)
      .returning();
    return result[0];
  }
  
  // User stats methods
  async getUserStats(userId: string): Promise<UserStats | undefined> {
    const result = await db
      .select()
      .from(userStats)
      .where(eq(userStats.userId, userId));
    return result[0];
  }
  
  async updateUserStats(userId: string, data: Partial<UserStats>): Promise<UserStats | undefined> {
    // Check if stats exist
    const existingStats = await this.getUserStats(userId);
    
    if (existingStats) {
      // Update existing stats
      const result = await db
        .update(userStats)
        .set({
          ...data,
          lastUpdate: new Date()
        })
        .where(eq(userStats.userId, userId))
        .returning();
      return result[0];
    } else {
      // Create new stats
      const result = await db
        .insert(userStats)
        .values({
          userId,
          ...data,
          lastUpdate: new Date()
        })
        .returning();
      return result[0];
    }
  }
}

export const storage = new DatabaseStorage();
