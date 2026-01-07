import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(private users: UsersService, private jwt: JwtService) {}

  async register(username: string, email: string, password: string) {
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.users.create({ username, email, passwordHash });
    return { token: this.jwt.sign({ sub: user.id }) };
  }

  async login(email: string, password: string) {
    const user = await this.users.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    return { token: this.jwt.sign({ sub: user.id }) };
  }
}
