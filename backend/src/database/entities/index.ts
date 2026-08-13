import { AccountEntity } from './account.entity';
import { AlumniAcademicInformationEntity } from './alumni-academic-information.entity';
import { AlumniContactRequestEntity } from './alumni-contact-request.entity';
import { AlumniNotificationEntity } from './alumni-notification.entity';
import { AlumniProfessionalInformationEntity } from './alumni-professional-information.entity';
import { AlumniRegistrationRequestEntity } from './alumni-registration-request.entity';
import { AlumniVerificationEntity } from './alumni-verification.entity';
import { AlumniEntity } from './alumni.entity';
import { AnnouncementEntity } from './announcement.entity';
import { CampusEntity } from './campus.entity';
import { DegreeProgramEntity } from './degree-program.entity';
import { DegreeEntity } from './degree.entity';
import { EventRsvpEntity } from './event-rsvp.entity';
import { EventEntity } from './event.entity';
import { ProgramEntity } from './program.entity';
import { RoleEntity } from './role.entity';
import { PortalMediaEntity } from './portal-media.entity';

export const databaseEntities = [
  RoleEntity,
  AccountEntity,
  CampusEntity,
  DegreeEntity,
  ProgramEntity,
  DegreeProgramEntity,
  PortalMediaEntity,
  AlumniRegistrationRequestEntity,
  AlumniEntity,
  AlumniAcademicInformationEntity,
  AlumniProfessionalInformationEntity,
  AlumniVerificationEntity,
  AlumniContactRequestEntity,
  AlumniNotificationEntity,
  EventEntity,
  EventRsvpEntity,
  AnnouncementEntity,
];

export {
  RoleEntity,
  AccountEntity,
  CampusEntity,
  DegreeEntity,
  ProgramEntity,
  DegreeProgramEntity,
  PortalMediaEntity,
  AlumniRegistrationRequestEntity,
  AlumniEntity,
  AlumniAcademicInformationEntity,
  AlumniProfessionalInformationEntity,
  AlumniVerificationEntity,
  AlumniContactRequestEntity,
  AlumniNotificationEntity,
  EventEntity,
  EventRsvpEntity,
  AnnouncementEntity,
};

export type { EventTargetCriteria } from './event.entity';
export { AlumniNotificationType } from './alumni-notification.entity';
