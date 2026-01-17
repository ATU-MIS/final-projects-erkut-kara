import { IsString, IsOptional, IsEnum, IsDateString, IsUUID, IsNumber, Min, Max, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { RouteType } from '@prisma/client';

export class SearchRouteDto {
  @IsOptional()
  @IsString()
  fromCity?: string;

  @IsOptional()
  @IsString()
  toCity?: string;

  @IsOptional()
  @IsDateString()
  date?: string; 

  @IsOptional()
  @IsEnum(RouteType)
  type?: RouteType;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @IsString()
  busId?: string;

  @IsOptional()
  @IsString()
  isActive?: string; 

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsString() // Boolean as string from query
  ignoreTimeCheck?: string; 
}