import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { USER_ROLE_ENUM, UserRole } from '../../common/enums';
import { AlumniRegistrationRequestEntity } from './alumni-registration-request.entity';
import { AlumniEntity } from './alumni.entity';

@Entity({ name: 'users' })
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    enumName: USER_ROLE_ENUM,
    default: UserRole.ALUMNI,
  })
  role: UserRole;

  @Column({ name: 'is_active', type: 'boolean', default: false })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @OneToMany(() => AlumniRegistrationRequestEntity, (request) => request.reviewedByUser)
  reviewedRequests: AlumniRegistrationRequestEntity[];

  @OneToMany(() => AlumniEntity, (alumni) => alumni.user)
  alumniProfiles: AlumniEntity[];
}
