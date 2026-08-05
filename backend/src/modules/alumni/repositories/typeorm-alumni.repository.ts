import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AlumniStatus } from '../../../common/enums';
import {
  AlumniAcademicInformationEntity,
  AlumniEntity,
  AlumniProfessionalInformationEntity,
} from '../../../database/entities';
import {
  Alumni,
  AlumniAcademicInformation,
  AlumniProfessionalInformation,
  AlumniProfile,
} from '../entities/alumni.entity';
import {
  CreateAlumniInput,
  AlumniDirectoryFilters,
  AlumniDirectoryPage,
  IAlumniRepository,
} from '../interfaces/alumni.repository.interface';

@Injectable()
export class TypeOrmAlumniRepository implements IAlumniRepository {
  constructor(
    @InjectRepository(AlumniEntity)
    private readonly alumniRepo: Repository<AlumniEntity>,
    @InjectRepository(AlumniAcademicInformationEntity)
    private readonly academicRepo: Repository<AlumniAcademicInformationEntity>,
    @InjectRepository(AlumniProfessionalInformationEntity)
    private readonly professionalRepo: Repository<AlumniProfessionalInformationEntity>,
  ) {}

  async create(input: CreateAlumniInput): Promise<AlumniProfile> {
    const alumni = this.alumniRepo.create({
      userId: input.userId ?? null,
      registrationRequestId: input.registrationRequestId,
      status: AlumniStatus.ACTIVE,
      fullName: input.fullName,
      email: input.email.toLowerCase(),
      dateOfBirth: null,
      gender: null,
      phoneNumber: input.phoneNumber ?? null,
      whatsappNumber: input.whatsappNumber ?? null,
      cnicNationalId: input.cnicNationalId,
      address: null,
      secondryAddress: null,
      city: null,
      country: null,
      qrCode: '',
      photoUrl: input.photoUrl ?? null,
    });
    const saved = await this.alumniRepo.save(alumni);

    const academic = this.academicRepo.create({
      alumniId: saved.id,
      degreeProgramId: input.academic.degreeProgramId,
      registrationRollNumber: input.academic.registrationRollNumber,
      graduationYear: input.academic.graduationYear,
      cgpa:
        input.academic.cgpa !== undefined && input.academic.cgpa !== null
          ? String(input.academic.cgpa)
          : null,
    });
    await this.academicRepo.save(academic);

    return (await this.findById(saved.id))!;
  }

  async findById(id: string): Promise<AlumniProfile | null> {
    return this.toProfile(
      await this.alumniRepo.findOne({
        where: { id },
        relations: { academicRecords: true, professionalRecords: true },
      }),
    );
  }

  async findByEmail(email: string): Promise<AlumniProfile | null> {
    return this.toProfile(
      await this.alumniRepo.findOne({
        where: { email: email.toLowerCase() },
        relations: { academicRecords: true, professionalRecords: true },
      }),
    );
  }

  async findByUserId(userId: string): Promise<AlumniProfile | null> {
    return this.toProfile(
      await this.alumniRepo.findOne({
        where: { userId },
        relations: { academicRecords: true, professionalRecords: true },
      }),
    );
  }

  async findByRegistrationRequestId(
    registrationRequestId: string,
  ): Promise<AlumniProfile | null> {
    return this.toProfile(
      await this.alumniRepo.findOne({
        where: { registrationRequestId },
        relations: { academicRecords: true, professionalRecords: true },
      }),
    );
  }

  async findAll(): Promise<AlumniProfile[]> {
    const rows = await this.alumniRepo.find({
      relations: { academicRecords: true, professionalRecords: true },
      order: { createdAt: 'DESC' },
    });
    return rows
      .map((row) => this.toProfile(row))
      .filter((p): p is AlumniProfile => p !== null);
  }

  async searchDirectory(
    filters: AlumniDirectoryFilters,
  ): Promise<AlumniDirectoryPage> {
    const page = Math.max(1, filters.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 20));

