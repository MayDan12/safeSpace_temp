import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateProfessionalProfileDto {
  @IsNotEmpty()
  @IsString()
  bio: string;

  @IsNotEmpty()
  @IsString()
  specialty: string;

  @IsOptional()
  @IsString()
  availabilityNote?: string;

  @IsOptional()
  @IsString()
  contactPreference?: string;
}

export class UpdateProfessionalProfileDto {
  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  specialty?: string;

  @IsOptional()
  @IsString()
  availabilityNote?: string;

  @IsOptional()
  @IsString()
  contactPreference?: string;
}
