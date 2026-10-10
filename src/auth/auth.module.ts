import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PassportModule } from "@nestjs/passport";
import { JwtModule } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { PrismaModule } from "../prisma/prisma.module.js";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";
import { JwtStrategy } from "./jwt.strategy.js";
import { JwtAuthToken, TenantContextGuard } from "./jwt-auth.guard.js";

@Module({
  imports: [
    PrismaModule,
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>("JWT_SECRET");

        if (!secret) {
          throw new Error("JWT_SECRET is required");
        }

        return {
          secret,
          signOptions: { expiresIn: "7d" },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthToken, TenantContextGuard],
  exports: [JwtModule, JwtAuthToken, TenantContextGuard, PassportModule],
})
export class AuthModule {}
