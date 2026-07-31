import { RegistrationStatus } from '../../../common/enums';
import { AlumniRegistrationRequest } from '../entities/alumni-registration-request.entity';

export interface CreateRegistrationRequestInput {
  fullName: string;
  email: string;
  phoneNumber?: string;
  campus: string;
  degree: string;
  rollNumber: string;
  graduationYear: number;
  cgpa?: number;
}

export interface IRegistrationRequestRepository {
  create(
    input: CreateRegistrationRequestInput,
  ): Promise<AlumniRegistrationRequest>;
  findById(id: string): Promise<AlumniRegistrationRequest | null>;
  findByEmail(email: string): Promise<AlumniRegistrationRequest | null>;
  findAll(status?: RegistrationStatus): Promise<AlumniRegistrationRequest[]>;
  update(
    id: string,
    patch: Partial<AlumniRegistrationRequest>,
  ): Promise<AlumniRegistrationRequest>;
}
