import type { Express } from "express";
import type { Server } from "http";
import { setupAuth, hashPassword } from "./auth";
import { storage } from "./storage";
import { api } from "@shared/routes";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
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

  // جلب كل المستخدمين (للآدمن فقط)
  app.get("/api/users", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") return res.sendStatus(403);
    const users = await storage.getAllUsers();
    res.json(users);
  });

  // تحديث البروفايل الشخصي
  app.patch("/api/users/profile", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const updatedUser = await storage.updateUser(req.user.id, req.body);
    res.json(updatedUser);
  });

  // --- ميزة الحذف الجديدة ---
  app.delete("/api/users/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") return res.sendStatus(403);
    const id = parseInt(req.params.id);
    
    // منع الآدمن من حذف نفسه بالخطأ
    if (id === req.user.id) {
      return res.status(400).send("لا يمكنك حذف حسابك الشخصي من هنا");
    }

    await storage.deleteUser(id);
    res.sendStatus(200);
  });

  // --- Task Routes ---
  app.get("/api/tasks", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const tasks = req.user.role === "admin" 
      ? await storage.getTasks() 
      : await storage.getTasksByAssignee(req.user.id);
    res.json(tasks);
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
    if (req.user.role !== "admin" && task.assigneeId !== req.user.id) return res.sendStatus(403);

    const parsed = api.tasks.update.input.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);
    const updatedTask = await storage.updateTask(id, parsed.data);
    res.json(updatedTask);
  });

  return httpServer;
}
