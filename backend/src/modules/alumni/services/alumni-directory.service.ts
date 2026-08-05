import { Inject, Injectable } from '@nestjs/common';
import {
  ALUMNI_REPOSITORY,
  CONTACT_REQUEST_REPOSITORY,
  PHOTO_STORAGE,
} from '../../../common/constants/tokens';
import { ResourceNotFoundException } from '../../../common/exceptions';
import type { IObjectStorage } from '../../../common/interfaces/photo-storage.interface';
import type { IAlumniRepository } from '../interfaces/alumni.repository.interface';
import type { IContactRequestRepository } from '../interfaces/contact-request.repository.interface';
import type { AlumniProfile } from '../entities/alumni.entity';
import { DirectoryQueryDto } from '../dto/contact-request.dto';
import { maskEmail, maskPhone } from '../utils/contact-masking.util';

@Injectable()
export class AlumniDirectoryService {
  constructor(
    @Inject(ALUMNI_REPOSITORY)
    private readonly alumniRepository: IAlumniRepository,
    @Inject(CONTACT_REQUEST_REPOSITORY)
    private readonly contactRequestRepository: IContactRequestRepository,
    @Inject(PHOTO_STORAGE) private readonly objectStorage: IObjectStorage,
  ) {}

  async list(viewerUserId: string, query: DirectoryQueryDto) {
    const viewer = await this.alumniRepository.findByUserId(viewerUserId);
    if (!viewer) {
      throw new ResourceNotFoundException('Alumni profile for user', viewerUserId);
    }

    const page = await this.alumniRepository.searchDirectory({
      name: query.name,
      graduationYear: query.graduation_year,
      degreeProgramId: query.degree_program_id,
      industry: query.industry,
      city: query.city,
      country: query.country,
      excludeAlumniId: viewer.alumni.id,
      page: query.page,
      pageSize: query.page_size,
    });

    const items = await Promise.all(
      page.items.map(async (profile) => {
        const approved = await this.contactRequestRepository.findApprovedPair(
          viewer.alumni.id,
          profile.alumni.id,
        );
        return this.toDirectoryCard(profile, Boolean(approved));
      }),
    );

    return {
      items,
      total: page.total,
      page: page.page,
      page_size: page.pageSize,
    };
  }

  async getOne(viewerUserId: string, targetAlumniId: string) {
    const viewer = await this.alumniRepository.findByUserId(viewerUserId);
    if (!viewer) {
      throw new ResourceNotFoundException('Alumni profile for user', viewerUserId);
    }

    const profile = await this.alumniRepository.findById(targetAlumniId);
    if (!profile) {
      throw new ResourceNotFoundException('Alumni', targetAlumniId);
    }

    const isSelf = viewer.alumni.id === targetAlumniId;
    const approved = isSelf
      ? true
      : Boolean(
          await this.contactRequestRepository.findApprovedPair(
            viewer.alumni.id,
            targetAlumniId,
          ),
        );

    return this.toDirectoryCard(profile, approved, true);
  }

  private async toDirectoryCard(
    profile: AlumniProfile,
    isContactRevealed: boolean,
    detailed = false,
  ) {
    const a = profile.alumni;
    const photoUrl = a.photoUrl
      ? await this.objectStorage.resolveDownloadUrl(a.photoUrl)
      : null;

    const professional = profile.professional[0];
    const academic = profile.academic[0];

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
        industry: row.industry,
      })),
      is_contact_revealed: isContactRevealed,
      email: isContactRevealed ? a.email : maskEmail(a.email),
      phone_number: isContactRevealed
        ? a.phoneNumber
        : maskPhone(a.phoneNumber),
      whatsapp_number: isContactRevealed
        ? a.whatsappNumber
        : maskPhone(a.whatsappNumber),
      address: isContactRevealed ? a.address : null,
      secondry_address: isContactRevealed ? a.secondryAddress : null,
      linkedin_url: isContactRevealed
        ? (professional?.linkedinUrl ?? null)
        : null,
    };

    if (!detailed) {
      return {
        ...base,
        primary_graduation_year: academic?.graduationYear ?? null,
        primary_industry: professional?.industry ?? null,
      };
    }

    return base;
  }
}
