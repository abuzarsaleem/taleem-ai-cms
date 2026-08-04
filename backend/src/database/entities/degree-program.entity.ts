import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AlumniAcademicInformationEntity } from './alumni-academic-information.entity';
import { AlumniRegistrationRequestEntity } from './alumni-registration-request.entity';
import { CampusEntity } from './campus.entity';
import { DegreeEntity } from './degree.entity';
import { ProgramEntity } from './program.entity';

@Entity({ name: 'degree_programs' })
export class DegreeProgramEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'degree_id', type: 'uuid' })
  degreeId: string;

  @ManyToOne(() => DegreeEntity, (degree) => degree.degreePrograms, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'degree_id' })
  degree: DegreeEntity;

  @Column({ name: 'program_id', type: 'uuid' })
  programId: string;

  @ManyToOne(() => ProgramEntity, (program) => program.degreePrograms, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'program_id' })
  program: ProgramEntity;

  @Column({ name: 'campus_id', type: 'uuid', nullable: true })
  campusId: string | null;

  @ManyToOne(() => CampusEntity, (campus) => campus.degreePrograms, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'campus_id' })
  campus: CampusEntity | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @OneToMany(
    () => AlumniRegistrationRequestEntity,
    (request) => request.degreeProgram,
  )
  registrationRequests: AlumniRegistrationRequestEntity[];

  @OneToMany(
    () => AlumniAcademicInformationEntity,
    (academic) => academic.degreeProgram,
  )
  academicRecords: AlumniAcademicInformationEntity[];
}
