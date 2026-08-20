import { RegistrationStatus } from '../../../common/enums';
import { PortalMediaRef } from './portal-media-ref';

export class AlumniRegistrationRequest {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  status: RegistrationStatus;
  whatsappNumber: string | null;
  cnicNationalId: string;
  degreeProgramId: string;
  degreeProgramName: string | null;
  registrationRollNumber: string;
  graduationYear: string;
  referenceNumber: string;
  photoMediaId: string | null;
  photoMedia?: PortalMediaRef | null;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  rejectionReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}
