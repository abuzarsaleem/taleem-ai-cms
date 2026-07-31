import { AlumniAcademicInformationEntity } from './alumni-academic-information.entity';
import { AlumniPersonalInformationEntity } from './alumni-personal-information.entity';
import { AlumniProfessionalInformationEntity } from './alumni-professional-information.entity';
import { AlumniRegistrationRequestEntity } from './alumni-registration-request.entity';
import { AlumniEntity } from './alumni.entity';
import { UserEntity } from './user.entity';

export const databaseEntities = [
  UserEntity,
  AlumniRegistrationRequestEntity,
  AlumniEntity,
  AlumniAcademicInformationEntity,
  AlumniProfessionalInformationEntity,
  AlumniPersonalInformationEntity,
];

export {
  UserEntity,
  AlumniRegistrationRequestEntity,
  AlumniEntity,
  AlumniAcademicInformationEntity,
  AlumniProfessionalInformationEntity,
  AlumniPersonalInformationEntity,
};
