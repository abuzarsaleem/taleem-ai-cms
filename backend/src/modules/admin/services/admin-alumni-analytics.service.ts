import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { AlumniStatus } from '../../../common/enums';
import { AlumniEntity } from '../../../database/entities';
import {
  AdminAlumniQueryDto,
  AdminOutreachChannel,
  AdminOutreachExportQueryDto,
} from '../dto/admin-alumni.dto';

@Injectable()
export class AdminAlumniAnalyticsService {
  constructor(
    @InjectRepository(AlumniEntity)
    private readonly alumniRepo: Repository<AlumniEntity>,
  ) {}

  async list(query: AdminAlumniQueryDto) {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.page_size ?? 20));

    const qb = this.baseFilteredQuery(query)
      .orderBy('alumni.fullName', 'ASC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [rows, total] = await qb.getManyAndCount();

    const items = rows.map((row) => ({
      alumni_id: row.id,
      full_name: row.fullName,
      email: row.email,
      phone_number: row.phoneNumber,
      whatsapp_number: row.whatsappNumber,
      city: row.city,
      country: row.country,
      photo_url: row.photoUrl,
      graduation_year: row.academicRecords?.[0]?.graduationYear ?? null,
      registration_roll_number:
        row.academicRecords?.[0]?.registrationRollNumber ?? null,
      degree_program_id: row.academicRecords?.[0]?.degreeProgramId ?? null,
      degree_program: row.academicRecords?.[0]?.degreeProgram
        ? {
            id: row.academicRecords[0].degreeProgram.id,
            degree_id: row.academicRecords[0].degreeProgram.degree.id,
            degree: row.academicRecords[0].degreeProgram.degree.name,
            degree_code: row.academicRecords[0].degreeProgram.degree.code,
            program_id: row.academicRecords[0].degreeProgram.program.id,
            program: row.academicRecords[0].degreeProgram.program.name,
            department:
              row.academicRecords[0].degreeProgram.program.department ?? null,
            campus: row.academicRecords[0].degreeProgram.campus?.name ?? null,
          }
        : null,
      professional:
        row.professionalRecords?.[0]
          ? {
              current_company: row.professionalRecords[0].currentCompany,
              job_title: row.professionalRecords[0].jobTitle,
              industry: row.professionalRecords[0].industry,
            }
          : null,
    }));

    const [distribution, geography] = await Promise.all([
      this.buildDistribution(query),
      this.buildGeography(query),
    ]);

    return {
      items,
      total,
      page,
      page_size: pageSize,
      analytics: {
        distribution,
        geography,
      },
    };
  }

  private async buildDistribution(query: AdminAlumniQueryDto) {
    const gradQb = this.baseFilteredAggregateQuery(query)
      .select('academic.graduationYear', 'label')
      .addSelect('COUNT(DISTINCT alumni.id)', 'count')
      .andWhere('academic.graduationYear IS NOT NULL')
      .groupBy('academic.graduationYear')
      .orderBy('academic.graduationYear', 'ASC');

    const degreeQb = this.baseFilteredAggregateQuery(query)
      .select('degree.code', 'label')
      .addSelect('COUNT(DISTINCT alumni.id)', 'count')
      .andWhere('degree.id IS NOT NULL')
      .groupBy('degree.code')
      .addGroupBy('degree.name')
      .orderBy('count', 'DESC');

    const degreeProgramQb = this.baseFilteredAggregateQuery(query)
      .select(`CONCAT(degree.name, ' - ', program.name)`, 'label')
      .addSelect('COUNT(DISTINCT alumni.id)', 'count')
      .andWhere('degree.id IS NOT NULL')
      .andWhere('program.id IS NOT NULL')
      .groupBy('degree.name')
      .addGroupBy('program.name')
      .orderBy('count', 'DESC');

    const departmentQb = this.baseFilteredAggregateQuery(query)
      .select('program.department', 'label')
      .addSelect('COUNT(DISTINCT alumni.id)', 'count')
      .andWhere('program.department IS NOT NULL')
      .groupBy('program.department')
      .orderBy('count', 'DESC');

    return {
      graduation_year: await this.rawCounts(gradQb),
      degree: await this.rawCounts(degreeQb),
      degree_program: await this.rawCounts(degreeProgramQb),
      department: await this.rawCounts(departmentQb),
    };
  }

  private async buildGeography(query: AdminAlumniQueryDto) {
    const cityQb = this.baseFilteredAggregateQuery(query)
      .select('alumni.city', 'label')
      .addSelect('COUNT(DISTINCT alumni.id)', 'count')
      .andWhere('alumni.city IS NOT NULL')
      .groupBy('alumni.city')
      .orderBy('count', 'DESC');

    const countryQb = this.baseFilteredAggregateQuery(query)
      .select('alumni.country', 'label')
      .addSelect('COUNT(DISTINCT alumni.id)', 'count')
      .andWhere('alumni.country IS NOT NULL')
      .groupBy('alumni.country')
      .orderBy('count', 'DESC');

    return {
      cities: await this.rawCounts(cityQb),
      countries: await this.rawCounts(countryQb),
    };
  }

  async exportOutreachCsv(query: AdminOutreachExportQueryDto) {
    const rows = await this.baseFilteredQuery(query)
      .orderBy('alumni.fullName', 'ASC')
      .getMany();

    const filtered = rows.filter((row) => {
      if (query.channel === AdminOutreachChannel.WHATSAPP) {
        return Boolean(row.whatsappNumber || row.phoneNumber);
      }
      if (query.channel === AdminOutreachChannel.EMAIL) {
        return Boolean(row.email);
      }
      return Boolean(row.email || row.whatsappNumber || row.phoneNumber);
    });

    const headers = query.names_only
      ? ['full_name']
      : [
          'full_name',
          'email',
          'phone_number',
          'whatsapp_number',
          'graduation_year',
          'degree_program',
          'department',
          'city',
          'country',
        ];

    const lines = [headers.join(',')];

    for (const row of filtered) {
      const academic = row.academicRecords?.[0];
      const degreeProgram = academic?.degreeProgram;
      const degreeProgramLabel = degreeProgram
        ? `${degreeProgram.degree.name} - ${degreeProgram.program.name}`
        : '';
      const data = query.names_only
        ? [csvEscape(row.fullName)]
        : [
            csvEscape(row.fullName),
            csvEscape(row.email ?? ''),
            csvEscape(row.phoneNumber ?? ''),
            csvEscape(row.whatsappNumber ?? ''),
            csvEscape(academic?.graduationYear ?? ''),
            csvEscape(degreeProgramLabel),
            csvEscape(degreeProgram?.program.department ?? ''),
            csvEscape(row.city ?? ''),
            csvEscape(row.country ?? ''),
          ];
      lines.push(data.join(','));
    }

    return `${lines.join('\n')}\n`;
  }

  private baseFilteredQuery(query: AdminAlumniQueryDto) {
    const qb = this.alumniRepo
      .createQueryBuilder('alumni')
      .leftJoinAndSelect('alumni.academicRecords', 'academic')
      .leftJoinAndSelect('academic.degreeProgram', 'degreeProgram')
      .leftJoinAndSelect('degreeProgram.degree', 'degree')
      .leftJoinAndSelect('degreeProgram.program', 'program')
      .leftJoinAndSelect('degreeProgram.campus', 'campus')
      .leftJoinAndSelect('alumni.professionalRecords', 'professional')
      .where('alumni.status = :status', { status: AlumniStatus.ACTIVE });

    this.applyFilters(qb, query);
    return qb;
  }

  private baseFilteredAggregateQuery(query: AdminAlumniQueryDto) {
    const qb = this.alumniRepo
      .createQueryBuilder('alumni')
      .leftJoin('alumni.academicRecords', 'academic')
      .leftJoin('academic.degreeProgram', 'degreeProgram')
      .leftJoin('degreeProgram.degree', 'degree')
      .leftJoin('degreeProgram.program', 'program')
      .leftJoin('alumni.professionalRecords', 'professional')
      .where('alumni.status = :status', { status: AlumniStatus.ACTIVE });

    this.applyFilters(qb, query);
    return qb;
  }

  private applyFilters(
    qb: SelectQueryBuilder<AlumniEntity>,
    query: AdminAlumniQueryDto,
  ) {
    if (query.search?.trim()) {
      const search = `%${query.search.trim().toLowerCase()}%`;
      qb.andWhere(
        `(
          LOWER(alumni.fullName) LIKE :search OR
          LOWER(alumni.email) LIKE :search OR
          LOWER(COALESCE(alumni.phoneNumber, '')) LIKE :search OR
          LOWER(COALESCE(alumni.whatsappNumber, '')) LIKE :search
        )`,
        { search },
      );
    }
    if (query.graduation_year?.trim()) {
      qb.andWhere('academic.graduationYear = :graduationYear', {
        graduationYear: query.graduation_year.trim(),
      });
    }
    if (query.degree_id) {
      qb.andWhere('degree.id = :degreeId', {
        degreeId: query.degree_id,
      });
    }
    if (query.program_id) {
      qb.andWhere('program.id = :programId', {
        programId: query.program_id,
      });
    }
    if (query.degree_program_id) {
      qb.andWhere('academic.degreeProgramId = :degreeProgramId', {
        degreeProgramId: query.degree_program_id,
      });
    }
    if (query.department?.trim()) {
      qb.andWhere('LOWER(program.department) LIKE :department', {
        department: `%${query.department.trim().toLowerCase()}%`,
      });
    }
    if (query.city?.trim()) {
      qb.andWhere('LOWER(alumni.city) LIKE :city', {
        city: `%${query.city.trim().toLowerCase()}%`,
      });
    }
    if (query.country?.trim()) {
      qb.andWhere('LOWER(alumni.country) LIKE :country', {
        country: `%${query.country.trim().toLowerCase()}%`,
      });
    }
    if (query.industry?.trim()) {
      qb.andWhere('LOWER(professional.industry) LIKE :industry', {
        industry: `%${query.industry.trim().toLowerCase()}%`,
      });
    }
  }

  private async rawCounts(qb: SelectQueryBuilder<AlumniEntity>) {
    const rows = await qb.getRawMany<{ label: string | null; count: string }>();
    return rows
      .filter((row) => row.label)
      .map((row) => ({ label: row.label, count: Number(row.count) }));
  }
}

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
