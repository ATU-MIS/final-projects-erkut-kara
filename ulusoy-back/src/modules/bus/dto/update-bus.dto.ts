import { IsString, IsInt, IsOptional, IsEnum, IsBoolean, ValidateNested, IsObject, IsArray, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { LayoutType } from '@prisma/client';

class BusSpecsDto {
  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsInt()
  year?: number;

  @IsOptional()
  @IsString()
  engineType?: string;

  @IsOptional()
  @IsString()
  fuelType?: string;

  @IsOptional()
  @IsBoolean()
  hasAC?: boolean;

  @IsOptional()
  @IsBoolean()
  hasWifi?: boolean;

  @IsOptional()
  @IsBoolean()
  hasToilet?: boolean;

  @IsOptional()
  @IsBoolean()
  hasTV?: boolean;
}

export class UpdateBusDto {
  @IsOptional()
  @IsString()
  plate?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsInt()
  seatCount?: number;

  @IsOptional()
  @IsString()
  layoutId?: string;

  @IsOptional()
  @IsEnum(LayoutType)
  layoutType?: LayoutType;

  @IsOptional()
  @IsString()
  busPhone?: string;

  @IsOptional()
  @IsString()
  taxOffice?: string;

  @IsOptional()
  @IsString()
  taxNumber?: string;

  @IsOptional()
  @IsString()
  owner?: string;

  @IsOptional()
  @IsNumber()
  testLat?: number;

  @IsOptional()
  @IsNumber()
  testLng?: number;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => BusSpecsDto)
  specs?: BusSpecsDto;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;
}