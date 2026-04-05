import bcrypt from "bcryptjs";
import crypto from "crypto";
import { StatusCodes } from "http-status-codes";
import { User } from "../models/User";
import { RefreshToken } from "../models/RefreshToken";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt";
import type { Role } from "../constants/roles";

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
  role: Role;
}) {
  const exists = await User.findOne({ email: input.email });
  if (exists) {
    return { status: StatusCodes.CONFLICT, data: { message: "Email already exists" } };
  }

  const hashedPassword = await bcrypt.hash(input.password, 10);
  const user = await User.create({ ...input, password: hashedPassword });

  return {
    status: StatusCodes.CREATED,
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

export async function loginUser(input: { email: string; password: string }) {
  const user = await User.findOne({ email: input.email });
  if (!user) {
    return { status: StatusCodes.UNAUTHORIZED, data: { message: "Invalid credentials" } };
  }

  const valid = await bcrypt.compare(input.password, user.password);
  if (!valid) {
    return { status: StatusCodes.UNAUTHORIZED, data: { message: "Invalid credentials" } };
  }

  const payload = {
    id: String(user._id),
    role: user.role,
    email: user.email,
    name: user.name,
  };

  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  await RefreshToken.create({
    user: user._id,
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
  });

  return {
    status: StatusCodes.OK,
    data: {
      message: "Login successful",
      accessToken,
      refreshToken,
      user: payload,
    },
  };
}

export async function refreshSession(refreshToken: string) {
  try {
    const payload = verifyRefreshToken(refreshToken);
    const tokenHash = hashToken(refreshToken);

    const stored = await RefreshToken.findOne({ tokenHash, revokedAt: { $exists: false } });
    if (!stored) {
      return { status: StatusCodes.UNAUTHORIZED, data: { message: "Invalid refresh token" } };
    }

    if (stored.expiresAt < new Date()) {
      return { status: StatusCodes.UNAUTHORIZED, data: { message: "Refresh token expired" } };
    }

    const accessToken = signAccessToken(payload);
    return { status: StatusCodes.OK, data: { accessToken } };
  } catch {
    return { status: StatusCodes.UNAUTHORIZED, data: { message: "Invalid refresh token" } };
  }
}

export async function revokeSession(refreshToken: string) {
  const tokenHash = hashToken(refreshToken);
  await RefreshToken.findOneAndUpdate({ tokenHash }, { revokedAt: new Date() });
}
