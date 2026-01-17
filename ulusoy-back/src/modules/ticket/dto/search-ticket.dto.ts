import { IsString, IsOptional, IsEnum, IsDateString, IsUUID } from 'class-validator';
import { TicketStatus, Gender } from '@prisma/client';

export class SearchTicketDto {
  @IsOptional()
  @IsString()
  pnrNumber?: string;

  @IsOptional()
  @IsUUID()
  routeId?: string;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsString()
  fromCity?: string;

  @IsOptional()
  @IsString()
  toCity?: string;

  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @IsOptional()
  @IsString()
  paymentStatus?: string;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsString()
  userPhoneNumber?: string;

  @IsOptional()
  @IsString()
  tcKimlikNo?: string;

  @IsOptional()
  @IsDateString()
  date?: string;
}