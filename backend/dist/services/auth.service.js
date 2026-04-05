"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerUser = registerUser;
exports.loginUser = loginUser;
exports.refreshSession = refreshSession;
exports.revokeSession = revokeSession;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const http_status_codes_1 = require("http-status-codes");
const User_1 = require("../models/User");
const RefreshToken_1 = require("../models/RefreshToken");
const jwt_1 = require("../utils/jwt");
function hashToken(token) {
    return crypto_1.default.createHash("sha256").update(token).digest("hex");
}
async function registerUser(input) {
    const exists = await User_1.User.findOne({ email: input.email });
    if (exists) {
        return { status: http_status_codes_1.StatusCodes.CONFLICT, data: { message: "Email already exists" } };
    }
    const hashedPassword = await bcryptjs_1.default.hash(input.password, 10);
    const user = await User_1.User.create({ ...input, password: hashedPassword });
    return {
        status: http_status_codes_1.StatusCodes.CREATED,
        data: {
            message: "User registered",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        },
    };
}
async function loginUser(input) {
    const user = await User_1.User.findOne({ email: input.email });
    if (!user) {
        return { status: http_status_codes_1.StatusCodes.UNAUTHORIZED, data: { message: "Invalid credentials" } };
    }
    const valid = await bcryptjs_1.default.compare(input.password, user.password);
    if (!valid) {
        return { status: http_status_codes_1.StatusCodes.UNAUTHORIZED, data: { message: "Invalid credentials" } };
    }
    const payload = {
        id: String(user._id),
        role: user.role,
        email: user.email,
        name: user.name,
    };
    const accessToken = (0, jwt_1.signAccessToken)(payload);
    const refreshToken = (0, jwt_1.signRefreshToken)(payload);
    await RefreshToken_1.RefreshToken.create({
        user: user._id,
        tokenHash: hashToken(refreshToken),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    });
    return {
        status: http_status_codes_1.StatusCodes.OK,
        data: {
            message: "Login successful",
            accessToken,
            refreshToken,
            user: payload,
        },
    };
}
async function refreshSession(refreshToken) {
    try {
        const payload = (0, jwt_1.verifyRefreshToken)(refreshToken);
        const tokenHash = hashToken(refreshToken);
        const stored = await RefreshToken_1.RefreshToken.findOne({ tokenHash, revokedAt: { $exists: false } });
        if (!stored) {
            return { status: http_status_codes_1.StatusCodes.UNAUTHORIZED, data: { message: "Invalid refresh token" } };
        }
        if (stored.expiresAt < new Date()) {
            return { status: http_status_codes_1.StatusCodes.UNAUTHORIZED, data: { message: "Refresh token expired" } };
        }
        const accessToken = (0, jwt_1.signAccessToken)(payload);
        return { status: http_status_codes_1.StatusCodes.OK, data: { accessToken } };
    }
    catch {
        return { status: http_status_codes_1.StatusCodes.UNAUTHORIZED, data: { message: "Invalid refresh token" } };
    }
}
async function revokeSession(refreshToken) {
    const tokenHash = hashToken(refreshToken);
    await RefreshToken_1.RefreshToken.findOneAndUpdate({ tokenHash }, { revokedAt: new Date() });
}
