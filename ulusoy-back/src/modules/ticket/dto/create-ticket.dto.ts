import { IsString, IsNumber, IsEnum, IsUUID, Min, IsOptional, Length, Matches } from 'class-validator';
import { Gender } from '@prisma/client';
import { Transform } from 'class-transformer';

export class CreateTicketDto {
  @IsUUID()
  routeId: string;

  @IsString()
  fromCity: string;

  @IsString()
  toCity: string;

  @IsNumber()
  @Min(1)
  seatNumber: number;

  @IsEnum(Gender)
  gender: Gender;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.replace(/\s/g, '')) // Remove spaces
  @Length(11, 11)
  @Matches(/^\d+$/, { message: 'TC Kimlik No sadece rakamlardan oluşmalıdır' })
  tcKimlikNo?: string;

  @IsString()
  @Transform(({ value }) => value?.replace(/\s/g, '')) // Remove spaces
  @Length(10, 10, { message: 'Telefon numarası başında 0 olmadan 10 haneli olmalıdır' })
  @Matches(/^\d+$/, { message: 'Telefon numarası sadece rakamlardan oluşmalıdır' })
  userPhoneNumber: string;

  @IsString()
  passengerName: string;
}
