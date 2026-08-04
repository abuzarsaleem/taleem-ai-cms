import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AlumniEntity } from './alumni.entity';
import { AlumniRegistrationRequestEntity } from './alumni-registration-request.entity';
import { RoleEntity } from './role.entity';

@Entity({ name: 'accounts' })
export class AccountEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash: string;

  @Column({ name: 'role_id', type: 'uuid' })
  roleId: string;

  @ManyToOne(() => RoleEntity, (role) => role.accounts, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'role_id' })
  role: RoleEntity;

  @Column({ name: 'is_active', type: 'boolean', default: false })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @OneToMany(() => AlumniEntity, (alumni) => alumni.account)
  alumniProfiles: AlumniEntity[];

  @OneToMany(
    () => AlumniRegistrationRequestEntity,
    (request) => request.reviewedByAccount,
  )
  reviewedRequests: AlumniRegistrationRequestEntity[];
}