    const qb = this.alumniRepo
      .createQueryBuilder('alumni')
      .leftJoinAndSelect('alumni.academicRecords', 'academic')
      .leftJoinAndSelect('alumni.professionalRecords', 'professional')
      .where('alumni.status = :status', { status: AlumniStatus.ACTIVE });

    if (filters.excludeAlumniId) {
      qb.andWhere('alumni.id != :excludeId', {
        excludeId: filters.excludeAlumniId,
      });
    }
    if (filters.name?.trim()) {
      qb.andWhere('LOWER(alumni.fullName) LIKE :name', {
        name: `%${filters.name.trim().toLowerCase()}%`,
      });
    }
    if (filters.city?.trim()) {
      qb.andWhere('LOWER(alumni.city) LIKE :city', {
        city: `%${filters.city.trim().toLowerCase()}%`,
      });
    }
    if (filters.country?.trim()) {
      qb.andWhere('LOWER(alumni.country) LIKE :country', {
        country: `%${filters.country.trim().toLowerCase()}%`,
      });
    }
    if (filters.graduationYear?.trim()) {
      qb.andWhere('academic.graduationYear = :graduationYear', {
        graduationYear: filters.graduationYear.trim(),
      });
    }
    if (filters.degreeProgramId) {
      qb.andWhere('academic.degreeProgramId = :degreeProgramId', {
        degreeProgramId: filters.degreeProgramId,
      });
    }
    if (filters.industry?.trim()) {
      qb.andWhere('LOWER(professional.industry) LIKE :industry', {
        industry: `%${filters.industry.trim().toLowerCase()}%`,
      });
    }

    qb.orderBy('alumni.fullName', 'ASC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [rows, total] = await qb.getManyAndCount();
    return {
      items: rows
        .map((row) => this.toProfile(row))
        .filter((p): p is AlumniProfile => p !== null),
      total,
      page,
      pageSize,
    };
  }

  async updateAlumni(id: string, patch: Partial<Alumni>): Promise<Alumni> {
    const existing = await this.alumniRepo.findOne({ where: { id } });
    if (!existing) throw new Error(`Alumni ${id} not found`);

    if (patch.userId !== undefined) existing.userId = patch.userId;
    if (patch.registrationRequestId !== undefined)
      existing.registrationRequestId = patch.registrationRequestId;
    if (patch.status !== undefined) existing.status = patch.status;
    if (patch.fullName !== undefined) existing.fullName = patch.fullName;
    if (patch.email !== undefined) existing.email = patch.email.toLowerCase();
    if (patch.dateOfBirth !== undefined) {
      existing.dateOfBirth = patch.dateOfBirth
        ? this.toDateString(patch.dateOfBirth)
        : null;
    }
    if (patch.gender !== undefined) existing.gender = patch.gender;
    if (patch.phoneNumber !== undefined)
      existing.phoneNumber = patch.phoneNumber;
    if (patch.whatsappNumber !== undefined)
      existing.whatsappNumber = patch.whatsappNumber;
    if (patch.cnicNationalId !== undefined)
      existing.cnicNationalId = patch.cnicNationalId;
    if (patch.address !== undefined) existing.address = patch.address;
    if (patch.secondryAddress !== undefined)
      existing.secondryAddress = patch.secondryAddress;
    if (patch.city !== undefined) existing.city = patch.city;
    if (patch.country !== undefined) existing.country = patch.country;
    if (patch.qrCode !== undefined) existing.qrCode = patch.qrCode;
    if (patch.photoUrl !== undefined) existing.photoUrl = patch.photoUrl;

    const saved = await this.alumniRepo.save(existing);
    return this.toAlumniDomain(saved);
  }

