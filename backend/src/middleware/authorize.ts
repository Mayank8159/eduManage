import type { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import type { Role } from "../constants/roles";

export function authorize(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ message: "Unauthorized" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(StatusCodes.FORBIDDEN).json({ message: "Forbidden: insufficient role" });
    }

    return next();
  };
}
