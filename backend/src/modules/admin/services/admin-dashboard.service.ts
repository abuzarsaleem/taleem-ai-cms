import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ALUMNI_REPOSITORY,
  CONTACT_REQUEST_REPOSITORY,
  REGISTRATION_REQUEST_REPOSITORY,
} from '../../../common/constants/tokens';
import {
  ContactRequestStatus,
  RegistrationStatus,
} from '../../../common/enums';
import {
  AnnouncementEntity,
  EventEntity,
} from '../../../database/entities';
import type { AdminDashboardResponseDto } from '../dto/admin.dto';
import type { IAlumniRepository } from '../../alumni/interfaces/alumni.repository.interface';
import type { IContactRequestRepository } from '../../alumni/interfaces/contact-request.repository.interface';
import type { IRegistrationRequestRepository } from '../../alumni/interfaces/registration-request.repository.interface';
import { PortalMediaService } from '../../media/portal-media.service';

@Injectable()
export class AdminDashboardService {
  constructor(
    @Inject(ALUMNI_REPOSITORY)
    private readonly alumniRepository: IAlumniRepository,
    @Inject(REGISTRATION_REQUEST_REPOSITORY)
    private readonly registrationRepository: IRegistrationRequestRepository,
    @Inject(CONTACT_REQUEST_REPOSITORY)
    private readonly contactRequestRepository: IContactRequestRepository,
    @InjectRepository(EventEntity)
    private readonly eventRepo: Repository<EventEntity>,
    @InjectRepository(AnnouncementEntity)
    private readonly announcementRepo: Repository<AnnouncementEntity>,
    private readonly portalMediaService: PortalMediaService,
  ) {}

  async getDashboard(): Promise<AdminDashboardResponseDto> {
    const [
      alumni,
      registrations,
      pendingContactRequests,
      publishedEventsCount,
      activeEventsCount,
      completedEventsCount,
      latestAnnouncements,
    ] = await Promise.all([
      this.alumniRepository.findAll(),
      this.registrationRepository.findAll(),
      this.contactRequestRepository.findAll(ContactRequestStatus.PENDING_ADMIN),
      this.eventRepo.count({ where: { isDraft: false } }),
      this.countEventsByScope('active'),
      this.countEventsByScope('completed'),
      this.loadLatestAnnouncements(5),
    ]);

    const pendingRegistrationsCount = registrations.filter(
      (r) => r.status === RegistrationStatus.PENDING,
    ).length;
    const rejectedRequestsCount = registrations.filter(
      (r) => r.status === RegistrationStatus.REJECTED,
    ).length;

    return {
      alumni_count: alumni.length,
      pending_registrations_count: pendingRegistrationsCount,
      rejected_requests_count: rejectedRequestsCount,
      pending_contact_requests_count: pendingContactRequests.length,
      published_events_count: publishedEventsCount,
      active_events_count: activeEventsCount,
      completed_events_count: completedEventsCount,
      latest_announcements: latestAnnouncements,
    };
  }

  private async countEventsByScope(
    scope: 'active' | 'completed',
  ): Promise<number> {
    const today = new Date().toISOString().slice(0, 10);
    const qb = this.eventRepo
      .createQueryBuilder('event')
      .where('event.isDraft = :isDraft', { isDraft: false });
    if (scope === 'active') {
      qb.andWhere('event.eventDate >= :today', { today });
    } else {
      qb.andWhere('event.eventDate < :today', { today });
    }
    return qb.getCount();
  }

  private async loadLatestAnnouncements(
    limit: number,
  ): Promise<AdminDashboardResponseDto['latest_announcements']> {
    const rows = await this.announcementRepo.find({
      where: { isPublished: true },
      order: { publishedAt: 'DESC' },
      take: limit,
      relations: { imageMedia: true },
    });

    return Promise.all(
      rows.map(async (row) => ({
        id: row.id,
        title: row.title,
        content: row.content,
        category: row.category,
        image_url: await this.portalMediaService.resolvePublicUrl(
          row.imageMedia,
        ),
        is_published: row.isPublished,
        published_at: row.publishedAt,
      })),
    );
  }
}
