import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { cacheService } from "./cache-service";
import { hashtagService } from "./hashtag-service";

// Validate required environment variables
function validateEnvironment() {
  const requiredEnvVars = ['DATABASE_URL', 'SESSION_SECRET'];
  const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingEnvVars.length > 0) {
    console.error(`❌ Missing required environment variables: ${missingEnvVars.join(', ')}`);
    console.error('');
    console.error('Please set these variables:');
    console.error('  - In Railway: Go to your service → Variables tab');
    console.error('  - Locally: Create a .env file with the required variables');
    console.error('');
    console.error('Required variables:');
    console.error('  DATABASE_URL: PostgreSQL connection string');
    console.error('  SESSION_SECRET: Random secret key (at least 32 characters)');
    console.error('');
    console.error('To generate a SESSION_SECRET, run:');
    console.error('  node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
    process.exit(1);
  }
  
  // Validate NODE_ENV is set (warn if not, don't fail)
  if (!process.env.NODE_ENV) {
    console.warn('⚠️  Warning: NODE_ENV is not set. Defaulting to development mode.');
  }
  
  log('✅ Environment variables validated successfully');
}

// Run validation in production or when DATABASE_URL is expected
if (process.env.NODE_ENV === 'production' || process.env.DATABASE_URL) {
  validateEnvironment();
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Initialize cache service
  await cacheService.initialize();
  
  // Initialize hashtag service
  await hashtagService.initialize();
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    log('SIGTERM signal received: closing connections');
    await cacheService.close();
    await hashtagService.close();
    process.exit(0);
  });
})();
