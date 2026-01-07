import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class CursorPipe implements PipeTransform<string | undefined, Record<string, any> | undefined> {
  transform(value?: string) {
    if (!value) return undefined;
    try {
      return JSON.parse(Buffer.from(value, 'base64').toString('utf8'));
    } catch {
      throw new BadRequestException('Invalid cursor');
    }
  }
}

export function encodeCursor(key?: Record<string, any>) {
  if (!key) return null;
  return Buffer.from(JSON.stringify(key), 'utf8').toString('base64');
}
