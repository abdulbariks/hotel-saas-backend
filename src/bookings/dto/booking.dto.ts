import { IsEmail, IsInt, IsString, Min, MinLength } from "class-validator";

export class CreateBookingDto {
  @IsString()
  roomId: string;

  @IsString()
  @MinLength(1)
  guestName: string;

  @IsEmail()
  guestEmail: string;

  @IsString()
  checkIn: string;

  @IsString()
  checkOut: string;

  @IsInt()
  @Min(1)
  guests: number;
}