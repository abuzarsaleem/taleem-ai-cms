import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ALUMNI_STATUS_ENUM, AlumniStatus } from '../../common/enums';
import { AlumniAcademicInformationEntity } from './alumni-academic-information.entity';
import { AlumniPersonalInformationEntity } from './alumni-personal-information.entity';
import { AlumniProfessionalInformationEntity } from './alumni-professional-information.entity';
import { AlumniRegistrationRequestEntity } from './alumni-registration-request.entity';
import { UserEntity } from './user.entity';

@Entity({ name: 'alumni' })
export class AlumniEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true, unique: true })
  userId: string | null;

  @ManyToOne(() => UserEntity, (user) => user.alumniProfiles, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity | null;

  @Column({
    name: 'registration_request_id',
    type: 'uuid',
    nullable: true,
    unique: true,
  })
  registrationRequestId: string | null;

  @OneToOne(() => AlumniRegistrationRequestEntity, (request) => request.alumni, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'registration_request_id' })
  registrationRequest: AlumniRegistrationRequestEntity | null;

  @Index()
  @Column({ name: 'registration_ref', type: 'varchar', length: 64, unique: true })
  registrationRef: string;

  @Column({
    type: 'enum',
    enum: AlumniStatus,
    enumName: ALUMNI_STATUS_ENUM,
    default: AlumniStatus.ACTIVE,
  })
  status: AlumniStatus;

  @Column({ name: 'full_name', type: 'varchar', length: 150 })
  fullName: string;

  @Index()
  @Column({ type: 'varchar', length: 255 })
  email: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @Column({ name: 'alumni_photo', type: 'varchar', length: 500, nullable: true })
  alumniPhoto: string | null;

  @Column({
    name: 'alumni_qr_code',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  alumniQrCode: string | null;

  @OneToOne(() => AlumniAcademicInformationEntity, (academic) => academic.alumni)
  academic: AlumniAcademicInformationEntity;

  @OneToOne(
    () => AlumniProfessionalInformationEntity,
    (professional) => professional.alumni,
  )
  professional: AlumniProfessionalInformationEntity | null;

  @OneToOne(() => AlumniPersonalInformationEntity, (personal) => personal.alumni)
  personal: AlumniPersonalInformationEntity | null;
}
