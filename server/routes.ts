import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from 'ws';
import { storage } from "./storage";
import { log } from "./vite";

export async function registerRoutes(app: Express): Promise<Server> {
  // API route to check server health
  app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  // Legacy API routes

  // API route to get a user by ID
  app.get('/api/users/:id', async (req, res) => {
    try {
      const user = await storage.getUser(parseInt(req.params.id));
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.status(200).json(user);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get user' });
    }
  });

  // API route to create a user
  app.post('/api/users', async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.createUser({ username, password });
      res.status(201).json(user);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create user' });
    }
  });

  // Firebase User API Routes

  // Create or update Firebase user
  app.post('/api/firebase/users', async (req, res) => {
    try {
      const { uid, email, displayName, photoURL } = req.body;
      
      if (!uid || !email || !displayName) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      // Check if user already exists
      const existingUser = await storage.getFirebaseUser(uid);
      
      if (existingUser) {
        // Update user
        const updatedUser = await storage.updateFirebaseUser(uid, { 
          email, 
          displayName, 
          photoURL: photoURL || existingUser.photoURL,
          lastActive: new Date()
        });
        return res.status(200).json(updatedUser);
      } else {
        // Create new user
        const newUser = await storage.createFirebaseUser({ 
          uid, 
          email, 
          displayName, 
          photoURL 
        });
        return res.status(201).json(newUser);
      }
    } catch (error) {
      console.error('Error creating/updating Firebase user:', error);
      res.status(500).json({ error: 'Failed to create/update user' });
    }
  });

  // Get Firebase user by UID
  app.get('/api/firebase/users/:uid', async (req, res) => {
    try {
      const user = await storage.getFirebaseUser(req.params.uid);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.status(200).json(user);
    } catch (error) {
      console.error('Error getting Firebase user:', error);
      res.status(500).json({ error: 'Failed to get user' });
    }
  });

  // Update Firebase user
  app.patch('/api/firebase/users/:uid', async (req, res) => {
    try {
      const { uid } = req.params;
      const user = await storage.getFirebaseUser(uid);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      const updatedUser = await storage.updateFirebaseUser(uid, req.body);
      res.status(200).json(updatedUser);
    } catch (error) {
      console.error('Error updating Firebase user:', error);
      res.status(500).json({ error: 'Failed to update user' });
    }
  });

  // Friends API Routes

  // Get all friends for a user
  app.get('/api/firebase/users/:uid/friends', async (req, res) => {
    try {
      const { uid } = req.params;
      const user = await storage.getFirebaseUser(uid);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      const friends = await storage.getFriends(uid);
      res.status(200).json(friends);
    } catch (error) {
      console.error('Error getting friends:', error);
      res.status(500).json({ error: 'Failed to get friends' });
    }
  });

  // Add a friend by email
  app.post('/api/firebase/users/:uid/friends', async (req, res) => {
    try {
      const { uid } = req.params;
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: 'Friend email is required' });
      }
      
      // Check if user exists
      const user = await storage.getFirebaseUser(uid);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Find friend by email
      const friend = await storage.getFirebaseUserByEmail(email);
      if (!friend) {
        // Create a new placeholder user since the friend might not be registered yet
        const newFriend = await storage.createFirebaseUser({
          uid: `friend-${Date.now()}`,
          email,
          displayName: email.split('@')[0],
          photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${email}`
        });
        
        // Add friendship
        await storage.addFriend(uid, newFriend.uid);
        
        return res.status(201).json(newFriend);
      }
      
      // Don't let users add themselves
      if (friend.uid === uid) {
        return res.status(400).json({ error: 'Cannot add yourself as a friend' });
      }
      
      // Add friend
      await storage.addFriend(uid, friend.uid);
      
      res.status(200).json(friend);
    } catch (error) {
      console.error('Error adding friend:', error);
      res.status(500).json({ error: 'Failed to add friend' });
    }
  });

  // Remove a friend
  app.delete('/api/firebase/users/:uid/friends/:friendId', async (req, res) => {
    try {
      const { uid, friendId } = req.params;
      
      // Check if user exists
      const user = await storage.getFirebaseUser(uid);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Remove friend
      await storage.removeFriend(uid, friendId);
      
      res.status(204).send();
    } catch (error) {
      console.error('Error removing friend:', error);
      res.status(500).json({ error: 'Failed to remove friend' });
    }
  });

  // Job Applications API Routes

  // Get all job applications for a user
  app.get('/api/firebase/users/:uid/applications', async (req, res) => {
    try {
      const { uid } = req.params;
      const user = await storage.getFirebaseUser(uid);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      const applications = await storage.getJobApplications(uid);
      res.status(200).json(applications);
    } catch (error) {
      console.error('Error getting job applications:', error);
      res.status(500).json({ error: 'Failed to get job applications' });
    }
  });

  // Create a job application
  app.post('/api/firebase/users/:uid/applications', async (req, res) => {
    try {
      const { uid } = req.params;
      const { title, company, url, status, tags, notes } = req.body;
      
      if (!title || !company || !url) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      // Check if user exists
      const user = await storage.getFirebaseUser(uid);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Create application
      const application = await storage.createJobApplication({
        userId: uid,
        title,
        company,
        url,
        status: status || 'applied',
        tags: tags || [],
        notes
      });
      
      // Update user stats
      const existingStats = await storage.getUserStats(uid);
      const totalApplications = (existingStats?.totalApplications || 0) + 1;
      
      // Calculate streak based on applications
      const applications = await storage.getJobApplications(uid);
      const today = new Date();
      const todayString = today.toISOString().split('T')[0];
      
      // Check if there's already an application today
      const todayApplications = applications.filter(app => 
        app.date.toISOString().split('T')[0] === todayString
      );
      
      // Only increase streak if this is the first application today
      let streak = existingStats?.streak || 0;
      if (todayApplications.length === 0) {
        streak += 1;
      }
      
      // Update user stats
      await storage.updateUserStats(uid, {
        totalApplications,
        streak,
        maxStreak: Math.max(streak, existingStats?.maxStreak || 0)
      });
      
      // Also update the totalApplications in the user record
      await storage.updateFirebaseUser(uid, { 
        totalApplications,
        streak
      });
      
      res.status(201).json(application);
    } catch (error) {
      console.error('Error creating job application:', error);
      res.status(500).json({ error: 'Failed to create job application' });
    }
  });

  // User Stats API Routes

  // Get stats for a user
  app.get('/api/firebase/users/:uid/stats', async (req, res) => {
    try {
      const { uid } = req.params;
      const user = await storage.getFirebaseUser(uid);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      const stats = await storage.getUserStats(uid);
      
      if (!stats) {
        // If no stats exist yet, create default stats
        const applications = await storage.getJobApplications(uid);
        
        const weeklyApplications = applications.filter(app => {
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return app.date >= weekAgo;
        }).length;
        
        const monthlyApplications = applications.filter(app => {
          const monthAgo = new Date();
          monthAgo.setDate(monthAgo.getDate() - 30);
          return app.date >= monthAgo;
        }).length;
        
        const defaultStats = {
          totalApplications: applications.length,
          weeklyApplications,
          monthlyApplications,
          streak: 0,
          maxStreak: 0,
          responseRate: 0
        };
        
        const newStats = await storage.updateUserStats(uid, defaultStats);
        return res.status(200).json(newStats);
      }
      
      res.status(200).json(stats);
    } catch (error) {
      console.error('Error getting user stats:', error);
      res.status(500).json({ error: 'Failed to get user stats' });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  
  // Create WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // WebSocket connection handler
  wss.on('connection', (ws) => {
    log('WebSocket client connected');
    
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        log(`WebSocket message received: ${JSON.stringify(data)}`);
        
        // Handle different message types
        switch (data.type) {
          case 'FRIEND_ADDED':
            // Notify other clients when a friend is added
            wss.clients.forEach(client => {
              if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: 'FRIEND_ADDED',
                  payload: data.payload
                }));
              }
            });
            break;
            
          case 'APPLICATION_ADDED':
            // Notify other clients when an application is added
            wss.clients.forEach(client => {
              if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: 'APPLICATION_ADDED',
                  payload: data.payload
                }));
              }
            });
            break;
            
          default:
            log(`Unknown WebSocket message type: ${data.type}`);
        }
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
      }
    });
    
    ws.on('close', () => {
      log('WebSocket client disconnected');
    });
  });

  return httpServer;
}
