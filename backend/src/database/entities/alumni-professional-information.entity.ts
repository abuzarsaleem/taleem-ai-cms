import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AlumniEntity } from './alumni.entity';

@Entity({ name: 'alumni_professional_information' })
export class AlumniProfessionalInformationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'alumni_id', type: 'uuid', unique: true })
  alumniId: string;

  @OneToOne(() => AlumniEntity, (alumni) => alumni.professional, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'alumni_id' })
  alumni: AlumniEntity;

  @Column({ name: 'current_company', type: 'varchar', length: 150, nullable: true })
  currentCompany: string | null;

  @Column({ name: 'job_title', type: 'varchar', length: 150, nullable: true })
  jobTitle: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  industry: string | null;

  @Column({ name: 'years_of_experience', type: 'int', nullable: true })
  yearsOfExperience: number | null;

  @Column({ name: 'linkedin_url', type: 'varchar', length: 255, nullable: true })
  linkedinUrl: string | null;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
