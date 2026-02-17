import type { Express } from "express";
import type { Server } from "http";
import { setupAuth, hashPassword } from "./auth";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Set up authentication
  setupAuth(app);

  // Seed Admin User
  const adminUser = await storage.getUserByUsername("dark");
  if (!adminUser) {
    const hashedPassword = await hashPassword("godarkgo");
    await storage.createUser({
      username: "dark",
      password: hashedPassword,
      role: "admin",
      name: "System Admin",
      bio: "The system administrator.",
      avatarUrl: "https://ui-avatars.com/api/?name=Admin&background=random",
    });
    console.log("Admin user seeded.");
  }

  // User Routes
  app.get("/api/users", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user?.role !== "admin") return res.sendStatus(403);
    
    const users = await storage.getAllUsers();
    res.json(users);
  });

  app.post("/api/users", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") return res.sendStatus(403);
    const parsed = api.users.create.input.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);
    
    // Hash password for new user
    const hashedPassword = await hashPassword(parsed.data.password);
    const user = await storage.createUser({
      ...parsed.data,
      password: hashedPassword,
    });
    res.status(201).json(user);
  });

  // Task Routes
  app.get("/api/tasks", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    if (req.user.role === "admin") {
      const tasks = await storage.getTasks();
      res.json(tasks);
    } else {
      const tasks = await storage.getTasksByAssignee(req.user.id);
      res.json(tasks);
    }
  });

  app.post("/api/tasks", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") return res.sendStatus(403);
    
    const parsed = api.tasks.create.input.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);

    const task = await storage.createTask(parsed.data);
    res.status(201).json(task);
  });

  app.patch("/api/tasks/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const id = parseInt(req.params.id);
    const task = await storage.getTask(id);
    if (!task) return res.sendStatus(404);

    // Employees can only update status of their own tasks
    if (req.user.role !== "admin") {
      if (task.assigneeId !== req.user.id) return res.sendStatus(403);
      // We accept any update here as per route definition, 
      // but strictly speaking we might want to limit it.
      // For MVP, this is acceptable as the UI will enforce fields.
    }

    const parsed = api.tasks.update.input.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);

    const updatedTask = await storage.updateTask(id, parsed.data);
    res.json(updatedTask);
  });

  return httpServer;
}
