import { Inject, Injectable } from '@nestjs/common';
import { ALUMNI_REPOSITORY } from '../../../common/constants/tokens';
import { AlumniStatus } from '../../../common/enums/alumni-status.enum';
import { degreeProgramNameFromSeed } from '../../../common/utils/degree-program-label.util';
import { PortalMediaService } from '../../media/portal-media.service';
import { AlumniVerifyResponseDto } from '../dto/alumni-verify.dto';
import type { IAlumniRepository } from '../interfaces/alumni.repository.interface';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Injectable()
export class AlumniVerifyService {
  constructor(
    @Inject(ALUMNI_REPOSITORY)
    private readonly alumniRepository: IAlumniRepository,
    private readonly portalMediaService: PortalMediaService,
  ) {}

  async verify(token: string): Promise<AlumniVerifyResponseDto> {
    const profile = await this.resolveProfile(token);

    if (!profile) {
      return {
        is_valid: false,
        status: null,
        message: 'Alumni record not found.',
      };
    }

    const { alumni, academic } = profile;

    if (alumni.status !== AlumniStatus.ACTIVE) {
      return {
        is_valid: false,
        status: alumni.status,
        message: 'This alumni card is not active.',
      };
    }

    const primaryAcademic = academic[0] ?? null;
    const degreeLabel = primaryAcademic
      ? degreeProgramNameFromSeed(primaryAcademic.degreeProgramId)
      : null;

    const photoUrl = alumni.photoMedia
      ? await this.portalMediaService.resolvePublicUrl({
          publicUrl: alumni.photoMedia.publicUrl,
        })
      : alumni.photoMediaId
        ? await this.portalMediaService.resolveById(alumni.photoMediaId)
        : null;

    return {
      is_valid: true,
      status: alumni.status,
      message: 'Verified alumni.',
      full_name: alumni.fullName,
      public_alumni_code: alumni.publicAlumniCode,
      photo_url: photoUrl,
      degree_label: degreeLabel,
      graduation_year: primaryAcademic?.graduationYear ?? null,
      registration_roll_number:
        primaryAcademic?.registrationRollNumber ?? null,
      verified_at: new Date().toISOString(),
    };
  }

  private async resolveProfile(token: string) {
    const trimmed = token.trim();
    if (!trimmed) return null;

    if (UUID_RE.test(trimmed)) {
      return this.alumniRepository.findById(trimmed);
    }

    return this.alumniRepository.findByPublicAlumniCode(trimmed);
  }
}
