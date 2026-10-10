import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module.js";
import { AuthModule } from "../auth/auth.module.js";
import { RoomsController } from "./rooms.controller.js";
import { RoomsService } from "./rooms.service.js";

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [RoomsController],
  providers: [RoomsService],
  exports: [RoomsService],
})
export class RoomsModule {}