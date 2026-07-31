import {
  Alumni,
  AlumniAcademicInformation,
  AlumniPersonalInformation,
  AlumniProfessionalInformation,
  AlumniProfile,
} from '../entities/alumni.entity';

export interface CreateAlumniInput {
  registrationRequestId: string;
  registrationRef: string;
  fullName: string;
  email: string;
  userId?: string | null;
  alumniPhoto?: string | null;
  academic: {
    campus: string;
    degree: string;
    rollNumber: string;
    graduationYear: number;
    cgpa: number | null;
  };
  phoneNumber?: string | null;
}

export interface IAlumniRepository {
  create(input: CreateAlumniInput): Promise<AlumniProfile>;
  findById(id: string): Promise<AlumniProfile | null>;
  findByEmail(email: string): Promise<AlumniProfile | null>;
  findByUserId(userId: string): Promise<AlumniProfile | null>;
  findByRegistrationRequestId(
    registrationRequestId: string,
  ): Promise<AlumniProfile | null>;
  findByRegistrationRef(ref: string): Promise<AlumniProfile | null>;
  findAll(): Promise<AlumniProfile[]>;
  updateAlumni(id: string, patch: Partial<Alumni>): Promise<Alumni>;
  updateAcademic(
    alumniId: string,
    patch: Partial<AlumniAcademicInformation>,
  ): Promise<AlumniAcademicInformation>;
  upsertProfessional(
    alumniId: string,
    data: Partial<AlumniProfessionalInformation>,
  ): Promise<AlumniProfessionalInformation>;
  upsertPersonal(
    alumniId: string,
    data: Partial<AlumniPersonalInformation>,
  ): Promise<AlumniPersonalInformation>;
}
