import dotenv from "dotenv";

dotenv.config();

const required = ["MONGO_URI", "JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET"] as const;
const DEFAULT_FRONTEND_URLS = ["http://localhost:3000", "https://edu-manage-xi.vercel.app"];

const normalizeUrl = (url: string) => url.trim().replace(/\/+$/, "").toLowerCase();

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGO_URI as string,
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET as string,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET as string,
  accessTokenExpiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m",
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
  frontendUrls: [
    ...(process.env.FRONTEND_URLS || process.env.FRONTEND_URL || "")
      .split(",")
      .map((url) => url.trim())
      .filter(Boolean),
    ...DEFAULT_FRONTEND_URLS,
  ].map(normalizeUrl),
};
