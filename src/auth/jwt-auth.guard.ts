import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Request } from "express";
import { JwtService } from "@nestjs/jwt";
import type { User, MembershipRole } from "../generated/prisma/client.js";
import { PrismaService } from "../prisma/prisma.service.js";
import type { AuthenticatedRequest } from "../common/authenticated-request.js";

export interface JwtUser {
  sub: string;
}

const TENANT_HEADER = "x-tenant-id";

@Injectable()
export class JwtAuthToken implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const token = extractBearerToken(req);

    if (!token) {
      throw new UnauthorizedException("Missing bearer token");
    }

    let payload: JwtUser;
    try {
      payload = this.jwtService.verify<JwtUser>(token);
    } catch {
      throw new UnauthorizedException("Invalid token");
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException("Invalid token");
    }

    (req as any).user = user;
    return true;
  }
}

export interface TenantContextOptions {
  headerName?: string;
  allowParam?: string;
}

@Injectable()
export class TenantContextGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const user = (req as any).user as User | undefined;

    if (!user) {
      throw new UnauthorizedException("Authentication required");
    }

    const tenantId = readHeader(req, TENANT_HEADER);

    if (!tenantId) {
      throw new ForbiddenException("Tenant context is required");
    }

    const membership = await this.prisma.membership.findFirst({
      where: { tenantId, userId: user.id },
    });

    if (!membership) {
      throw new ForbiddenException("You are not a member of this tenant");
    }

    const authReq = req as AuthenticatedRequest;
    authReq.user = {
      sub: user.id,
      tenantId: membership.tenantId,
      role: membership.role,
    };

    return true;
  }
}

function readHeader(req: Request, name: string): string | undefined {
  const value = req.headers[name];

  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function extractBearerToken(req: Request): string | undefined {
  const header = req.headers.authorization;

  if (!header) {
    return undefined;
  }

  const [scheme, token] = header.split(" ");

  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return undefined;
  }

  return token;
}

export type { MembershipRole };