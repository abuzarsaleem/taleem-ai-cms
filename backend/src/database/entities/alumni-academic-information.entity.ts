import {
  Column,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AlumniEntity } from './alumni.entity';

@Entity({ name: 'alumni_academic_information' })
export class AlumniAcademicInformationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'alumni_id', type: 'uuid', unique: true })
  alumniId: string;

  @OneToOne(() => AlumniEntity, (alumni) => alumni.academic, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'alumni_id' })
  alumni: AlumniEntity;

  @Column({ type: 'varchar', length: 100 })
  campus: string;

  @Column({ type: 'varchar', length: 100 })
  degree: string;

  @Index()
  @Column({ name: 'roll_number', type: 'varchar', length: 50 })
  rollNumber: string;

  @Column({ name: 'graduation_year', type: 'int' })
  graduationYear: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  cgpa: string | null;
}
