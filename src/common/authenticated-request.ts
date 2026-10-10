import type { Request } from "express";
import type { MembershipRole } from "../generated/prisma/client.js";

export interface AuthenticatedRequest extends Request {
  user: {
    sub: string;
    tenantId: string;
    role: MembershipRole;
  };
}