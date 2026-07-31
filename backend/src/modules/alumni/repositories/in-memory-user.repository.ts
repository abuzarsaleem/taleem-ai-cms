import { Injectable } from '@nestjs/common';
import { UserRole } from '../../../common/enums';
import { generateId } from '../../../common/utils';
import {
  IUserRepository,
  UserAccount,
} from '../interfaces/user.repository.interface';

@Injectable()
export class InMemoryUserRepository implements IUserRepository {
  private readonly store = new Map<string, UserAccount>();

  async create(input: {
    email: string;
    passwordHash: string;
    role: UserRole;
    isActive?: boolean;
  }): Promise<UserAccount> {
    const entity: UserAccount = {
      id: generateId(),
      email: input.email.toLowerCase(),
      passwordHash: input.passwordHash,
      role: input.role,
      isActive: input.isActive ?? false,
      createdAt: new Date(),
      failedLoginAttempts: 0,
      lockedUntil: null,
    };
    this.store.set(entity.id, entity);
    return { ...entity };
  }

  async findById(id: string): Promise<UserAccount | null> {
    const entity = this.store.get(id);
    return entity ? { ...entity } : null;
  }

  async findByEmail(email: string): Promise<UserAccount | null> {
    const normalized = email.toLowerCase();
    for (const entity of this.store.values()) {
      if (entity.email === normalized) {
        return { ...entity };
      }
    }
    return null;
  }

  async update(id: string, patch: Partial<UserAccount>): Promise<UserAccount> {
    const existing = this.store.get(id);
    if (!existing) {
      throw new Error(`User ${id} not found`);
    }
    const updated = { ...existing, ...patch, id: existing.id };
    this.store.set(id, updated);
    return { ...updated };
  }
}
