import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import * as argon2 from "argon2";
import { PrismaService } from "../prisma/prisma.service.js";
import { LoginDto, RegisterDto } from "./dto/index.js";

export interface AuthTokens {
  access_token: string;
}

@Injectable()
export class AuthService {
  private readonly argon2Options = {
    type: 2,
    memoryCost: 2 ** 16,
    timeCost: 3,
    parallelism: 1,
  } as unknown as import("argon2").HashOptions;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async register(data: RegisterDto): Promise<AuthTokens> {
    const existing = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      throw new ConflictException("Email already registered");
    }

    const passwordHash = await argon2.hash(data.password, this.argon2Options);

    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        password: passwordHash,
      },
    });

    return this.generateTokens(user.id);
  }

  async login(data: LoginDto): Promise<AuthTokens> {
    const user = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const passwordValid = await argon2.verify(
      user.password,
      data.password,
    );

    if (!passwordValid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    return this.generateTokens(user.id);
  }

  private generateTokens(userId: string): AuthTokens {
    const access_token = this.jwtService.sign(
      { sub: userId },
      {
        expiresIn: "7d",
      },
    );

    return { access_token };
  }
}