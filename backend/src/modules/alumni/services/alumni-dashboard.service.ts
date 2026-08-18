import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, MoreThanOrEqual, Repository } from 'typeorm';
import { ALUMNI_REPOSITORY } from '../../../common/constants/tokens';
import { ResourceNotFoundException } from '../../../common/exceptions';
import {
  AlumniAcademicInformationEntity,
  AlumniEntity,
  AlumniProfessionalInformationEntity,
  AnnouncementEntity,
  DegreeProgramEntity,
  EventEntity,
  EventRsvpEntity,
} from '../../../database/entities';
import { SEED_CATALOG } from '../../../database/seeds/catalog.seed';
import { PortalMediaService } from '../../media/portal-media.service';
import type { IAlumniRepository } from '../interfaces/alumni.repository.interface';
import type { AlumniDashboardResponseDto } from '../dto/dashboard-response.dto';

@Injectable()
export class AlumniDashboardService {
  constructor(
    @Inject(ALUMNI_REPOSITORY)
    private readonly alumniRepository: IAlumniRepository,
    @InjectRepository(AlumniEntity)
    private readonly alumniRepo: Repository<AlumniEntity>,
    @InjectRepository(AlumniAcademicInformationEntity)
    private readonly academicRepo: Repository<AlumniAcademicInformationEntity>,
    @InjectRepository(AlumniProfessionalInformationEntity)
    private readonly professionalRepo: Repository<AlumniProfessionalInformationEntity>,
    @InjectRepository(EventEntity)
    private readonly eventRepo: Repository<EventEntity>,
    @InjectRepository(EventRsvpEntity)
    private readonly rsvpRepo: Repository<EventRsvpEntity>,
    @InjectRepository(AnnouncementEntity)
    private readonly announcementRepo: Repository<AnnouncementEntity>,
    @InjectRepository(DegreeProgramEntity)
    private readonly degreeProgramRepo: Repository<DegreeProgramEntity>,
    private readonly portalMediaService: PortalMediaService,
  ) {}

  async getDashboard(userId: string): Promise<AlumniDashboardResponseDto> {
    const profile = await this.alumniRepository.findByUserId(userId);
    if (!profile) {
      throw new ResourceNotFoundException('Alumni profile for user', userId);
    }

    const viewerId = profile.alumni.id;
    const today = new Date().toISOString().slice(0, 10);
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [
      totalAlumni,
      newThisMonth,
      upcomingEventsCount,
      verifiedAlumniCount,
      recentAlumni,
      upcomingEvents,
      announcements,
    ] = await Promise.all([
      this.alumniRepo.count(),
      this.alumniRepo
        .createQueryBuilder('alumni')
        .where('alumni.created_at >= :monthStart', { monthStart })
        .getCount(),
      this.eventRepo
        .createQueryBuilder('event')
        .where('event.isDraft = false')
        .andWhere('event.eventDate >= :today', { today })
        .getCount(),
      this.alumniRepo
        .createQueryBuilder('alumni')
        .where("alumni.qr_code IS NOT NULL AND alumni.qr_code <> ''")
        .getCount(),
      this.alumniRepo.find({
        where: {},
        relations: { photoMedia: true },
        order: { createdAt: 'DESC' },
        take: 4,
      }),
      this.eventRepo.find({
        where: {
          isDraft: false,
          eventDate: MoreThanOrEqual(today),
        },
        order: { eventDate: 'ASC', startTime: 'ASC' },
        take: 5,
      }),
      this.announcementRepo.find({
        where: { isPublished: true },
        order: { publishedAt: 'DESC' },
        take: 5,
      }),
    ]);

    const degreeLabelById = await this.buildDegreeLabelMap(
      recentAlumni.map((a) => a.id),
    );

    const academicsByAlumni = await this.loadPrimaryAcademics(
      recentAlumni.map((a) => a.id),
    );
    const professionalsByAlumni = await this.loadPrimaryProfessionals(
      recentAlumni.map((a) => a.id),
    );

    const rsvps =
      upcomingEvents.length === 0
        ? []
        : await this.rsvpRepo.find({
            where: {
              alumniId: viewerId,
              eventId: In(upcomingEvents.map((event) => event.id)),
            },
          });
    const rsvpByEvent = new Map(rsvps.map((r) => [r.eventId, r.status]));

    const newlyRegistered = await Promise.all(
      recentAlumni.map(async (alumni) => {
        const academic = academicsByAlumni.get(alumni.id);
        const professional = professionalsByAlumni.get(alumni.id);
        return {
          alumni_id: alumni.id,
          full_name: alumni.fullName,
          photo_url: await this.portalMediaService.resolvePublicUrl(
            alumni.photoMedia,
          ),
          degree_label: academic
            ? (degreeLabelById.get(academic.degreeProgramId) ?? null)
            : null,
          graduation_year: academic?.graduationYear ?? null,
          job_title: professional?.jobTitle ?? professional?.role ?? null,
        };
      }),
    );

    const verifiedPercent =
      totalAlumni === 0
        ? 0
        : Math.round((verifiedAlumniCount / totalAlumni) * 100);

    return {
      full_name: profile.alumni.fullName,
      photo_url: await this.portalMediaService.resolvePublicUrl(
        profile.alumni.photoMedia,
      ),
      stats: {
        total_alumni: totalAlumni,
        new_this_month: newThisMonth,
        upcoming_events: upcomingEventsCount,
        verified_profiles_percent: verifiedPercent,
      },
      newly_registered: newlyRegistered,
      upcoming_events: upcomingEvents.map((event) => ({
        id: event.id,
        title: event.title,
        venue: event.venue,
        event_date: event.eventDate,
        start_time: event.startTime,
        my_rsvp_status: rsvpByEvent.get(event.id) ?? null,
        is_online: /online|virtual|zoom|meet/i.test(event.venue),
      })),
      announcements: announcements.map((row) => ({
        id: row.id,
        title: row.title,
        content: row.content,
        category: row.category,
        published_at: row.publishedAt,
      })),
    };
  }

