import { Body, Controller, Post } from "@nestjs/common";
import { AuthService } from "./auth.service.js";
import { LoginDto, RegisterDto } from "./dto/index.js";

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
}
