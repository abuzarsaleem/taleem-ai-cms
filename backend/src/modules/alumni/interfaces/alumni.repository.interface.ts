import {
  Alumni,
  AlumniAcademicInformation,
  AlumniProfessionalInformation,
  AlumniProfile,
} from '../entities/alumni.entity';

export interface CreateAlumniInput {
  registrationRequestId: string;
  fullName: string;
  email: string;
  userId?: string | null;
  phoneNumber?: string | null;
  whatsappNumber?: string | null;
  cnicNationalId: string;
  photoUrl?: string | null;
  academic: {
    degreeProgramId: string;
    registrationRollNumber: string;
    graduationYear: string;
    cgpa?: number | null;
  };
}

export interface IAlumniRepository {
  create(input: CreateAlumniInput): Promise<AlumniProfile>;
  findById(id: string): Promise<AlumniProfile | null>;
  findByEmail(email: string): Promise<AlumniProfile | null>;
  findByUserId(userId: string): Promise<AlumniProfile | null>;
  findByRegistrationRequestId(
    registrationRequestId: string,
  ): Promise<AlumniProfile | null>;
  findAll(): Promise<AlumniProfile[]>;
  updateAlumni(id: string, patch: Partial<Alumni>): Promise<Alumni>;
  addAcademic(
    alumniId: string,
    data: Omit<AlumniAcademicInformation, 'id' | 'alumniId' | 'createdAt' | 'updatedAt'>,
  ): Promise<AlumniAcademicInformation>;
  upsertProfessional(
    alumniId: string,
    data: Partial<AlumniProfessionalInformation> & { startDate: Date },
  ): Promise<AlumniProfessionalInformation>;
}
