import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from "class-validator";

export class CreateRoomDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsString()
  @MinLength(1)
  type: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  capacity?: number;
}

export class UpdateRoomDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  type?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  capacity?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}