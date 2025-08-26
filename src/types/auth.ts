import { User } from './user';

export interface AuthData {
  user: User;
  accessToken: string | null;
  refreshToken: string | null;
}

export enum UserRole {
  Member = 'member',
  Guest = 'guest',
  Admin = 'admin'
}