import type { Request } from 'express';
import type { User } from '../../users/user.entity';

export type GoogleProfileUser = {
  email: string;
  firstName?: string;
  lastName?: string;
  picture?: string;
  accessToken?: string;
};

export type AuthedRequest = Request & { user?: GoogleProfileUser };

export type CookieBag = {
  access_token?: string;
  refresh_token?: string;
};

export type CookieRequest = Request & { cookies: CookieBag };

export type JwtPayload = {
  sub: string;
  email?: string;
  isAdmin?: boolean;
  type?: string;
  iat?: number;
  exp?: number;
};

export type UserRequest = Request & { user: User };
