import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module.js";
import { AuthModule } from "../auth/auth.module.js";
import { BookingsController } from "./bookings.controller.js";
import { BookingsService } from "./bookings.service.js";

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}