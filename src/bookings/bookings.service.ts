import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { BookingStatus } from "../generated/prisma/client.js";
import { CreateBookingDto } from "./dto/index.js";
import type { Booking, Room } from "../generated/prisma/client.js";

export interface BookingResponse {
  id: string;
  tenantId: string;
  roomId: string;
  userId: string | null;
  guestName: string;
  guestEmail: string;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  total: number;
  status: BookingStatus;
  createdAt: Date;
  room?: Room;
}

function toResponse(booking: Booking & { room?: Room }): BookingResponse {
  return {
    id: booking.id,
    tenantId: booking.tenantId,
    roomId: booking.roomId,
    userId: booking.userId,
    guestName: booking.guestName,
    guestEmail: booking.guestEmail,
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    guests: booking.guests,
    total: Number(booking.total),
    status: booking.status,
    createdAt: booking.createdAt,
    room: booking.room,
  };
}

function parseDateOnly(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    throw new BadRequestException("Invalid date format, expected YYYY-MM-DD");
  }

  const [, year, month, day] = match;
  const date = new Date(
    Date.UTC(Number(year), Number(month) - 1, Number(day)),
  );

  if (
    date.getUTCFullYear() !== Number(year) ||
    date.getUTCMonth() !== Number(month) - 1 ||
    date.getUTCDate() !== Number(day)
  ) {
    throw new BadRequestException("Invalid date value");
  }

  return date;
}

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    tenantId: string,
    data: CreateBookingDto,
    userId?: string,
  ): Promise<BookingResponse> {
    const checkIn = parseDateOnly(data.checkIn);
    const checkOut = parseDateOnly(data.checkOut);

    if (checkIn >= checkOut) {
      throw new BadRequestException("Check-out must be after check-in");
    }

    if (!Number.isInteger(data.guests) || data.guests < 1) {
      throw new BadRequestException("Invalid guest count");
    }

    return this.prisma.$transaction(async (tx) => {
      const room = await tx.room.findFirst({
        where: {
          id: data.roomId,
          tenantId,
          isActive: true,
        },
      });

      if (!room) {
        throw new NotFoundException("Room not found");
      }

      if (data.guests > room.capacity) {
        throw new BadRequestException(
          "Guest count exceeds room capacity",
        );
      }

      // Lock the room row so concurrent booking attempts for this
      // room serialize. All booking writers must use this protocol.
      await tx.$queryRaw`
        SELECT id FROM rooms
        WHERE id = ${room.id}::uuid
        FOR UPDATE
      `;

      const conflict = await tx.booking.findFirst({
        where: {
          tenantId,
          roomId: room.id,
          status: BookingStatus.CONFIRMED,
          checkIn: { lt: checkOut },
          checkOut: { gt: checkIn },
        },
      });

      if (conflict) {
        throw new BadRequestException(
          "Room is unavailable for these dates",
        );
      }

      const start = Date.UTC(
        checkIn.getUTCFullYear(),
        checkIn.getUTCMonth(),
        checkIn.getUTCDate(),
      );
      const end = Date.UTC(
        checkOut.getUTCFullYear(),
        checkOut.getUTCMonth(),
        checkOut.getUTCDate(),
      );
      const nights = (end - start) / 86_400_000;

      const booking = await tx.booking.create({
        data: {
          tenantId,
          roomId: room.id,
          userId,
          guestName: data.guestName,
          guestEmail: data.guestEmail,
          checkIn,
          checkOut,
          guests: data.guests,
          total: Number(room.price) * nights,
        },
        include: { room: true },
      });

      return toResponse(booking);
    });
  }

  async cancel(
    tenantId: string,
    bookingId: string,
  ): Promise<BookingResponse> {
    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, tenantId },
    });

    if (!booking) {
      throw new NotFoundException("Booking not found");
    }

    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestException("Booking is already cancelled");
    }

    const cancelled = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.CANCELLED,
      },
      include: { room: true },
    });

    return toResponse(cancelled);
  }

  async findAll(tenantId: string): Promise<BookingResponse[]> {
    const bookings = await this.prisma.booking.findMany({
      where: { tenantId },
      include: { room: true },
      orderBy: { createdAt: "desc" },
    });

    return bookings.map(toResponse);
  }

  async findOne(
    tenantId: string,
    bookingId: string,
  ): Promise<BookingResponse> {
    const booking = await this.prisma.booking.findFirst({
      where: { id: bookingId, tenantId },
      include: { room: true },
    });

    if (!booking) {
      throw new NotFoundException("Booking not found");
    }

    return toResponse(booking);
  }
}