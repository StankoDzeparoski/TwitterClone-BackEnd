import { Body, Controller, Post, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { S3Service } from './s3.service';
import { IsString } from 'class-validator';

class CreateUploadDto {
  @IsString()
  contentType: string;
}

class CreateViewDto {
  @IsString()
  key: string;
}

@Controller('uploads')
export class UploadsController {
  constructor(private s3: S3Service) {}

  // 1) Request presigned PUT URL
  @Post('posts/image')
  @UseGuards(JwtAuthGuard)
  createPostImageUpload(@Req() req: any, @Body() dto: CreateUploadDto) {
    return this.s3.createPostImageUpload(req.user.id, dto.contentType);
  }

  // 2) Convert key -> presigned GET URL
  // You can guard this too (recommended). Public feed later can still work if you return urls from backend.
  @Post('view')
  @UseGuards(JwtAuthGuard)
  createView(@Body() dto: CreateViewDto) {
    return this.s3.createViewUrl(dto.key);
  }
}
