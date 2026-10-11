import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";
import { AuthService } from "./auth.service.js";
import { LoginDto, RegisterDto } from "./dto/index.js";
import { JwtAuthToken } from "./jwt-auth.guard.js";

@Controller("auth")
export class AuthController {
  constructor(private readonly svc: AuthService) {}

  @Post("register")
  register(@Body() body: RegisterDto) {
    return this.svc.register(body);
  }

  @Post("login")
  login(@Body() body: LoginDto) {
    return this.svc.login(body);
  }

  @Get("me")
  @UseGuards(JwtAuthToken)
  me(@Req() req: Request) {
    const user = (req as unknown as { user: { id: string } }).user;
    return this.svc.getMe(user.id);
  }
}
