import { IsEnum, IsUUID } from "class-validator";

export class CreateMembershipDto {
  @IsUUID()
  userId: string;

  @IsEnum(["OWNER", "ADMIN", "RECEPTIONIST"] as const)
  role: "OWNER" | "ADMIN" | "RECEPTIONIST";
}