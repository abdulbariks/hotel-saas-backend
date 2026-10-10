import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module.js";
import { AuthModule } from "../auth/auth.module.js";
import { TenantsController } from "./tenants.controller.js";
import { TenantsService } from "./tenants.service.js";

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [TenantsController],
  providers: [TenantsService],
  exports: [TenantsService],
})
export class TenantsModule {}