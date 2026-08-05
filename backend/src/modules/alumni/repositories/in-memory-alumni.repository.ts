import { Injectable } from '@nestjs/common';
import { AlumniStatus } from '../../../common/enums';
import { generateId } from '../../../common/utils';
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
export class InMemoryAlumniRepository implements IAlumniRepository {
  private readonly alumni = new Map<string, Alumni>();
  private readonly academic = new Map<string, AlumniAcademicInformation[]>();
  private readonly professional = new Map<
    string,
    AlumniProfessionalInformation[]
  >();

  async create(input: CreateAlumniInput): Promise<AlumniProfile> {
    const now = new Date();
    const alumni: Alumni = {
      id: generateId(),
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
      createdAt: now,
      updatedAt: now,
    };

    const academic: AlumniAcademicInformation = {
      id: generateId(),
      alumniId: alumni.id,
      degreeProgramId: input.academic.degreeProgramId,
      registrationRollNumber: input.academic.registrationRollNumber,
      graduationYear: input.academic.graduationYear,
      cgpa: input.academic.cgpa ?? null,
      createdAt: now,
      updatedAt: now,
    };

    this.alumni.set(alumni.id, alumni);
    this.academic.set(alumni.id, [academic]);
    this.professional.set(alumni.id, []);
    return this.toProfile(alumni.id)!;
  }

  async findById(id: string): Promise<AlumniProfile | null> {
    return this.toProfile(id);
  }

  async findByEmail(email: string): Promise<AlumniProfile | null> {
    const normalized = email.toLowerCase();
    for (const alumni of this.alumni.values()) {
      if (alumni.email === normalized) return this.toProfile(alumni.id);
    }
    return null;
  }

  async findByUserId(userId: string): Promise<AlumniProfile | null> {
    for (const alumni of this.alumni.values()) {
      if (alumni.userId === userId) return this.toProfile(alumni.id);
    }
    return null;
  }

  async findByRegistrationRequestId(
    registrationRequestId: string,
  ): Promise<AlumniProfile | null> {
    for (const alumni of this.alumni.values()) {
      if (alumni.registrationRequestId === registrationRequestId) {
        return this.toProfile(alumni.id);
      }
    }
    return null;
  }

  async findAll(): Promise<AlumniProfile[]> {
    return Array.from(this.alumni.keys())
      .map((id) => this.toProfile(id))
      .filter((p): p is AlumniProfile => p !== null);
  }

  async searchDirectory(
    filters: AlumniDirectoryFilters,
  ): Promise<AlumniDirectoryPage> {
    const page = Math.max(1, filters.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 20));
    let items = (await this.findAll()).filter(
      (p) => p.alumni.status === AlumniStatus.ACTIVE,
    );

    if (filters.excludeAlumniId) {
      items = items.filter((p) => p.alumni.id !== filters.excludeAlumniId);
    }
    if (filters.name?.trim()) {
      const q = filters.name.trim().toLowerCase();
      items = items.filter((p) => p.alumni.fullName.toLowerCase().includes(q));
    }
    if (filters.city?.trim()) {
      const q = filters.city.trim().toLowerCase();
      items = items.filter((p) => p.alumni.city?.toLowerCase().includes(q));
    }
    if (filters.country?.trim()) {
      const q = filters.country.trim().toLowerCase();
      items = items.filter((p) => p.alumni.country?.toLowerCase().includes(q));
    }
    if (filters.graduationYear?.trim()) {
      items = items.filter((p) =>
        p.academic.some(
          (a) => a.graduationYear === filters.graduationYear!.trim(),
        ),
      );
    }
    if (filters.degreeProgramId) {
      items = items.filter((p) =>
        p.academic.some((a) => a.degreeProgramId === filters.degreeProgramId),
      );
    }
    if (filters.industry?.trim()) {
      const q = filters.industry.trim().toLowerCase();
      items = items.filter((p) =>
        p.professional.some((pr) => pr.industry?.toLowerCase().includes(q)),
      );
    }

    items.sort((a, b) => a.alumni.fullName.localeCompare(b.alumni.fullName));
    const total = items.length;
    const start = (page - 1) * pageSize;
    return {
      items: items.slice(start, start + pageSize),
      total,
      page,
      pageSize,
    };
  }

  async updateAlumni(id: string, patch: Partial<Alumni>): Promise<Alumni> {
    const existing = this.alumni.get(id);
    if (!existing) throw new Error(`Alumni ${id} not found`);
    const updated: Alumni = {
      ...existing,
      ...patch,
      id: existing.id,
      updatedAt: new Date(),
    };
    this.alumni.set(id, updated);
    return { ...updated };
  }

  async addAcademic(
    alumniId: string,
    data: Omit<
      AlumniAcademicInformation,
      'id' | 'alumniId' | 'createdAt' | 'updatedAt'
    >,
  ): Promise<AlumniAcademicInformation> {
    const now = new Date();
    const row: AlumniAcademicInformation = {
      id: generateId(),
      alumniId,
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    const list = this.academic.get(alumniId) ?? [];
    list.push(row);
    this.academic.set(alumniId, list);
    return { ...row };
  }

  async upsertProfessional(
    alumniId: string,
    data: Partial<AlumniProfessionalInformation> & { startDate: Date },
  ): Promise<AlumniProfessionalInformation> {
    const list = this.professional.get(alumniId) ?? [];
    const existing = list[0];
    const now = new Date();
    const updated: AlumniProfessionalInformation = {
      id: existing?.id ?? generateId(),
      alumniId,
      currentCompany: data.currentCompany ?? existing?.currentCompany ?? null,
      jobTitle: data.jobTitle ?? existing?.jobTitle ?? null,
      industry: data.industry ?? existing?.industry ?? null,
      yearsOfExperience:
        data.yearsOfExperience ?? existing?.yearsOfExperience ?? null,
      linkedinUrl: data.linkedinUrl ?? existing?.linkedinUrl ?? null,
      startDate: data.startDate ?? existing?.startDate ?? now,
      endDate: data.endDate ?? existing?.endDate ?? null,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    this.professional.set(alumniId, [updated, ...list.slice(1)]);
    return { ...updated };
  }

  private toProfile(id: string): AlumniProfile | null {
    const alumni = this.alumni.get(id);
    if (!alumni) return null;
    return {
      alumni: { ...alumni },
      academic: (this.academic.get(id) ?? []).map((a) => ({ ...a })),
      professional: (this.professional.get(id) ?? []).map((p) => ({ ...p })),
    };
  }
}
