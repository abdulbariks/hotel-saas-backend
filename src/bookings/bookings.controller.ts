import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { BookingsService } from "./bookings.service.js";
import { CreateBookingDto } from "./dto/index.js";
import { JwtAuthToken, TenantContextGuard } from "../auth/jwt-auth.guard.js";
import type { AuthenticatedRequest } from "../common/authenticated-request.js";

@Controller("bookings")
@UseGuards(JwtAuthToken, TenantContextGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  create(@Req() req: AuthenticatedRequest, @Body() body: CreateBookingDto) {
    return this.bookingsService.create(
      req.user.tenantId,
      body,
      req.user.sub,
    );
  }

  @Get()
  findAll(@Req() req: AuthenticatedRequest) {
    return this.bookingsService.findAll(req.user.tenantId);
  }

  @Get(":id")
  findOne(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.bookingsService.findOne(req.user.tenantId, id);
  }

  @Patch(":id/cancel")
  cancel(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.bookingsService.cancel(req.user.tenantId, id);
  }
}