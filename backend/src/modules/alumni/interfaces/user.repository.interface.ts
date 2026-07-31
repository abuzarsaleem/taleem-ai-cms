import { UserRole } from '../../../common/enums';

export class UserAccount {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
}

export interface IUserRepository {
  create(input: {
    email: string;
    passwordHash: string;
    role: UserRole;
    isActive?: boolean;
  }): Promise<UserAccount>;
  findById(id: string): Promise<UserAccount | null>;
  findByEmail(email: string): Promise<UserAccount | null>;
  update(id: string, patch: Partial<UserAccount>): Promise<UserAccount>;
}