  private async buildDegreeLabelMap(
    alumniIds: string[],
  ): Promise<Map<string, string>> {
    const map = new Map<string, string>();
    if (alumniIds.length === 0) return map;

    const academics = await this.academicRepo
      .createQueryBuilder('academic')
      .where('academic.alumni_id IN (:...alumniIds)', { alumniIds })
      .getMany();

    const degreeProgramIds = [
      ...new Set(academics.map((a) => a.degreeProgramId)),
    ];
    if (degreeProgramIds.length === 0) return map;

    const seedLabels = new Map(
      SEED_CATALOG.degree_programs.map((dp) => [dp.id, dp.label] as const),
    );

    const programs = await this.degreeProgramRepo.find({
      where: { id: In(degreeProgramIds) },
      relations: { degree: true, program: true },
    });

    for (const program of programs) {
      const seed = seedLabels.get(program.id);
      if (seed) {
        map.set(program.id, seed.split(' — ')[0] ?? seed);
        continue;
      }
      const degreeCode = program.degree?.code ?? '';
      const programName = program.program?.name ?? '';
      map.set(
        program.id,
        [degreeCode, programName].filter(Boolean).join(' ') || program.id,
      );
    }

    for (const [id, label] of seedLabels) {
      if (!map.has(id)) {
        map.set(id, label.split(' — ')[0] ?? label);
      }
    }

    return map;
  }

  private async loadPrimaryAcademics(alumniIds: string[]) {
    const map = new Map<string, AlumniAcademicInformationEntity>();
    if (alumniIds.length === 0) return map;
    const rows = await this.academicRepo
      .createQueryBuilder('academic')
      .where('academic.alumni_id IN (:...alumniIds)', { alumniIds })
      .orderBy('academic.graduation_year', 'DESC')
      .getMany();
    for (const row of rows) {
      if (!map.has(row.alumniId)) map.set(row.alumniId, row);
    }
    return map;
  }

  private async loadPrimaryProfessionals(alumniIds: string[]) {
    const map = new Map<string, AlumniProfessionalInformationEntity>();
    if (alumniIds.length === 0) return map;
    const rows = await this.professionalRepo
      .createQueryBuilder('professional')
      .where('professional.alumni_id IN (:...alumniIds)', { alumniIds })
      .orderBy('professional.start_date', 'DESC')
      .getMany();
    for (const row of rows) {
      if (!map.has(row.alumniId)) map.set(row.alumniId, row);
    }
    return map;
  }
}
