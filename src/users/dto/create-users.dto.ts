import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsDateString,
} from 'class-validator';
import { KycStatus, Role } from '@prisma/client';

export class CreateUsersDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsNotEmpty()
  role: Role;

  @IsNotEmpty()
  pseudonym: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsDateString()
  dob?: string;

  @IsNotEmpty()
  kycStatus: KycStatus;

  @IsNotEmpty()
  isBanned: boolean;

  @IsOptional()
  dmOptIn: boolean;
}
