import { IsArray, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreatePostDto {
  @IsOptional()
  @IsString()
  @MaxLength(280)
  content?: string;

  // keep for convenience (single image)
  @IsOptional()
  @IsString()
  imageKey?: string;

  // new preferred form (multiple images)
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageKeys?: string[];
}
