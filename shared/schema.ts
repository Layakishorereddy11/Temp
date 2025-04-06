import { pgTable, text, serial, integer, boolean, timestamp, json, primaryKey, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Legacy users table for authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

// Firebase users table
export const firebaseUsers = pgTable("firebase_users", {
  uid: text("uid").primaryKey().notNull(),
  email: text("email").notNull().unique(),
  displayName: text("display_name").notNull(),
  photoURL: text("photo_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  totalApplications: integer("total_applications").default(0),
  streak: integer("streak").default(0),
  maxStreak: integer("max_streak").default(0),
  lastActive: timestamp("last_active").defaultNow().notNull(),
});

// Friends table (relationship between users)
export const friends = pgTable("friends", {
  userId: text("user_id").notNull().references(() => firebaseUsers.uid, { onDelete: 'cascade' }),
  friendId: text("friend_id").notNull().references(() => firebaseUsers.uid, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.userId, table.friendId] }),
  }
});

// Job applications table
export const jobApplications = pgTable("job_applications", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => firebaseUsers.uid, { onDelete: 'cascade' }),
  title: text("title").notNull(),
  company: text("company").notNull(),
  url: text("url").notNull(),
  date: timestamp("date").defaultNow().notNull(),
  status: text("status").notNull().default('applied'),
  tags: text("tags").array(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User statistics
export const userStats = pgTable("user_stats", {
  userId: text("user_id").primaryKey().notNull().references(() => firebaseUsers.uid, { onDelete: 'cascade' }),
  totalApplications: integer("total_applications").default(0),
  weeklyApplications: integer("weekly_applications").default(0),
  monthlyApplications: integer("monthly_applications").default(0),
  streak: integer("streak").default(0),
  maxStreak: integer("max_streak").default(0),
  responseRate: integer("response_rate").default(0),
  lastUpdate: timestamp("last_update").defaultNow().notNull(),
});

// Schemas for insertion
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertFirebaseUserSchema = createInsertSchema(firebaseUsers).pick({
  uid: true,
  email: true,
  displayName: true,
  photoURL: true,
});

export const insertFriendSchema = createInsertSchema(friends).pick({
  userId: true,
  friendId: true,
});

export const insertJobApplicationSchema = createInsertSchema(jobApplications).pick({
  userId: true,
  title: true,
  company: true,
  url: true,
  status: true,
  tags: true,
  notes: true,
});

export const insertUserStatsSchema = createInsertSchema(userStats).pick({
  userId: true,
  totalApplications: true,
  weeklyApplications: true,
  monthlyApplications: true,
  streak: true,
  maxStreak: true,
  responseRate: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertFirebaseUser = z.infer<typeof insertFirebaseUserSchema>;
export type FirebaseUser = typeof firebaseUsers.$inferSelect;

export type InsertFriend = z.infer<typeof insertFriendSchema>;
export type Friend = typeof friends.$inferSelect;

export type InsertJobApplication = z.infer<typeof insertJobApplicationSchema>;
export type JobApplication = typeof jobApplications.$inferSelect;

export type InsertUserStats = z.infer<typeof insertUserStatsSchema>;
export type UserStats = typeof userStats.$inferSelect;
