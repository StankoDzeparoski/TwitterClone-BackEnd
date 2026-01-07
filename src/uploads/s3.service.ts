import { BadRequestException, Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { newId } from '../common/ids';

@Injectable()
export class S3Service {
  private s3 = new S3Client({
    region: process.env.AWS_REGION ?? 'eu-north-1',

    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  });

  private bucket = process.env.S3_BUCKET!;

  private uploadExpires = Number(process.env.S3_UPLOAD_EXPIRES ?? 60); // seconds
  private viewExpires = Number(process.env.S3_VIEW_EXPIRES ?? 300); // seconds

  private assertBucket() {
    if (!this.bucket) throw new Error('S3_BUCKET is not set');
  }

  private sanitizeContentType(contentType: string) {
    // Keep it strict. You can allow more later.
    const allowed = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
    if (!allowed.has(contentType)) {
      throw new BadRequestException('Unsupported image type');
    }
  }

  async createPostImageUpload(userId: string, contentType: string) {
    this.assertBucket();
    this.sanitizeContentType(contentType);

    const key = `posts/${userId}/${newId('img_')}`;

    const cmd = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(this.s3, cmd, { expiresIn: this.uploadExpires });

    return { key, uploadUrl, expiresIn: this.uploadExpires };
  }


  async createViewUrl(key: string) {
    this.assertBucket();

    // Safety: don’t allow viewing random prefixes if you want to restrict
    if (!key.startsWith('posts/')) {
      throw new BadRequestException('Invalid key');
    }

    const cmd = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    const url = await getSignedUrl(this.s3, cmd, { expiresIn: this.viewExpires });
    return { url, expiresIn: this.viewExpires };
  }

  async presignGet(key: string) {
    const { url } = await this.createViewUrl(key);
    return url;
  }

}
