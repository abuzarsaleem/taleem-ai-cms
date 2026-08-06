import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ALUMNI_REPOSITORY,
  NOTIFICATION_SENDER,
} from '../../../common/constants/tokens';
import { AlumniStatus, RsvpStatus, UserRole } from '../../../common/enums';
import { ResourceNotFoundException } from '../../../common/exceptions';
import type { INotificationSender } from '../../../common/interfaces/notification-sender.interface';
import {
  AlumniAcademicInformationEntity,
  EventEntity,
  EventRsvpEntity,
} from '../../../database/entities';
import type { IAlumniRepository } from '../../alumni/interfaces/alumni.repository.interface';
import {
  CreateEventDto,
  EventListQueryDto,
  EventListScope,
  RsvpEventDto,
  UpdateEventDto,
} from '../dto/event.dto';

@Injectable()
export class EventService {
  private readonly logger = new Logger(EventService.name);

  constructor(
    @InjectRepository(EventEntity)
    private readonly eventRepo: Repository<EventEntity>,
    @InjectRepository(EventRsvpEntity)
    private readonly rsvpRepo: Repository<EventRsvpEntity>,
    @InjectRepository(AlumniAcademicInformationEntity)
    private readonly academicRepo: Repository<AlumniAcademicInformationEntity>,
    @Inject(ALUMNI_REPOSITORY)
    private readonly alumniRepository: IAlumniRepository,
    @Inject(NOTIFICATION_SENDER)
    private readonly notificationSender: INotificationSender,
  ) {}

