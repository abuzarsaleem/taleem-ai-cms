import { Inject, Injectable } from '@nestjs/common';
import {
  ALUMNI_REPOSITORY,
  CONTACT_REQUEST_REPOSITORY,
  PHOTO_STORAGE,
} from '../../../common/constants/tokens';
import { ContactRequestedField, UserRole } from '../../../common/enums';
import { ResourceNotFoundException } from '../../../common/exceptions';
import type { IObjectStorage } from '../../../common/interfaces/photo-storage.interface';
import type { IAlumniRepository } from '../interfaces/alumni.repository.interface';
import type {
  AlumniContactRequest,
  IContactRequestRepository,
} from '../interfaces/contact-request.repository.interface';
import type { AlumniProfile } from '../entities/alumni.entity';
import { DirectoryQueryDto } from '../dto/contact-request.dto';
import { maskEmail, maskPhone } from '../utils/contact-masking.util';
import { PortalMediaService } from '../../media/portal-media.service';

@Injectable()
export class AlumniDirectoryService {
  constructor(
    @Inject(ALUMNI_REPOSITORY)
    private readonly alumniRepository: IAlumniRepository,
    @Inject(CONTACT_REQUEST_REPOSITORY)
    private readonly contactRequestRepository: IContactRequestRepository,
    @Inject(PHOTO_STORAGE) private readonly objectStorage: IObjectStorage,
    private readonly portalMediaService: PortalMediaService,
  ) {}

  async list(
    viewerUserId: string,
    query: DirectoryQueryDto,
    viewerRole?: string,
  ) {
    const asAdmin = this.isAdminRole(viewerRole);
    const viewer = asAdmin
      ? null
      : await this.alumniRepository.findByUserId(viewerUserId);
    if (!asAdmin && !viewer) {
      throw new ResourceNotFoundException('Alumni profile for user', viewerUserId);
    }

    const page = await this.alumniRepository.searchDirectory({
      name: query.name,
      graduationYear: query.graduation_year,
      degreeProgramId: query.degree_program_id,
      city: query.city,
      country: query.country,
      excludeAlumniId: viewer?.alumni.id,
      page: query.page,
      pageSize: query.page_size,
    });

    const items = await Promise.all(
      page.items.map(async (profile) => {
        if (asAdmin) {
          return this.toDirectoryCard(profile, true);
        }
        const approved = await this.contactRequestRepository.findApprovedPair(
          viewer!.alumni.id,
          profile.alumni.id,
        );
        return this.toDirectoryCard(profile, approved);
      }),
    );

    return {
      items,
      total: page.total,
      page: page.page,
      page_size: page.pageSize,
    };
  }

  async filterOptions() {
    const options = await this.alumniRepository.listDirectoryFilterOptions();
    return {
      cities: options.cities,
      countries: options.countries,
      graduation_years: options.graduationYears,
    };
  }

  async getOne(
    viewerUserId: string,
    targetAlumniId: string,
    viewerRole?: string,
  ) {
    const asAdmin = this.isAdminRole(viewerRole);
    const viewer = asAdmin
      ? null
      : await this.alumniRepository.findByUserId(viewerUserId);
    if (!asAdmin && !viewer) {
      throw new ResourceNotFoundException('Alumni profile for user', viewerUserId);
    }

    const profile = await this.alumniRepository.findById(targetAlumniId);
    if (!profile) {
      throw new ResourceNotFoundException('Alumni', targetAlumniId);
    }

    if (asAdmin) {
      return this.toDirectoryCard(profile, true, true);
    }

    const isSelf = viewer!.alumni.id === targetAlumniId;
    const approved = isSelf
      ? true
      : await this.contactRequestRepository.findApprovedPair(
          viewer!.alumni.id,
          targetAlumniId,
        );

    return this.toDirectoryCard(profile, approved, true);
  }

  private isAdminRole(role?: string) {
    return role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN;
  }

  private async toDirectoryCard(
    profile: AlumniProfile,
    approvedRequest: AlumniContactRequest | true | null,
    detailed = false,
  ) {
    const a = profile.alumni;
    const photoUrl = await this.portalMediaService.resolvePublicUrl(
      a.photoMedia,
    );

    const professional = profile.professional[0];
    const academic = profile.academic[0];

    const revealAll = approvedRequest === true;
    const fields = new Set(
      revealAll
        ? [
            ContactRequestedField.EMAIL,
            ContactRequestedField.MOBILE,
            ContactRequestedField.WHATSAPP,
          ]
        : (approvedRequest?.requestedFields ?? []),
    );
    // Legacy approvals with empty requested_fields still reveal all contact channels
    if (
      approvedRequest &&
      approvedRequest !== true &&
      fields.size === 0
    ) {
      fields.add(ContactRequestedField.EMAIL);
      fields.add(ContactRequestedField.MOBILE);
      fields.add(ContactRequestedField.WHATSAPP);
    }

    const isContactRevealed = revealAll || fields.size > 0;
    const revealEmail =
      revealAll || fields.has(ContactRequestedField.EMAIL);
    const revealMobile =
      revealAll || fields.has(ContactRequestedField.MOBILE);
    const revealWhatsapp =
      revealAll || fields.has(ContactRequestedField.WHATSAPP);

    const base = {
      alumni_id: a.id,
      full_name: a.fullName,
      city: a.city,
      country: a.country,
      photo_url: photoUrl,
      academic: profile.academic.map((row) => ({
        degree_program_id: row.degreeProgramId,
        graduation_year: row.graduationYear,
      })),
      professional: profile.professional.map((row) => ({
        current_company: row.currentCompany,
        job_title: row.jobTitle,
        role: row.role,
      })),
      is_contact_revealed: isContactRevealed,
      email: revealEmail ? a.email : maskEmail(a.email),
      phone_number: revealMobile
        ? a.phoneNumber
        : maskPhone(a.phoneNumber),
      whatsapp_number: revealWhatsapp
        ? a.whatsappNumber
        : maskPhone(a.whatsappNumber),
      address: isContactRevealed ? a.address : null,
      secondry_address: isContactRevealed ? a.secondryAddress : null,
      linkedin_url: isContactRevealed ? a.linkedinUrl : null,
    };

    if (!detailed) {
      return {
        ...base,
        primary_graduation_year: academic?.graduationYear ?? null,
        primary_role: professional?.role ?? null,
      };
    }

    return base;
  }
}
