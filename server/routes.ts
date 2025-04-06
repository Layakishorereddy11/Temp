import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // API route to check server health
  app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  // API route to get all users
  app.get('/api/users', async (req, res) => {
    try {
      const users = await storage.getUsers();
      res.status(200).json(users);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get users' });
    }
  });

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

  const httpServer = createServer(app);

  return httpServer;
}