  async list(
    user: { userId: string; role: string },
    query: EventListQueryDto,
  ) {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.page_size ?? 20));
    const isAlumni = user.role === UserRole.ALUMNI;
    const scope =
      query.scope ??
      (isAlumni ? EventListScope.UPCOMING : EventListScope.ALL);

    let alumniId: string | null = null;
    if (isAlumni) {
      const viewer = await this.alumniRepository.findByUserId(user.userId);
      if (!viewer) {
        throw new ResourceNotFoundException(
          'Alumni profile for user',
          user.userId,
        );
      }
      alumniId = viewer.alumni.id;
    } else {
      const profile = await this.alumniRepository.findByUserId(user.userId);
      alumniId = profile?.alumni.id ?? null;
    }

    const qb = this.eventRepo.createQueryBuilder('event');
    const today = new Date().toISOString().slice(0, 10);
    if (scope === EventListScope.UPCOMING) {
      qb.where('event.eventDate >= :today', { today });
    } else if (scope === EventListScope.PAST) {
      qb.where('event.eventDate < :today', { today });
    }

    if (scope === EventListScope.PAST) {
      qb.orderBy('event.eventDate', 'DESC').addOrderBy('event.startTime', 'DESC');
    } else {
      qb.orderBy('event.eventDate', 'ASC').addOrderBy('event.startTime', 'ASC');
    }

    const total = await qb.getCount();
    const events = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getMany();

    const items = await this.enrichEvents(events, alumniId);

    return { items, total, page, page_size: pageSize };
  }

  async getById(eventId: string, user: { userId: string; role: string }) {
    const event = await this.eventRepo.findOne({ where: { id: eventId } });
    if (!event) {
      throw new ResourceNotFoundException('Event', eventId);
    }

    let alumniId: string | null = null;
    const profile = await this.alumniRepository.findByUserId(user.userId);
    alumniId = profile?.alumni.id ?? null;

    const [item] = await this.enrichEvents([event], alumniId);
    return item;
  }

  async create(adminUserId: string, dto: CreateEventDto) {
    const event = this.eventRepo.create({
      title: dto.title.trim(),
      description: dto.description?.trim() ?? null,
      eventType: dto.event_type,
      eventDate: dto.event_date.slice(0, 10),
      startTime: normalizeTime(dto.start_time),
      endTime: dto.end_time ? normalizeTime(dto.end_time) : null,
      venue: dto.venue.trim(),
      guestSpeaker: dto.guest_speaker?.trim() ?? null,
      createdBy: adminUserId,
    });
    const saved = await this.eventRepo.save(event);
    void this.notifyAlumniAboutEvent(saved);
    return this.toEventResponse(saved);
  }

  async update(eventId: string, dto: UpdateEventDto) {
    const event = await this.eventRepo.findOne({ where: { id: eventId } });
    if (!event) {
      throw new ResourceNotFoundException('Event', eventId);
    }

    if (dto.title !== undefined) event.title = dto.title.trim();
    if (dto.description !== undefined) {
      event.description = dto.description?.trim() ?? null;
    }
    if (dto.event_type !== undefined) event.eventType = dto.event_type;
    if (dto.event_date !== undefined) {
      event.eventDate = dto.event_date.slice(0, 10);
    }
    if (dto.start_time !== undefined) {
      event.startTime = normalizeTime(dto.start_time);
    }
    if (dto.end_time !== undefined) {
      event.endTime = dto.end_time ? normalizeTime(dto.end_time) : null;
    }
    if (dto.venue !== undefined) event.venue = dto.venue.trim();
    if (dto.guest_speaker !== undefined) {
      event.guestSpeaker = dto.guest_speaker?.trim() ?? null;
    }

    return this.toEventResponse(await this.eventRepo.save(event));
  }

  async remove(eventId: string) {
    const event = await this.eventRepo.findOne({ where: { id: eventId } });
    if (!event) {
      throw new ResourceNotFoundException('Event', eventId);
    }
    await this.eventRepo.remove(event);
    return { id: eventId, deleted: true };
  }

  async upsertRsvp(viewerUserId: string, eventId: string, dto: RsvpEventDto) {
    const viewer = await this.alumniRepository.findByUserId(viewerUserId);
    if (!viewer) {
      throw new ResourceNotFoundException('Alumni profile for user', viewerUserId);
    }

    const event = await this.eventRepo.findOne({ where: { id: eventId } });
    if (!event) {
      throw new ResourceNotFoundException('Event', eventId);
    }

    let rsvp = await this.rsvpRepo.findOne({
      where: { eventId, alumniId: viewer.alumni.id },
    });

    if (rsvp) {
      rsvp.status = dto.status;
      rsvp = await this.rsvpRepo.save(rsvp);
    } else {
      rsvp = await this.rsvpRepo.save(
        this.rsvpRepo.create({
          eventId,
          alumniId: viewer.alumni.id,
          status: dto.status,
        }),
      );
    }

    return {
      id: rsvp.id,
      event_id: rsvp.eventId,
      alumni_id: rsvp.alumniId,
      status: rsvp.status,
      created_at: rsvp.createdAt,
      updated_at: rsvp.updatedAt,
    };
  }

  async buildManifestCsv(eventId: string): Promise<string> {
    const event = await this.eventRepo.findOne({ where: { id: eventId } });
    if (!event) {
      throw new ResourceNotFoundException('Event', eventId);
    }

    const rows = await this.rsvpRepo
      .createQueryBuilder('r')
      .innerJoinAndSelect('r.alumni', 'a')
      .where('r.eventId = :eventId', { eventId })
      .orderBy('r.status', 'ASC')
      .addOrderBy('a.fullName', 'ASC')
      .getMany();

    const alumniIds = rows.map((r) => r.alumniId);
    const academics =
      alumniIds.length === 0
        ? []
        : await this.academicRepo
            .createQueryBuilder('ac')
            .where('ac.alumniId IN (:...alumniIds)', { alumniIds })
            .orderBy('ac.createdAt', 'ASC')
            .getMany();

    const graduationByAlumni = new Map<string, string>();
    for (const ac of academics) {
      if (!graduationByAlumni.has(ac.alumniId)) {
        graduationByAlumni.set(ac.alumniId, ac.graduationYear);
      }
    }

    const header = [
      'first_name',
      'last_name',
      'email',
      'graduation_year',
      'rsvp_status',
      'responded_at',
    ];
    const lines = [header.join(',')];

    for (const row of rows) {
      const { firstName, lastName } = splitFullName(row.alumni.fullName);
      lines.push(
        [
          csvEscape(firstName),
          csvEscape(lastName),
          csvEscape(row.alumni.email),
          csvEscape(graduationByAlumni.get(row.alumniId) ?? ''),
          csvEscape(row.status),
          csvEscape(row.updatedAt.toISOString()),
        ].join(','),
      );
    }

    return `${lines.join('\n')}\n`;
  }

  private async enrichEvents(events: EventEntity[], alumniId: string | null) {
    if (events.length === 0) return [];

    const eventIds = events.map((e) => e.id);
    const counts = await this.rsvpRepo
      .createQueryBuilder('r')
      .select('r.eventId', 'eventId')
      .addSelect('r.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('r.eventId IN (:...eventIds)', { eventIds })
      .groupBy('r.eventId')
      .addGroupBy('r.status')
      .getRawMany<{ eventId: string; status: RsvpStatus; count: string }>();

    const countMap = new Map<string, { going: number; not_going: number; maybe: number; total: number }>();
    for (const id of eventIds) {
      countMap.set(id, { going: 0, not_going: 0, maybe: 0, total: 0 });
    }
    for (const row of counts) {
      const bucket = countMap.get(row.eventId)!;
      const n = Number(row.count);
      bucket.total += n;
      if (row.status === RsvpStatus.GOING) bucket.going += n;
      if (row.status === RsvpStatus.NOT_GOING) bucket.not_going += n;
      if (row.status === RsvpStatus.MAYBE) bucket.maybe += n;
    }

    const myRsvpByEvent = new Map<string, RsvpStatus>();
    if (alumniId) {
      const mine = await this.rsvpRepo
        .createQueryBuilder('r')
        .where('r.alumniId = :alumniId', { alumniId })
        .andWhere('r.eventId IN (:...eventIds)', { eventIds })
        .getMany();
      for (const r of mine) {
        myRsvpByEvent.set(r.eventId, r.status);
      }
    }

    return events.map((event) => ({
      ...this.toEventResponse(event),
      my_rsvp_status: myRsvpByEvent.get(event.id) ?? null,
      rsvp_counts: countMap.get(event.id)!,
    }));
  }

  private async notifyAlumniAboutEvent(event: EventEntity): Promise<void> {
    try {
      const profiles = await this.alumniRepository.findAll();
      const active = profiles.filter(
        (p) => p.alumni.status === AlumniStatus.ACTIVE && p.alumni.email,
      );

      const results = await Promise.allSettled(
        active.map((profile) =>
          this.notificationSender.send({
            to: profile.alumni.email,
            templateId: 'event_published',
            variables: {
              fullName: profile.alumni.fullName,
              eventTitle: event.title,
              eventType: event.eventType,
              eventDate: event.eventDate,
              startTime: String(event.startTime).slice(0, 5),
              endTime: event.endTime
                ? String(event.endTime).slice(0, 5)
                : '',
              venue: event.venue,
              guestSpeaker: event.guestSpeaker ?? '',
              description: event.description ?? '',
            },
          }),
        ),
      );

      const failed = results.filter((r) => r.status === 'rejected').length;
      this.logger.log(
        `EVENT_NOTIFY eventId=${event.id} sent=${results.length - failed} failed=${failed}`,
      );
    } catch (error) {
      this.logger.error(
        `EVENT_NOTIFY_FAILED eventId=${event.id}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private toEventResponse(event: EventEntity) {
    return {
      id: event.id,
      title: event.title,
      description: event.description,
      event_type: event.eventType,
      event_date: event.eventDate,
      start_time: String(event.startTime).slice(0, 8),
      end_time: event.endTime ? String(event.endTime).slice(0, 8) : null,
      venue: event.venue,
      guest_speaker: event.guestSpeaker,
      created_by: event.createdBy,
      created_at: event.createdAt,
      updated_at: event.updatedAt,
    };
  }
}

function normalizeTime(value: string): string {
  return value.length === 5 ? `${value}:00` : value;
}

function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { firstName: '', lastName: '' };
  }
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' };
  }
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
