import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";
import { TenantsService } from "./tenants.service.js";
import { CreateTenantDto } from "./dto/index.js";
import { JwtAuthToken, TenantContextGuard } from "../auth/jwt-auth.guard.js";
import type { AuthenticatedRequest } from "../common/authenticated-request.js";

@Controller("tenants")
@UseGuards(JwtAuthToken)
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  create(@Req() req: Request, @Body() body: CreateTenantDto) {
    const user = (req as any).user as { id: string };
    return this.tenantsService.create(user.id, body);
  }

  @Get()
  list(@Req() req: Request) {
    const user = (req as any).user as { id: string };
    return this.tenantsService.listForUser(user.id);
  }

  @Get("current")
  @UseGuards(TenantContextGuard)
  current(@Req() req: AuthenticatedRequest) {
    return this.tenantsService.getCurrentForUser(req.user.sub);
  }
}