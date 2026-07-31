import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import {
  REGISTRATION_STATUS_ENUM,
  RegistrationStatus,
} from '../../common/enums';
import { AlumniEntity } from './alumni.entity';
import { UserEntity } from './user.entity';

@Entity({ name: 'alumni_registration_request' })
export class AlumniRegistrationRequestEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'full_name', type: 'varchar', length: 150 })
  fullName: string;

  @Index()
  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ name: 'phone_number', type: 'varchar', length: 20, nullable: true })
  phoneNumber: string | null;

  @Column({
    type: 'enum',
    enum: RegistrationStatus,
    enumName: REGISTRATION_STATUS_ENUM,
    default: RegistrationStatus.PENDING,
  })
  status: RegistrationStatus;

  @Column({
    name: 'submitted_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  submittedAt: Date;

  @Column({ name: 'reviewed_by', type: 'uuid', nullable: true })
  reviewedBy: string | null;

  @ManyToOne(() => UserEntity, (user) => user.reviewedRequests, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'reviewed_by' })
  reviewedByUser: UserEntity | null;

  @Column({ name: 'reviewed_at', type: 'timestamptz', nullable: true })
  reviewedAt: Date | null;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  /** Application snapshot fields captured at submission time. */
  @Column({ type: 'varchar', length: 100 })
  campus: string;

  @Column({ type: 'varchar', length: 100 })
  degree: string;

  @Column({ name: 'roll_number', type: 'varchar', length: 50 })
  rollNumber: string;

  @Column({ name: 'graduation_year', type: 'int' })
  graduationYear: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  cgpa: string | null;

  @OneToOne(() => AlumniEntity, (alumni) => alumni.registrationRequest)
  alumni: AlumniEntity | null;
}
