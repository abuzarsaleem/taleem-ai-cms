import { RegistrationStatus } from '../../../common/enums';

export class AlumniRegistrationRequest {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  status: RegistrationStatus;
  submittedAt: Date;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  rejectionReason: string | null;
  createdAt: Date;
  campus: string;
  degree: string;
  rollNumber: string;
  graduationYear: number;
  cgpa: number | null;
}
