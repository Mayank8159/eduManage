import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { ROLES } from "../constants/roles";
import { asyncHandler } from "../utils/asyncHandler";
import { loginUser, refreshSession, registerUser, revokeSession } from "../services/auth.service";

const router = Router();

const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    role: z.enum([ROLES.PRINCIPAL, ROLES.TEACHER, ROLES.STUDENT]),
  }),
  params: z.object({}),
  query: z.object({}),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6),
  }),
  params: z.object({}),
  query: z.object({}),
});

const refreshSchema = z.object({
  body: z.object({ refreshToken: z.string().min(10) }),
  params: z.object({}),
  query: z.object({}),
});

router.post(
  "/register",
  validate(registerSchema),
  asyncHandler(async (req, res) => {
    const response = await registerUser(req.body);
    res.status(response.status).json(response.data);
  })
);

router.post(
  "/login",
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const response = await loginUser(req.body);
    res.status(response.status).json(response.data);
  })
);

router.post(
  "/refresh",
  validate(refreshSchema),
  asyncHandler(async (req, res) => {
    const response = await refreshSession(req.body.refreshToken);
    res.status(response.status).json(response.data);
  })
);

router.post(
  "/logout",
  validate(refreshSchema),
  asyncHandler(async (req, res) => {
    await revokeSession(req.body.refreshToken);
    res.json({ message: "Logged out" });
  })
);

router.get(
  "/me",
  authenticate,
  asyncHandler(async (req, res) => {
    res.json({ user: req.user });
  })
);

export default router;
