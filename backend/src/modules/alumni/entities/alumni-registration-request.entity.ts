import { RegistrationStatus } from '../../../common/enums';

export class AlumniRegistrationRequest {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  status: RegistrationStatus;
  whatsappNumber: string | null;
  cnicNationalId: string;
  degreeProgramId: string;
  registrationRollNumber: string;
  graduationYear: string;
  photoUrl: string | null;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  rejectionReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}
