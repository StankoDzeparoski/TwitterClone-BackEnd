import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

function cookieExtractor(req: any): string | null {
  const name = process.env.COOKIE_NAME ?? 'token';
  return req?.cookies?.[name] ?? null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractor]),
      secretOrKey: process.env.JWT_SECRET ?? 'dev-secret',
      ignoreExpiration: false,
    });
  }

  validate(payload: any) {
    return { id: payload.sub as string };
  }
}
