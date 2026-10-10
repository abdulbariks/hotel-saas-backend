import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PassportModule } from "@nestjs/passport";
import { Reflector } from "@nestjs/core";
import { PrismaModule } from "./prisma/prisma.module.js";
import { AuthModule } from "./auth/auth.module.js";
import { TenantsModule } from "./tenants/tenants.module.js";
import { RoomsModule } from "./rooms/rooms.module.js";
import { BookingsModule } from "./bookings/bookings.module.js";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    TenantsModule,
    RoomsModule,
    BookingsModule,
    PassportModule,
  ],
  providers: [Reflector],
})
export class AppModule {}