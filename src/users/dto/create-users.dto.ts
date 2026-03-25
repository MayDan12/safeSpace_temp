import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { KycStatus, Role } from 'generated/prisma';
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
  @IsNotEmpty()
  kycStatus: KycStatus;
  @IsNotEmpty()
  isBanned: boolean;
  @IsNotEmpty()
  dmOptIn: boolean;
}
