import { IsString, IsNumber, IsEmail, IsOptional, Min } from 'class-validator';

export class CreatePaymentDto {
  @IsString()
  ticketId: string;

  @IsString()
  cardHolderName: string;

  @IsString()
  cardNumber: string;

  @IsString()
  expireMonth: string;

  @IsString()
  expireYear: string;

  @IsString()
  cvc: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  billingAddress?: string;

  @IsString()
  @IsOptional()
  billingCity?: string;

  @IsString()
  @IsOptional()
  billingCountry?: string;

  @IsString()
  @IsOptional()
  identityNumber?: string;
}
