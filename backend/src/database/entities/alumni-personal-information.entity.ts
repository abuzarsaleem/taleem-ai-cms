import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AlumniEntity } from './alumni.entity';

@Entity({ name: 'alumni_personal_information' })
export class AlumniPersonalInformationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'alumni_id', type: 'uuid', unique: true })
  alumniId: string;

  @OneToOne(() => AlumniEntity, (alumni) => alumni.personal, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'alumni_id' })
  alumni: AlumniEntity;

  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  dateOfBirth: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  gender: string | null;

  @Column({ name: 'phone_number', type: 'varchar', length: 20, nullable: true })
  phoneNumber: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  country: string | null;

  @Column({ name: 'photo_url', type: 'varchar', length: 500, nullable: true })
  photoUrl: string | null;
}
