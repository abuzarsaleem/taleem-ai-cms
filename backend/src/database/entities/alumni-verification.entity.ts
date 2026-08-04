import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AlumniEntity } from './alumni.entity';

@Entity({ name: 'alumni_verification' })
export class AlumniVerificationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'alumni_id', type: 'uuid', unique: true })
  alumniId: string;

  @OneToOne(() => AlumniEntity, (alumni) => alumni.verification, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'alumni_id' })
  alumni: AlumniEntity;

  @Index()
  @Column({ name: 'token_hash', type: 'varchar', length: 255, unique: true })
  tokenHash: string;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  @Column({ name: 'used_at', type: 'timestamptz', nullable: true })
  usedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
