import { AlumniStatus } from '../../../common/enums';
import { PortalMediaRef } from './portal-media-ref';

export class Alumni {
  id: string;
  userId: string | null;
  registrationRequestId: string | null;
  status: AlumniStatus;
  fullName: string;
  email: string;
  dateOfBirth: Date | null;
  gender: string | null;
  phoneNumber: string | null;
  whatsappNumber: string | null;
  cnicNationalId: string;
  address: string | null;
  secondryAddress: string | null;
  city: string | null;
  country: string | null;
  linkedinUrl: string | null;
  qrCode: string;
  publicAlumniCode: string;
  photoMediaId: string | null;
  photoMedia?: PortalMediaRef | null;
  createdAt: Date;
  updatedAt: Date;
}

export class AlumniAcademicInformation {
  id: string;
  alumniId: string;
  degreeProgramId: string;
  registrationRollNumber: string;
  registrationYear: string | null;
  graduationYear: string;
  cgpa: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export class AlumniProfessionalInformation {
  id: string;
  alumniId: string;
  currentCompany: string | null;
  jobTitle: string | null;
  role: string | null;
  startDate: Date;
  endDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class AlumniProfile {
  alumni: Alumni;
  academic: AlumniAcademicInformation[];
  professional: AlumniProfessionalInformation[];
}
