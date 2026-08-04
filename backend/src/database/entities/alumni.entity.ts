import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ALUMNI_STATUS_ENUM, AlumniStatus } from '../../common/enums';
import { AccountEntity } from './account.entity';
import { AlumniAcademicInformationEntity } from './alumni-academic-information.entity';
import { AlumniProfessionalInformationEntity } from './alumni-professional-information.entity';
import { AlumniRegistrationRequestEntity } from './alumni-registration-request.entity';
import { AlumniVerificationEntity } from './alumni-verification.entity';

@Entity({ name: 'alumni' })
export class AlumniEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true, unique: true })
  userId: string | null;

  @ManyToOne(() => AccountEntity, (account) => account.alumniProfiles, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'user_id' })
  account: AccountEntity | null;

  @Column({
    name: 'registration_request_id',
    type: 'uuid',
    nullable: true,
    unique: true,
  })
  registrationRequestId: string | null;

  @OneToOne(
    () => AlumniRegistrationRequestEntity,
    (request) => request.alumni,
    { nullable: true, onDelete: 'SET NULL' },
  )
  @JoinColumn({ name: 'registration_request_id' })
  registrationRequest: AlumniRegistrationRequestEntity | null;

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

  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  dateOfBirth: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  gender: string | null;

  @Column({ name: 'phone_number', type: 'varchar', length: 20, nullable: true })
  phoneNumber: string | null;

  @Column({ name: 'whatsapp_number', type: 'varchar', length: 20, nullable: true })
  whatsappNumber: string | null;

  @Column({ name: 'cnic_national_id', type: 'varchar', length: 15, unique: true })
  cnicNationalId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address: string | null;

  @Column({ name: 'secondry_address', type: 'varchar', length: 255, nullable: true })
  secondryAddress: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  country: string | null;

  @Column({ name: 'qr_code', type: 'text', default: '' })
  qrCode: string;

  @Column({ name: 'photo_url', type: 'text', nullable: true })
  photoUrl: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => AlumniAcademicInformationEntity, (academic) => academic.alumni)
  academicRecords: AlumniAcademicInformationEntity[];

  @OneToMany(
    () => AlumniProfessionalInformationEntity,
    (professional) => professional.alumni,
  )
  professionalRecords: AlumniProfessionalInformationEntity[];

  @OneToOne(() => AlumniVerificationEntity, (verification) => verification.alumni)
  verification: AlumniVerificationEntity | null;
}
