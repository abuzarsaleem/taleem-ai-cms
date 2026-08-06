import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ALUMNI_REPOSITORY,
  NOTIFICATION_SENDER,
  PHOTO_STORAGE,
} from '../../../common/constants/tokens';
import {
  AlumniStatus,
  AnnouncementCategory,
  UserRole,
} from '../../../common/enums';
import {
  BusinessException,
  ResourceNotFoundException,
} from '../../../common/exceptions';
import type { INotificationSender } from '../../../common/interfaces/notification-sender.interface';
import type { IObjectStorage } from '../../../common/interfaces/photo-storage.interface';
import {
  AnnouncementEntity,
  DegreeProgramEntity,
} from '../../../database/entities';
import type { AlumniProfile } from '../../alumni/entities/alumni.entity';
import type { IAlumniRepository } from '../../alumni/interfaces/alumni.repository.interface';
import {
  AnnouncementListQueryDto,
  CreateAnnouncementDto,
  UpdateAnnouncementDto,
  UploadAnnouncementImageResponseDto,
} from '../dto/announcement.dto';

@Injectable()
export class AnnouncementService {
  private readonly logger = new Logger(AnnouncementService.name);

  constructor(
    @InjectRepository(AnnouncementEntity)
    private readonly announcementRepo: Repository<AnnouncementEntity>,
    @InjectRepository(DegreeProgramEntity)
    private readonly degreeProgramRepo: Repository<DegreeProgramEntity>,
    @Inject(ALUMNI_REPOSITORY)
    private readonly alumniRepository: IAlumniRepository,
    @Inject(NOTIFICATION_SENDER)
    private readonly notificationSender: INotificationSender,
    @Inject(PHOTO_STORAGE)
    private readonly objectStorage: IObjectStorage,
  ) {}

  async uploadImage(file?: {
    buffer: Buffer;
    mimetype: string;
    originalname: string;
    size: number;
  }): Promise<UploadAnnouncementImageResponseDto> {
    if (!file) {
      throw new BusinessException('Image file is required');
    }

    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      throw new BusinessException('Only JPEG, PNG, or WEBP images are allowed');
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new BusinessException('Image must be 5MB or smaller');
    }

    const stored = await this.objectStorage.upload({
      buffer: file.buffer,
      mimeType: file.mimetype,
      folder: 'announcements',
      fileName: file.originalname,
    });

    if (stored.publicUrl.length > 255) {
      throw new BusinessException(
        'Stored image URL exceeds maximum length; use a shorter file name',
      );
    }

