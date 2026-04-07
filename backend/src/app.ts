import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import { env } from "./config/env";
import apiRoutes from "./routes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

const app = express();
const normalizeOrigin = (value: string) => value.trim().replace(/\/+$/, "").toLowerCase();
const allowedOrigins = new Set(env.frontendUrls.map(normalizeOrigin));

const isAllowedOrigin = (origin: string) => {
  const normalizedOrigin = normalizeOrigin(origin);

  if (allowedOrigins.has(normalizedOrigin)) {
    return true;
  }

  // Allow Vercel preview URLs when the main Vercel deployment is in allowlist.
  if (
    normalizedOrigin.endsWith(".vercel.app") &&
    Array.from(allowedOrigins).some((allowed) => allowed.endsWith(".vercel.app"))
  ) {
    return true;
  }

  return false;
};

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);
app.use(compression());
app.use(express.json());
app.use(cookieParser());
app.use(morgan("combined"));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "school-management-api" });
});

app.use("/api/v1", apiRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
