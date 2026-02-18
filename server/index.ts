import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { db } from "./db"; 
import { users } from "@shared/schema"; 
import { eq, sql } from "drizzle-orm"; 

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _req, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // --- حل شامل لكل الجداول (إصلاح قسم المهام والدخول) ---
  try {
    // 1. إنشاء كل الجداول الناقصة أوتوماتيكياً
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "session" ("sid" varchar PRIMARY KEY, "sess" json NOT NULL, "expire" timestamp NOT NULL);
      CREATE TABLE IF NOT EXISTS "users" ("id" serial PRIMARY KEY, "username" text UNIQUE NOT NULL, "password" text NOT NULL, "role" text DEFAULT 'employee', "name" text NOT NULL, "bio" text, "avatar_url" text, "created_at" timestamp DEFAULT now());
      CREATE TABLE IF NOT EXISTS "tasks" ("id" serial PRIMARY KEY, "title" text NOT NULL, "description" text NOT NULL, "due_date" timestamp NOT NULL, "status" text DEFAULT 'pending', "assignee_id" integer REFERENCES "users"("id"), "created_at" timestamp DEFAULT now());
    `);
    log("جميع الجداول (جلسات، مستخدمين، مهام) جاهزة ✅");

    // 2. إضافة إدمن "dark" لو مش موجود
    const existingUser = await db.select().from(users).where(eq(users.username, "dark")).limit(1);
    if (existingUser.length === 0) {
      await db.insert(users).values({
        username: "dark",
        password: "godarkgo", 
        role: "admin",
        name: "Dark Admin"
      });
      log("تم إنشاء مستخدم الإدمن 'dark' بنجاح ✅");
    }
  } catch (err) {
    log(`تنبيه في قاعدة البيانات: ${err}`);
  }

  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error("Internal Server Error:", err);
    if (res.headersSent) {
      return next(err);
    }
    return res.status(status).json({ message });
  });

  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
