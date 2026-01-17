import { IsString, IsNumber, IsEnum, IsOptional, IsArray, IsDateString, IsUUID, Min, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { RouteType } from '@prisma/client';

class RoutePriceDto {
  @IsString()
  fromCity: string;

  @IsString()
  toCity: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  isSold?: boolean;
}

class RouteStationDto {
  @IsString()
  station: string;

  @IsDateString()
  time: string;
}

export class CreateRouteDto {
  @IsString()
  fromCity: string;

  @IsString()
  toCity: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RouteStationDto)
  stations?: RouteStationDto[];

  @IsDateString()
  departureTime: string;

  @IsDateString()
  arrivalTime: string;

  @IsNumber()
  @Min(0)
  price: number; // Keep this as the full route price

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoutePriceDto)
  prices?: RoutePriceDto[];

  @IsOptional()
  @IsEnum(RouteType)
  type?: RouteType;

  @IsUUID()
  busId: string;

  @IsOptional()
  @IsString()
  captainName?: string;

  @IsOptional()
  @IsString()
  firstDriverName?: string;

  @IsOptional()
  @IsString()
  secondDriverName?: string;

  @IsOptional()
  @IsString()
  assistantName?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  restStops?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