    return {
      image_url: stored.publicUrl,
      storage_key: stored.storageKey,
    };
  }

  async list(userRole: string, query: AnnouncementListQueryDto) {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.page_size ?? 20));
    const includeDrafts =
      query.include_drafts === true &&
      (userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN);

    const qb = this.announcementRepo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.featuredAlumni', 'featuredAlumni')
      .orderBy('a.publishedAt', 'DESC', 'NULLS LAST')
      .addOrderBy('a.id', 'DESC');

    if (!includeDrafts) {
      qb.where('a.isPublished = true');
    }

    const total = await qb.getCount();
    const rows = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getMany();

    const items = await Promise.all(rows.map((row) => this.toResponse(row)));
    return { items, total, page, page_size: pageSize };
  }

  async getById(id: string, userRole: string) {
    const row = await this.announcementRepo.findOne({
      where: { id },
      relations: { featuredAlumni: true },
    });
    if (!row) {
      throw new ResourceNotFoundException('Announcement', id);
    }

    const isAdmin =
      userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN;
    if (!row.isPublished && !isAdmin) {
      throw new ResourceNotFoundException('Announcement', id);
    }

    return this.toResponse(row);
  }

  async create(adminUserId: string, dto: CreateAnnouncementDto) {
    await this.validateSpotlight(dto.category, dto.featured_alumni_id);

    const isPublished = dto.is_published !== false;
    const saved = await this.announcementRepo.save(
      this.announcementRepo.create({
        title: dto.title.trim(),
        content: dto.content.trim(),
        category: dto.category,
        featuredAlumniId: dto.featured_alumni_id ?? null,
        imageUrl: dto.image_url?.trim() ?? null,
        isPublished,
        publishedAt: isPublished ? new Date() : null,
        createdBy: adminUserId,
      }),
    );

    const withRelation = await this.announcementRepo.findOne({
      where: { id: saved.id },
      relations: { featuredAlumni: true },
    });

    if (isPublished && withRelation) {
      void this.notifyAlumniAboutAnnouncement(withRelation);
    }

    return this.toResponse(withRelation ?? saved);
  }

  async update(id: string, dto: UpdateAnnouncementDto) {
    const row = await this.announcementRepo.findOne({
      where: { id },
      relations: { featuredAlumni: true },
    });
    if (!row) {
      throw new ResourceNotFoundException('Announcement', id);
    }

    const wasPublished = row.isPublished;

    if (dto.title !== undefined) row.title = dto.title.trim();
    if (dto.content !== undefined) row.content = dto.content.trim();
    if (dto.category !== undefined) row.category = dto.category;
    if (dto.featured_alumni_id !== undefined) {
      row.featuredAlumniId = dto.featured_alumni_id ?? null;
    }
    if (dto.image_url !== undefined) {
      row.imageUrl = dto.image_url?.trim() ?? null;
    }
    if (dto.is_published !== undefined) {
      row.isPublished = dto.is_published;
      if (dto.is_published && !wasPublished) {
        row.publishedAt = new Date();
      }
      if (!dto.is_published) {
        // keep publishedAt for history when unpublishing
      }
    }

    const category = dto.category ?? row.category;
    const featuredId =
      dto.featured_alumni_id !== undefined
        ? dto.featured_alumni_id
        : row.featuredAlumniId ?? undefined;
    await this.validateSpotlight(category, featuredId);

    const saved = await this.announcementRepo.save(row);
    const withRelation = await this.announcementRepo.findOne({
      where: { id: saved.id },
      relations: { featuredAlumni: true },
    });

    if (!wasPublished && saved.isPublished && withRelation) {
      void this.notifyAlumniAboutAnnouncement(withRelation);
    }

    return this.toResponse(withRelation ?? saved);
  }

  async remove(id: string) {
    const row = await this.announcementRepo.findOne({ where: { id } });
    if (!row) {
      throw new ResourceNotFoundException('Announcement', id);
    }
    await this.announcementRepo.remove(row);
    return { id, deleted: true };
  }

  private async validateSpotlight(
    category: AnnouncementCategory,
    featuredAlumniId?: string | null,
  ) {
    if (category === AnnouncementCategory.ALUMNI_SPOTLIGHT && !featuredAlumniId) {
      throw new BusinessException(
        'featured_alumni_id is required for ALUMNI_SPOTLIGHT',
      );
    }
    if (featuredAlumniId) {
      const featured = await this.alumniRepository.findById(featuredAlumniId);
      if (!featured) {
        throw new ResourceNotFoundException('Featured alumni', featuredAlumniId);
      }
    }
  }

  private async toResponse(row: AnnouncementEntity) {
    let featuredAlumni: Awaited<
      ReturnType<AnnouncementService['toFeaturedAlumni']>
    > | null = null;

    if (row.featuredAlumniId) {
      const profile = await this.alumniRepository.findById(row.featuredAlumniId);
      if (profile) {
        featuredAlumni = await this.toFeaturedAlumni(profile);
      } else if (row.featuredAlumni) {
        const photoUrl = row.featuredAlumni.photoUrl
          ? await this.objectStorage.resolveDownloadUrl(
              row.featuredAlumni.photoUrl,
            )
          : null;
        featuredAlumni = {
          alumni_id: row.featuredAlumni.id,
          full_name: row.featuredAlumni.fullName,
          photo_url: photoUrl,
          degree: null,
          graduation_year: null,
        };
      }
    }

    const imageUrl = row.imageUrl
      ? await this.objectStorage.resolveDownloadUrl(row.imageUrl)
      : null;

    return {
      id: row.id,
      title: row.title,
      content: row.content,
      category: row.category,
      featured_alumni_id: row.featuredAlumniId,
      featured_alumni: featuredAlumni,
      image_url: imageUrl,
      is_published: row.isPublished,
      published_at: row.publishedAt,
      created_by: row.createdBy,
    };
  }

  private async toFeaturedAlumni(profile: AlumniProfile): Promise<{
    alumni_id: string;
    full_name: string;
    photo_url: string | null;
    degree: string | null;
    graduation_year: string | null;
  }> {
    const academic = profile.academic[0];
    let degree: string | null = null;
    if (academic?.degreeProgramId) {
      const dp = await this.degreeProgramRepo.findOne({
        where: { id: academic.degreeProgramId },
        relations: { degree: true, program: true },
      });
      if (dp) {
        degree = `${dp.degree.name} — ${dp.program.name}`;
      }
    }

    const photoUrl = profile.alumni.photoUrl
      ? await this.objectStorage.resolveDownloadUrl(profile.alumni.photoUrl)
      : null;

    return {
      alumni_id: profile.alumni.id,
      full_name: profile.alumni.fullName,
      photo_url: photoUrl,
      degree,
      graduation_year: academic?.graduationYear ?? null,
    };
  }

  private async notifyAlumniAboutAnnouncement(
    announcement: AnnouncementEntity,
  ): Promise<void> {
    try {
      const profiles = await this.alumniRepository.findAll();
      const active = profiles.filter(
        (p) => p.alumni.status === AlumniStatus.ACTIVE && p.alumni.email,
      );

      const results = await Promise.allSettled(
        active.map((profile) =>
          this.notificationSender.send({
            to: profile.alumni.email,
            templateId: 'announcement_published',
            variables: {
              fullName: profile.alumni.fullName,
              announcementTitle: announcement.title,
              category: announcement.category,
              content: announcement.content,
            },
          }),
        ),
      );

      const failed = results.filter((r) => r.status === 'rejected').length;
      this.logger.log(
        `ANNOUNCEMENT_NOTIFY id=${announcement.id} sent=${results.length - failed} failed=${failed}`,
      );
    } catch (error) {
      this.logger.error(
        `ANNOUNCEMENT_NOTIFY_FAILED id=${announcement.id}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
