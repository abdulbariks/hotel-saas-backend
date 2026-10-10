import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { MembershipRole } from "../../generated/prisma/client.js";

export const ROLES_KEY = "roles";
export const Roles = (...roles: MembershipRole[]) =>
  SetMetadata(ROLES_KEY, roles);

const ROLE_HIERARCHY: Record<MembershipRole, number> = {
  OWNER: 100,
  ADMIN: 80,
  RECEPTIONIST: 60,
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.get<MembershipRole[]>(
      ROLES_KEY,
      context.getHandler(),
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const req = context.switchToHttp().getRequest();
    const user = req.user as { role?: MembershipRole } | undefined;

    if (!user?.role) {
      throw new ForbiddenException("User context is required");
    }

    const hasRole = requiredRoles.some(
      (role) => ROLE_HIERARCHY[user.role!] >= ROLE_HIERARCHY[role],
    );

    if (!hasRole) {
      throw new ForbiddenException("Insufficient permissions");
    }

    return true;
  }
}
