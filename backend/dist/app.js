"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const compression_1 = __importDefault(require("compression"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const morgan_1 = __importDefault(require("morgan"));
const env_1 = require("./config/env");
const routes_1 = __importDefault(require("./routes"));
const errorHandler_1 = require("./middleware/errorHandler");
const app = (0, express_1.default)();
const normalizeOrigin = (value) => value.trim().replace(/\/+$/, "").toLowerCase();
const allowedOrigins = new Set(env_1.env.frontendUrls.map(normalizeOrigin));
const isAllowedOrigin = (origin) => {
    const normalizedOrigin = normalizeOrigin(origin);
    if (allowedOrigins.has(normalizedOrigin)) {
        return true;
    }
    // Allow Vercel preview URLs when the main Vercel deployment is in allowlist.
    if (normalizedOrigin.endsWith(".vercel.app") &&
        Array.from(allowedOrigins).some((allowed) => allowed.endsWith(".vercel.app"))) {
        return true;
    }
    return false;
};
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin(origin, callback) {
        if (!origin) {
            callback(null, true);
            return;
        }
        if (isAllowedOrigin(origin)) {
            callback(null, true);
            return;
        }
        callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use((0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
}));
app.use((0, compression_1.default)());
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use((0, morgan_1.default)("combined"));
app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "school-management-api" });
});
app.use("/api/v1", routes_1.default);
app.use(errorHandler_1.notFoundHandler);
app.use(errorHandler_1.errorHandler);
exports.default = app;
