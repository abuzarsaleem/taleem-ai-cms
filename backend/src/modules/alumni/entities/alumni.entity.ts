import { AlumniStatus } from '../../../common/enums';

export class Alumni {
  id: string;
  userId: string | null;
  registrationRequestId: string | null;
  registrationRef: string;
  status: AlumniStatus;
  fullName: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  alumniPhoto: string | null;
  alumniQrCode: string | null;
}

export class AlumniAcademicInformation {
  id: string;
  alumniId: string;
  campus: string;
  degree: string;
  rollNumber: string;
  graduationYear: number;
  cgpa: number | null;
}

export class AlumniProfessionalInformation {
  id: string;
  alumniId: string;
  currentCompany: string | null;
  jobTitle: string | null;
  industry: string | null;
  yearsOfExperience: number | null;
  linkedinUrl: string | null;
  updatedAt: Date;
}

export class AlumniPersonalInformation {
  id: string;
  alumniId: string;
  dateOfBirth: Date | null;
  gender: string | null;
  phoneNumber: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  photoUrl: string | null;
}

export class AlumniProfile {
  alumni: Alumni;
  academic: AlumniAcademicInformation;
  professional: AlumniProfessionalInformation | null;
  personal: AlumniPersonalInformation | null;
}
