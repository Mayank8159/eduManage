"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const roles_1 = require("../constants/roles");
const asyncHandler_1 = require("../utils/asyncHandler");
const auth_service_1 = require("../services/auth.service");
const router = (0, express_1.Router)();
const registerSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2),
        email: zod_1.z.string().email(),
        password: zod_1.z.string().min(6),
        role: zod_1.z.enum([roles_1.ROLES.PRINCIPAL, roles_1.ROLES.TEACHER, roles_1.ROLES.STUDENT]),
    }),
    params: zod_1.z.object({}),
    query: zod_1.z.object({}),
});
const loginSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email(),
        password: zod_1.z.string().min(6),
    }),
    params: zod_1.z.object({}),
    query: zod_1.z.object({}),
});
const refreshSchema = zod_1.z.object({
    body: zod_1.z.object({ refreshToken: zod_1.z.string().min(10) }),
    params: zod_1.z.object({}),
    query: zod_1.z.object({}),
});
router.post("/register", (0, validate_1.validate)(registerSchema), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const response = await (0, auth_service_1.registerUser)(req.body);
    res.status(response.status).json(response.data);
}));
router.post("/login", (0, validate_1.validate)(loginSchema), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const response = await (0, auth_service_1.loginUser)(req.body);
    res.status(response.status).json(response.data);
}));
router.post("/refresh", (0, validate_1.validate)(refreshSchema), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const response = await (0, auth_service_1.refreshSession)(req.body.refreshToken);
    res.status(response.status).json(response.data);
}));
router.post("/logout", (0, validate_1.validate)(refreshSchema), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    await (0, auth_service_1.revokeSession)(req.body.refreshToken);
    res.json({ message: "Logged out" });
}));
router.get("/me", auth_1.authenticate, (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    res.json({ user: req.user });
}));
exports.default = router;
