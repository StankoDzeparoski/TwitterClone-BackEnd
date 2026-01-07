import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class ParsePositiveIntPipe implements PipeTransform<string | undefined, number | undefined> {
  transform(value?: string) {
    if (value === undefined) return undefined;
    const n = Number(value);
    if (!Number.isInteger(n) || n <= 0) throw new BadRequestException('Invalid number');
    return n;
  }
}
