import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { CreateTenantDto } from "./dto/index.js";
import type {
  Tenant,
  Membership,
  MembershipRole,
} from "../generated/prisma/client.js";

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: string,
    data: CreateTenantDto,
  ): Promise<Tenant> {
    const existingSlug = await this.prisma.tenant.findUnique({
      where: { slug: data.slug },
    });

    if (existingSlug) {
      throw new ConflictException("Tenant slug already taken");
    }

    return this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: data.name,
          slug: data.slug,
        },
      });

      await tx.membership.create({
        data: {
          tenantId: tenant.id,
          userId,
          role: "OWNER",
        },
      });

      return tenant;
    });
  }

  async listForUser(userId: string): Promise<Tenant[]> {
    const memberships = await this.prisma.membership.findMany({
      where: { userId },
      include: { tenant: true },
    });

    return memberships.map((m) => m.tenant).filter((t): t is Tenant => t != null);
  }

  async getCurrentForUser(userId: string): Promise<Tenant> {
    const membership = await this.prisma.membership.findFirst({
      where: { userId },
      include: { tenant: true },
    });

    if (!membership || !membership.tenant) {
      throw new NotFoundException("No tenant found for user");
    }

    return membership.tenant;
  }

  async getTenant(tenantId: string): Promise<Tenant> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException("Tenant not found");
    }

    return tenant;
  }

  async requireMembership(
    tenantId: string,
    userId: string,
  ): Promise<Membership> {
    const membership = await this.prisma.membership.findFirst({
      where: { tenantId, userId },
    });

    if (!membership) {
      throw new ForbiddenException("You are not a member of this tenant");
    }

    return membership;
  }

  async requireRole(
    tenantId: string,
    userId: string,
    allowedRoles: MembershipRole[],
  ): Promise<Membership> {
    const membership = await this.requireMembership(tenantId, userId);

    if (!allowedRoles.includes(membership.role)) {
      throw new ForbiddenException("Insufficient permissions");
    }

    return membership;
  }
}