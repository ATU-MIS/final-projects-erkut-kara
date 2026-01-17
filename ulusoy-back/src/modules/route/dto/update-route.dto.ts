import { IsString, IsNumber, IsEnum, IsOptional, IsArray, IsDateString, IsUUID, IsBoolean, Min, ValidateNested } from 'class-validator';
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

export class UpdateRouteDto {
  @IsOptional()
  @IsString()
  fromCity?: string;

  @IsOptional()
  @IsString()
  toCity?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RouteStationDto)
  stations?: RouteStationDto[];

  @IsOptional()
  @IsDateString()
  departureTime?: string;

  @IsOptional()
  @IsDateString()
  arrivalTime?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoutePriceDto)
  prices?: RoutePriceDto[];

  @IsOptional()
  @IsEnum(RouteType)
  type?: RouteType;

  @IsOptional()
  @IsUUID()
  busId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  restStops?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}