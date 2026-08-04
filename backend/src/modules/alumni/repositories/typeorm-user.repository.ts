import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '../../../common/enums';
import { AccountEntity, RoleEntity } from '../../../database/entities';
import {
  IUserRepository,
  UserAccount,
} from '../interfaces/user.repository.interface';

const ROLE_IDS: Record<UserRole, string> = {
  [UserRole.ALUMNI]: '11111111-1111-4111-8111-111111111101',
  [UserRole.ADMIN]: '11111111-1111-4111-8111-111111111102',
  [UserRole.SUPER_ADMIN]: '11111111-1111-4111-8111-111111111103',
};

@Injectable()
export class TypeOrmUserRepository implements IUserRepository {
  /** Lockout fields are not in accounts schema yet — kept in process memory. */
  private readonly lockout = new Map<
    string,
    { failedLoginAttempts: number; lockedUntil: Date | null }
  >();

  constructor(
    @InjectRepository(AccountEntity)
    private readonly accounts: Repository<AccountEntity>,
    @InjectRepository(RoleEntity)
    private readonly roles: Repository<RoleEntity>,
  ) {}

  async create(input: {
    email: string;
    passwordHash: string;
    role: UserRole;
    isActive?: boolean;
  }): Promise<UserAccount> {
    const roleId = ROLE_IDS[input.role];
    const role = await this.roles.findOne({ where: { id: roleId } });
    if (!role) {
      throw new Error(`Role ${input.role} not found in database`);
    }

    const entity = this.accounts.create({
      email: input.email.toLowerCase(),
      passwordHash: input.passwordHash,
      roleId: role.id,
      isActive: input.isActive ?? false,
    });
    const saved = await this.accounts.save(entity);
    return this.toDomain(saved, role.name);
  }

  async findById(id: string): Promise<UserAccount | null> {
    const entity = await this.accounts.findOne({
      where: { id },
      relations: { role: true },
    });
    return entity ? this.toDomain(entity, entity.role?.name) : null;
  }

  async findByEmail(email: string): Promise<UserAccount | null> {
    const entity = await this.accounts.findOne({
      where: { email: email.toLowerCase() },
      relations: { role: true },
    });
    return entity ? this.toDomain(entity, entity.role?.name) : null;
  }

  async update(id: string, patch: Partial<UserAccount>): Promise<UserAccount> {
    const existing = await this.accounts.findOne({
      where: { id },
      relations: { role: true },
    });
    if (!existing) throw new Error(`User ${id} not found`);

    if (patch.email !== undefined) existing.email = patch.email.toLowerCase();
    if (patch.passwordHash !== undefined)
      existing.passwordHash = patch.passwordHash;
    if (patch.isActive !== undefined) existing.isActive = patch.isActive;
    if (patch.role !== undefined) existing.roleId = ROLE_IDS[patch.role];

    if (
      patch.failedLoginAttempts !== undefined ||
      patch.lockedUntil !== undefined
    ) {
      const current = this.lockout.get(id) ?? {
        failedLoginAttempts: 0,
        lockedUntil: null,
      };
      this.lockout.set(id, {
        failedLoginAttempts:
          patch.failedLoginAttempts ?? current.failedLoginAttempts,
        lockedUntil:
          patch.lockedUntil !== undefined
            ? patch.lockedUntil
            : current.lockedUntil,
      });
    }

    const saved = await this.accounts.save(existing);
    const withRole = await this.accounts.findOne({
      where: { id: saved.id },
      relations: { role: true },
    });
    return this.toDomain(withRole!, withRole!.role?.name);
  }

  private toDomain(entity: AccountEntity, roleName?: string): UserAccount {
    const lock = this.lockout.get(entity.id);
    return {
      id: entity.id,
      email: entity.email,
      passwordHash: entity.passwordHash,
      role: this.mapRole(roleName ?? entity.role?.name),
      isActive: entity.isActive,
      createdAt: entity.createdAt,
      failedLoginAttempts: lock?.failedLoginAttempts ?? 0,
      lockedUntil: lock?.lockedUntil ?? null,
    };
  }

  private mapRole(name?: string): UserRole {
    if (name === UserRole.ADMIN) return UserRole.ADMIN;
    if (name === UserRole.SUPER_ADMIN) return UserRole.SUPER_ADMIN;
    return UserRole.ALUMNI;
  }
}
