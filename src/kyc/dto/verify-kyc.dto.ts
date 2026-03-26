import { IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifyBvnDto {
  @IsNotEmpty()
  @IsString()
  @Length(11, 11)
  bvn: string;
}

export class VerifyNinDto {
  @IsNotEmpty()
  @IsString()
  @Length(11, 11)
  nin: string;
}

export class RejectKycDto {
  @IsNotEmpty()
  @IsString()
  reason: string;
}
