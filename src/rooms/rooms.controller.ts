import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { RoomsService } from "./rooms.service.js";
import { CreateRoomDto, UpdateRoomDto } from "./dto/index.js";
import { JwtAuthToken, TenantContextGuard } from "../auth/jwt-auth.guard.js";
import { RolesGuard, Roles } from "../common/guards/role.guard.js";
import type { AuthenticatedRequest } from "../common/authenticated-request.js";

@Controller("rooms")
@UseGuards(JwtAuthToken, TenantContextGuard, RolesGuard)
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Get()
  findAll(@Req() req: AuthenticatedRequest) {
    return this.roomsService.findAll(req.user.tenantId);
  }

  @Get(":id")
  findOne(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.roomsService.findOne(req.user.tenantId, id);
  }

  @Post()
  @Roles("OWNER", "ADMIN")
  create(
    @Req() req: AuthenticatedRequest,
    @Body() body: CreateRoomDto,
  ) {
    return this.roomsService.create(req.user.tenantId, body);
  }

  @Patch(":id")
  @Roles("OWNER", "ADMIN")
  update(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() body: UpdateRoomDto,
  ) {
    return this.roomsService.update(req.user.tenantId, id, body);
  }

  @Delete(":id")
  @Roles("OWNER", "ADMIN")
  remove(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.roomsService.remove(req.user.tenantId, id);
  }
}