  async addAcademic(
    alumniId: string,
    data: Omit<
      AlumniAcademicInformation,
      'id' | 'alumniId' | 'createdAt' | 'updatedAt'
    >,
  ): Promise<AlumniAcademicInformation> {
    const row = this.academicRepo.create({
      alumniId,
      degreeProgramId: data.degreeProgramId,
      registrationRollNumber: data.registrationRollNumber,
      graduationYear: data.graduationYear,
      cgpa: data.cgpa !== null && data.cgpa !== undefined ? String(data.cgpa) : null,
    });
    const saved = await this.academicRepo.save(row);
    return this.toAcademicDomain(saved);
  }

  async upsertProfessional(
    alumniId: string,
    data: Partial<AlumniProfessionalInformation> & { startDate: Date },
  ): Promise<AlumniProfessionalInformation> {
    const existing = await this.professionalRepo.findOne({
      where: { alumniId },
      order: { createdAt: 'ASC' },
    });

    const payload = {
      alumniId,
      currentCompany:
        data.currentCompany ?? existing?.currentCompany ?? null,
      jobTitle: data.jobTitle ?? existing?.jobTitle ?? null,
      industry: data.industry ?? existing?.industry ?? null,
      yearsOfExperience:
        data.yearsOfExperience ?? existing?.yearsOfExperience ?? null,
      linkedinUrl: data.linkedinUrl ?? existing?.linkedinUrl ?? null,
      startDate: this.toDateString(data.startDate),
      endDate:
        data.endDate !== undefined
          ? data.endDate
            ? this.toDateString(data.endDate)
            : null
          : (existing?.endDate ?? null),
    };

    const saved = existing
      ? await this.professionalRepo.save({ ...existing, ...payload })
      : await this.professionalRepo.save(this.professionalRepo.create(payload));

    return this.toProfessionalDomain(saved);
  }

  private toProfile(entity: AlumniEntity | null): AlumniProfile | null {
    if (!entity) return null;
    return {
      alumni: this.toAlumniDomain(entity),
      academic: (entity.academicRecords ?? []).map((a) =>
        this.toAcademicDomain(a),
      ),
      professional: (entity.professionalRecords ?? []).map((p) =>
        this.toProfessionalDomain(p),
      ),
    };
  }

  private toAlumniDomain(entity: AlumniEntity): Alumni {
    return {
      id: entity.id,
      userId: entity.userId,
      registrationRequestId: entity.registrationRequestId,
      status: entity.status,
      fullName: entity.fullName,
      email: entity.email,
      dateOfBirth: entity.dateOfBirth ? new Date(entity.dateOfBirth) : null,
      gender: entity.gender,
      phoneNumber: entity.phoneNumber,
      whatsappNumber: entity.whatsappNumber,
      cnicNationalId: entity.cnicNationalId,
      address: entity.address,
      secondryAddress: entity.secondryAddress,
      city: entity.city,
      country: entity.country,
      qrCode: entity.qrCode,
      photoUrl: entity.photoUrl,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  private toAcademicDomain(
    entity: AlumniAcademicInformationEntity,
  ): AlumniAcademicInformation {
    return {
      id: entity.id,
      alumniId: entity.alumniId,
      degreeProgramId: entity.degreeProgramId,
      registrationRollNumber: entity.registrationRollNumber,
      graduationYear: entity.graduationYear,
      cgpa: entity.cgpa !== null ? Number(entity.cgpa) : null,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  private toProfessionalDomain(
    entity: AlumniProfessionalInformationEntity,
  ): AlumniProfessionalInformation {
    return {
      id: entity.id,
      alumniId: entity.alumniId,
      currentCompany: entity.currentCompany,
      jobTitle: entity.jobTitle,
      industry: entity.industry,
      yearsOfExperience: entity.yearsOfExperience,
      linkedinUrl: entity.linkedinUrl,
      startDate: new Date(entity.startDate),
      endDate: entity.endDate ? new Date(entity.endDate) : null,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  private toDateString(value: Date): string {
    return value.toISOString().slice(0, 10);
  }
}
