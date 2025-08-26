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

export interface RegistryDataResponse {
  success: boolean;
  fullName?: string;
  membershipStatus?: string;
  membershipExpirationDate?: string;
  message?: string;
}
