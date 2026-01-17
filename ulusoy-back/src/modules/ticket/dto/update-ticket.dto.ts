import { IsString, IsNumber, IsEnum, IsOptional, Min } from 'class-validator';
import { Gender, TicketStatus, PaymentStatus } from '@prisma/client';

export class UpdateTicketDto {
  @IsOptional()
  @IsString()
  fromCity?: string;

  @IsOptional()
  @IsString()
  toCity?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  seatNumber?: number;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsString()
  userPhoneNumber?: string;

  @IsOptional()
  @IsString()
  passengerName?: string;

  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;
}
