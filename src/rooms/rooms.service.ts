import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { CreateRoomDto, UpdateRoomDto } from "./dto/index.js";
import type { Room } from "../generated/prisma/client.js";

export interface RoomResponse {
  id: string;
  tenantId: string;
  name: string;
  type: string;
  price: string;
  capacity: number;
  isActive: boolean;
  createdAt: Date;
}

function toResponse(room: Room): RoomResponse {
  return {
    id: room.id,
    tenantId: room.tenantId,
    name: room.name,
    type: room.type,
    price: room.price.toString(),
    capacity: room.capacity,
    isActive: room.isActive,
    createdAt: room.createdAt,
  };
}

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string): Promise<RoomResponse[]> {
    const rooms = await this.prisma.room.findMany({
      where: { tenantId, isActive: true },
      orderBy: { name: "asc" },
    });

    return rooms.map(toResponse);
  }

  async findAllIncludingInactive(tenantId: string): Promise<RoomResponse[]> {
    const rooms = await this.prisma.room.findMany({
      where: { tenantId },
      orderBy: { name: "asc" },
    });

    return rooms.map(toResponse);
  }

  async findOne(tenantId: string, roomId: string): Promise<RoomResponse> {
    const room = await this.prisma.room.findFirst({
      where: { id: roomId, tenantId },
    });

    if (!room) {
      throw new NotFoundException("Room not found");
    }

    return toResponse(room);
  }

  async create(
    tenantId: string,
    data: CreateRoomDto,
  ): Promise<RoomResponse> {
    try {
      const room = await this.prisma.room.create({
        data: {
          tenantId,
          name: data.name,
          type: data.type,
          price: data.price,
          capacity: data.capacity ?? 2,
        },
      });

      return toResponse(room);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("unique constraint")
      ) {
        throw new ConflictException("Room name already exists in this hotel");
      }

      throw error;
    }
  }

  async update(
    tenantId: string,
    roomId: string,
    data: UpdateRoomDto,
  ): Promise<RoomResponse> {
    const existing = await this.prisma.room.findFirst({
      where: { id: roomId, tenantId },
    });

    if (!existing) {
      throw new NotFoundException("Room not found");
    }

    try {
      const room = await this.prisma.room.update({
        where: { id: roomId },
        data: {
          name: data.name,
          type: data.type,
          price: data.price,
          capacity: data.capacity,
          isActive: data.isActive,
        },
      });

      return toResponse(room);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("unique constraint")
      ) {
        throw new ConflictException("Room name already exists in this hotel");
      }

      throw error;
    }
  }

  async remove(tenantId: string, roomId: string): Promise<void> {
    const existing = await this.prisma.room.findFirst({
      where: { id: roomId, tenantId },
    });

    if (!existing) {
      throw new NotFoundException("Room not found");
    }

    await this.prisma.room.delete({
      where: { id: roomId },
    });
  }
}