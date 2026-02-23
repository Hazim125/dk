import type { Express } from "express";
import type { Server } from "http";
import { setupAuth, hashPassword } from "./auth";
import { storage } from "./storage";
import { api } from "@shared/routes";

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  setupAuth(app);

  // Seed Admin
  const adminUser = await storage.getUserByUsername("dark");
  if (!adminUser) {
    const hashedPassword = await hashPassword("godarkgo");
    await storage.createUser({
      username: "dark", password: hashedPassword, role: "admin",
      name: "System Admin", bio: "The system administrator.",
      avatarUrl: "https://ui-avatars.com/api/?name=Admin&background=random",
    });
  }

  // تم تعديل الصلاحية هنا: الكل يستطيع رؤية المستخدمين للتواصل
  app.get("/api/users", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const users = await storage.getAllUsers();
    res.json(users);
  });

  // تحديث البروفايل (الآن سيعمل لأن الدالة أضيفت في storage)
  app.patch("/api/users/profile", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const updatedUser = await storage.updateUser(req.user.id, req.body);
    res.json(updatedUser);
  });

  // حذف المستخدم (الآن سيعمل لأن الدالة أضيفت في storage)
  app.delete("/api/users/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") return res.sendStatus(403);
    const id = parseInt(req.params.id);
    if (id === req.user.id) return res.status(400).send("لا يمكنك حذف نفسك");
    await storage.deleteUser(id);
    res.sendStatus(200);
  });

  // مسارات المهام كما هي
  app.get("/api/tasks", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const tasks = req.user.role === "admin" ? await storage.getTasks() : await storage.getTasksByAssignee(req.user.id);
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
