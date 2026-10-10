import { Test, TestingModule } from "@nestjs/testing";
import { ValidationPipe } from "@nestjs/common";
import { PrismaService } from "./prisma/prisma.service.js";
import { RoomsService } from "./rooms/rooms.service.js";
import { BookingsService } from "./bookings/bookings.service.js";
import { TenantsService } from "./tenants/tenants.service.js";
import { CreateRoomDto } from "./rooms/dto/room.dto.js";
import { CreateTenantDto } from "./tenants/dto/tenant.dto.js";
import { RegisterDto } from "./auth/dto/auth.dto.js";
import { CreateBookingDto } from "./bookings/dto/booking.dto.js";

describe("DTO validation", () => {
  let validationPipe: ValidationPipe;

  beforeEach(async () => {
    await Test.createTestingModule({
      providers: [],
    }).compile();

    validationPipe = new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    });
  });

  it("CreateRoomDto rejects invalid price", async () => {
    await expect(
      validationPipe.transform(
        { name: "101", type: "Deluxe", price: -5, capacity: 2 },
        { metatype: CreateRoomDto, type: "body" } as any,
      ),
    ).rejects.toBeDefined();
  });

  it("CreateRoomDto accepts valid payload", async () => {
    const result = (await validationPipe.transform(
      { name: "101", type: "Deluxe", price: 3500, capacity: 2 },
      { metatype: CreateRoomDto, type: "body" } as any,
    )) as CreateRoomDto;

    expect(result.name).toBe("101");
    expect(result.price).toBe(3500);
  });

  it("CreateTenantDto rejects short slug", async () => {
    await expect(
      validationPipe.transform(
        { name: "Hotel", slug: "a" },
        { metatype: CreateTenantDto, type: "body" } as any,
      ),
    ).rejects.toBeDefined();
  });

  it("RegisterDto rejects weak password", async () => {
    await expect(
      validationPipe.transform(
        { email: "bad-email", password: "123" },
        { metatype: RegisterDto, type: "body" } as any,
      ),
    ).rejects.toBeDefined();
  });

  it("CreateBookingDto rejects invalid email", async () => {
    await expect(
      validationPipe.transform(
        {
          roomId: "abc",
          guestName: "Test",
          guestEmail: "not-an-email",
          checkIn: "2026-11-12",
          checkOut: "2026-11-10",
          guests: 2,
        },
        { metatype: CreateBookingDto, type: "body" } as any,
      ),
    ).rejects.toBeDefined();
  });
});

describe("Booking date parsing", () => {
  let bookingsService: BookingsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        {
          provide: PrismaService,
          useValue: {
            $transaction: () => {
              throw new Error("not used");
            },
            $queryRaw: () => Promise.resolve(null),
            room: { findFirst: () => Promise.resolve(null) },
            booking: { findFirst: () => Promise.resolve(null) },
          },
        },
      ],
    }).compile();

    bookingsService = module.get<BookingsService>(BookingsService);
  });

  it("rejects malformed date strings", async () => {
    await expect(
      bookingsService.create("tenant-1", {
        roomId: "room-1",
        guestName: "Test",
        guestEmail: "test@example.com",
        checkIn: "not-a-date",
        checkOut: "2026-11-12",
        guests: 2,
      }),
    ).rejects.toBeDefined();
  });
});

describe("Service instantiation", () => {
  it("RoomsService is defined", async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomsService,
        {
          provide: PrismaService,
          useValue: {
            room: {
              findMany: () => Promise.resolve([]),
              findFirst: () => Promise.resolve(null),
              create: () => Promise.resolve({}),
              update: () => Promise.resolve({}),
              delete: () => Promise.resolve({}),
            },
          },
        },
      ],
    }).compile();

    expect(module.get<RoomsService>(RoomsService)).toBeDefined();
  });

  it("TenantsService is defined", async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantsService,
        {
          provide: PrismaService,
          useValue: {
            tenant: { findUnique: () => Promise.resolve(null), create: () => Promise.resolve({}) },
            membership: {
              findFirst: () => Promise.resolve(null),
              findMany: () => Promise.resolve([]),
              create: () => Promise.resolve({}),
            },
            $transaction: () => Promise.resolve({}),
          },
        },
      ],
    }).compile();

    expect(module.get<TenantsService>(TenantsService)).toBeDefined();
  });
});