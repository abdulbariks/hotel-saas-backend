import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import request from "supertest";
import { App } from "supertest/types.js";
import { AppModule } from "../src/app.module.js";
import { PrismaService } from "../src/prisma/prisma.service.js";

describe("AppController (e2e)", () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        $connect: () => Promise.resolve(),
        $disconnect: () => Promise.resolve(),
        $queryRaw: () => Promise.resolve([]),
        room: { findMany: () => Promise.resolve([]), findFirst: () => Promise.resolve(null) },
        booking: { findMany: () => Promise.resolve([]), findFirst: () => Promise.resolve(null) },
        tenant: { findUnique: () => Promise.resolve(null), create: () => Promise.resolve({}) },
        membership: {
          findFirst: () => Promise.resolve(null),
          findMany: () => Promise.resolve([]),
          create: () => Promise.resolve({}),
        },
        user: { findUnique: () => Promise.resolve(null), create: () => Promise.resolve({}) },
        $transaction: () => Promise.resolve({}),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix("api/v1");
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  it("rejects unauthenticated requests with 401", () => {
    return request(app.getHttpServer())
      .get("/api/v1/rooms")
      .expect(401);
  });

  afterEach(async () => {
    await app.close();
  });
});