import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateBookingDto {
  @IsNotEmpty()
  @IsString()
  professionalId: string;

  @IsOptional()
  @IsDateString()
  proposedAt?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class RescheduleBookingDto {
  @IsNotEmpty()
  @IsDateString()
  proposedAt: string;
}
