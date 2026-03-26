import { IsNotEmpty, IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateCommentDto {
  @IsNotEmpty()
  @IsString()
  content: string;

  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;
}

export class ReportCommentDto {
  @IsNotEmpty()
  @IsString()
  reason: string;
}
