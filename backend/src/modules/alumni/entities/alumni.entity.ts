import { AlumniStatus } from '../../../common/enums';

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
  qrCode: string;
  photoUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class AlumniAcademicInformation {
  id: string;
  alumniId: string;
  degreeProgramId: string;
  registrationRollNumber: string;
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
  industry: string | null;
  yearsOfExperience: number | null;
  linkedinUrl: string | null;
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
