import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Not, Repository } from 'typeorm';
import { ALUMNI_REPOSITORY } from '../../../common/constants/tokens';
import { AlumniStatus } from '../../../common/enums';
import {
  AlumniEntity,
  AnnouncementEntity,
  EventEntity,
} from '../../../database/entities';
import { ResourceNotFoundException } from '../../../common/exceptions';
import type { IAlumniRepository } from '../interfaces/alumni.repository.interface';
import type {
  NotificationItemDto,
  NotificationsSummaryDto,
} from '../dto/notifications.dto';

const DEFAULT_LOOKBACK_MS = 7 * 24 * 60 * 60 * 1000;
const ITEM_LIMIT = 8;

@Injectable()
export class AlumniNotificationsService {
  constructor(
    @Inject(ALUMNI_REPOSITORY)
    private readonly alumniRepository: IAlumniRepository,
    @InjectRepository(AlumniEntity)
    private readonly alumniRepo: Repository<AlumniEntity>,
    @InjectRepository(EventEntity)
    private readonly eventRepo: Repository<EventEntity>,
    @InjectRepository(AnnouncementEntity)
    private readonly announcementRepo: Repository<AnnouncementEntity>,
  ) {}

  async getSummary(
    userId: string,
    sinceRaw?: string,
  ): Promise<NotificationsSummaryDto> {
    const profile = await this.alumniRepository.findByUserId(userId);
    if (!profile) {
      throw new ResourceNotFoundException('Alumni profile for user', userId);
    }

    const since = this.resolveSince(sinceRaw);
    const meId = profile.alumni.id;

    const [alumniRows, eventRows, announcementRows] = await Promise.all([
      this.alumniRepo.find({
        where: {
          createdAt: MoreThan(since),
          status: AlumniStatus.ACTIVE,
          id: Not(meId),
        },
        order: { createdAt: 'DESC' },
        take: ITEM_LIMIT,
      }),
      this.eventRepo.find({
        where: {
          createdAt: MoreThan(since),
          isDraft: false,
        },
        order: { createdAt: 'DESC' },
        take: ITEM_LIMIT,
      }),
      this.announcementRepo.find({
        where: {
          isPublished: true,
          publishedAt: MoreThan(since),
        },
        order: { publishedAt: 'DESC' },
        take: ITEM_LIMIT,
      }),
    ]);

    const [alumniCount, eventsCount, announcementsCount] = await Promise.all([
      this.alumniRepo.count({
        where: {
          createdAt: MoreThan(since),
          status: AlumniStatus.ACTIVE,
          id: Not(meId),
        },
      }),
      this.eventRepo.count({
        where: { createdAt: MoreThan(since), isDraft: false },
      }),
      this.announcementRepo.count({
        where: { isPublished: true, publishedAt: MoreThan(since) },
      }),
    ]);

    const items: NotificationItemDto[] = [
      ...alumniRows.map((row) => ({
        type: 'alumni' as const,
        id: row.id,
        title: row.fullName,
        occurred_at: row.createdAt,
      })),
      ...eventRows.map((row) => ({
        type: 'event' as const,
        id: row.id,
        title: row.title,
        occurred_at: row.createdAt,
      })),
      ...announcementRows.map((row) => ({
        type: 'announcement' as const,
        id: row.id,
        title: row.title,
        occurred_at: row.publishedAt ?? since,
      })),
    ]
      .sort((a, b) => b.occurred_at.getTime() - a.occurred_at.getTime())
      .slice(0, ITEM_LIMIT);

    return {
      unread_count: alumniCount + eventsCount + announcementsCount,
      alumni: alumniCount,
      events: eventsCount,
      announcements: announcementsCount,
      since,
      items,
    };
  }

  private resolveSince(sinceRaw?: string) {
    if (sinceRaw) {
      const parsed = new Date(sinceRaw);
      if (!Number.isNaN(parsed.getTime())) return parsed;
    }
    return new Date(Date.now() - DEFAULT_LOOKBACK_MS);
  }
}
