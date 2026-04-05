import type { Role } from "../constants/roles";

declare global {
  namespace Express {
    interface UserPayload {
      id: string;
      role: Role;
      email: string;
      name: string;
    }

    interface Request {
      user?: UserPayload;
    }
  }
}

export {};
