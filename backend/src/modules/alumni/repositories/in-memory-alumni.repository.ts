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
  AlumniDirectoryFilterOptions,
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
      linkedinUrl: null,
      qrCode: '',
      publicAlumniCode: input.publicAlumniCode,
      photoMediaId: input.photoMediaId ?? null,
      createdAt: now,
      updatedAt: now,
    };

    const academic: AlumniAcademicInformation = {
      id: generateId(),
      alumniId: alumni.id,
      degreeProgramId: input.academic.degreeProgramId,
      registrationRollNumber: input.academic.registrationRollNumber,
      registrationYear: input.academic.registrationYear ?? null,
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

  async findByPublicAlumniCode(code: string): Promise<AlumniProfile | null> {
    const normalized = code.trim().toUpperCase();
    for (const alumni of this.alumni.values()) {
      if (alumni.publicAlumniCode?.toUpperCase() === normalized) {
        return this.toProfile(alumni.id);
      }
    }
    return null;
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

  async listDirectoryFilterOptions(): Promise<AlumniDirectoryFilterOptions> {
    const profiles = (await this.findAll()).filter(
      (p) => p.alumni.status === AlumniStatus.ACTIVE,
    );
    const cities = [
      ...new Set(
        profiles
          .map((p) => p.alumni.city?.trim())
          .filter((value): value is string => Boolean(value)),
      ),
    ].sort((a, b) => a.localeCompare(b));
    const countries = [
      ...new Set(
        profiles
          .map((p) => p.alumni.country?.trim())
          .filter((value): value is string => Boolean(value)),
      ),
    ].sort((a, b) => a.localeCompare(b));
    const graduationYears = [
      ...new Set(
        profiles.flatMap((p) =>
          p.academic
            .map((row) => row.graduationYear?.trim())
            .filter((value): value is string => Boolean(value)),
        ),
      ),
    ].sort((a, b) => Number(b) - Number(a) || b.localeCompare(a));

    return { cities, countries, graduationYears };
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

  async listAcademic(alumniId: string): Promise<AlumniAcademicInformation[]> {
    return [...(this.academic.get(alumniId) ?? [])]
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map((row) => ({ ...row }));
  }

  async findAcademicById(
    id: string,
  ): Promise<AlumniAcademicInformation | null> {
    for (const list of this.academic.values()) {
      const row = list.find((item) => item.id === id);
      if (row) return { ...row };
    }
    return null;
  }

  async updateAcademic(
    id: string,
    patch: Partial<
      Omit<AlumniAcademicInformation, 'id' | 'alumniId' | 'createdAt' | 'updatedAt'>
    >,
  ): Promise<AlumniAcademicInformation> {
    for (const [alumniId, list] of this.academic.entries()) {
      const index = list.findIndex((item) => item.id === id);
      if (index < 0) continue;
      const updated: AlumniAcademicInformation = {
        ...list[index],
        ...patch,
        id: list[index].id,
        alumniId: list[index].alumniId,
        updatedAt: new Date(),
      };
      list[index] = updated;
      this.academic.set(alumniId, list);
      return { ...updated };
    }
    throw new Error(`Academic ${id} not found`);
  }

  async deleteAcademic(id: string): Promise<void> {
    for (const [alumniId, list] of this.academic.entries()) {
      const next = list.filter((item) => item.id !== id);
      if (next.length !== list.length) {
        this.academic.set(alumniId, next);
        return;
      }
    }
  }

  async listProfessional(
    alumniId: string,
  ): Promise<AlumniProfessionalInformation[]> {
    return [...(this.professional.get(alumniId) ?? [])]
      .sort((a, b) => {
        const startDiff = b.startDate.getTime() - a.startDate.getTime();
        if (startDiff !== 0) return startDiff;
        return b.createdAt.getTime() - a.createdAt.getTime();
      })
      .map((row) => ({ ...row }));
  }

  async findProfessionalById(
    id: string,
  ): Promise<AlumniProfessionalInformation | null> {
    for (const list of this.professional.values()) {
      const row = list.find((item) => item.id === id);
      if (row) return { ...row };
    }
    return null;
  }

  async findCurrentProfessional(
    alumniId: string,
  ): Promise<AlumniProfessionalInformation | null> {
    const current = (this.professional.get(alumniId) ?? [])
      .filter((row) => row.endDate === null)
      .sort((a, b) => {
        const startDiff = b.startDate.getTime() - a.startDate.getTime();
        if (startDiff !== 0) return startDiff;
        return b.createdAt.getTime() - a.createdAt.getTime();
      })[0];
    return current ? { ...current } : null;
  }

  async createProfessional(
    alumniId: string,
    data: Omit<
      AlumniProfessionalInformation,
      'id' | 'alumniId' | 'createdAt' | 'updatedAt'
    >,
  ): Promise<AlumniProfessionalInformation> {
    const now = new Date();
    const row: AlumniProfessionalInformation = {
      id: generateId(),
      alumniId,
      currentCompany: data.currentCompany ?? null,
      jobTitle: data.jobTitle ?? null,
      role: data.role ?? null,
      startDate: data.startDate,
      endDate: data.endDate ?? null,
      createdAt: now,
      updatedAt: now,
    };
    const list = this.professional.get(alumniId) ?? [];
    list.push(row);
    this.professional.set(alumniId, list);
    return { ...row };
  }

  async updateProfessional(
    id: string,
    patch: Partial<
      Omit<
        AlumniProfessionalInformation,
        'id' | 'alumniId' | 'createdAt' | 'updatedAt'
      >
    >,
  ): Promise<AlumniProfessionalInformation> {
    for (const [alumniId, list] of this.professional.entries()) {
      const index = list.findIndex((item) => item.id === id);
      if (index < 0) continue;
      const updated: AlumniProfessionalInformation = {
        ...list[index],
        ...patch,
        id: list[index].id,
        alumniId: list[index].alumniId,
        updatedAt: new Date(),
      };
      list[index] = updated;
      this.professional.set(alumniId, list);
      return { ...updated };
    }
    throw new Error(`Professional ${id} not found`);
  }

  async deleteProfessional(id: string): Promise<void> {
    for (const [alumniId, list] of this.professional.entries()) {
      const next = list.filter((item) => item.id !== id);
      if (next.length !== list.length) {
        this.professional.set(alumniId, next);
        return;
      }
    }
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
