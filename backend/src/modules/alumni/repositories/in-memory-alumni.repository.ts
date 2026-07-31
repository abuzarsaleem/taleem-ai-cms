import { Injectable } from '@nestjs/common';
import { AlumniStatus } from '../../../common/enums';
import { generateId } from '../../../common/utils';
import {
  Alumni,
  AlumniAcademicInformation,
  AlumniPersonalInformation,
  AlumniProfessionalInformation,
  AlumniProfile,
} from '../entities/alumni.entity';
import {
  CreateAlumniInput,
  IAlumniRepository,
} from '../interfaces/alumni.repository.interface';

@Injectable()
export class InMemoryAlumniRepository implements IAlumniRepository {
  private readonly alumni = new Map<string, Alumni>();
  private readonly academic = new Map<string, AlumniAcademicInformation>();
  private readonly professional = new Map<
    string,
    AlumniProfessionalInformation
  >();
  private readonly personal = new Map<string, AlumniPersonalInformation>();

  async create(input: CreateAlumniInput): Promise<AlumniProfile> {
    const now = new Date();
    const alumni: Alumni = {
      id: generateId(),
      userId: input.userId ?? null,
      registrationRequestId: input.registrationRequestId,
      registrationRef: input.registrationRef,
      status: AlumniStatus.ACTIVE,
      fullName: input.fullName,
      email: input.email.toLowerCase(),
      createdAt: now,
      updatedAt: now,
      alumniPhoto: input.alumniPhoto ?? null,
      alumniQrCode: null,
    };

    const academic: AlumniAcademicInformation = {
      id: generateId(),
      alumniId: alumni.id,
      campus: input.academic.campus,
      degree: input.academic.degree,
      rollNumber: input.academic.rollNumber,
      graduationYear: input.academic.graduationYear,
      cgpa: input.academic.cgpa,
    };

    const personal: AlumniPersonalInformation = {
      id: generateId(),
      alumniId: alumni.id,
      dateOfBirth: null,
      gender: null,
      phoneNumber: input.phoneNumber ?? null,
      address: null,
      city: null,
      country: null,
      photoUrl: input.alumniPhoto ?? null,
    };

    this.alumni.set(alumni.id, alumni);
    this.academic.set(alumni.id, academic);
    this.personal.set(alumni.id, personal);

    return this.toProfile(alumni.id)!;
  }

  async findById(id: string): Promise<AlumniProfile | null> {
    return this.toProfile(id);
  }

  async findByEmail(email: string): Promise<AlumniProfile | null> {
    const normalized = email.toLowerCase();
    for (const alumni of this.alumni.values()) {
      if (alumni.email === normalized) {
        return this.toProfile(alumni.id);
      }
    }
    return null;
  }

  async findByUserId(userId: string): Promise<AlumniProfile | null> {
    for (const alumni of this.alumni.values()) {
      if (alumni.userId === userId) {
        return this.toProfile(alumni.id);
      }
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

  async findByRegistrationRef(ref: string): Promise<AlumniProfile | null> {
    for (const alumni of this.alumni.values()) {
      if (alumni.registrationRef === ref) {
        return this.toProfile(alumni.id);
      }
    }
    return null;
  }

  async findAll(): Promise<AlumniProfile[]> {
    return Array.from(this.alumni.keys())
      .map((id) => this.toProfile(id))
      .filter((profile): profile is AlumniProfile => profile !== null);
  }

  async updateAlumni(id: string, patch: Partial<Alumni>): Promise<Alumni> {
    const existing = this.alumni.get(id);
    if (!existing) {
      throw new Error(`Alumni ${id} not found`);
    }
    const updated: Alumni = {
      ...existing,
      ...patch,
      id: existing.id,
      updatedAt: new Date(),
    };
    this.alumni.set(id, updated);
    return { ...updated };
  }

  async updateAcademic(
    alumniId: string,
    patch: Partial<AlumniAcademicInformation>,
  ): Promise<AlumniAcademicInformation> {
    const existing = this.academic.get(alumniId);
    if (!existing) {
      throw new Error(`Academic info for alumni ${alumniId} not found`);
    }
    const updated = { ...existing, ...patch, id: existing.id, alumniId };
    this.academic.set(alumniId, updated);
    return { ...updated };
  }

  async upsertProfessional(
    alumniId: string,
    data: Partial<AlumniProfessionalInformation>,
  ): Promise<AlumniProfessionalInformation> {
    const existing = this.professional.get(alumniId);
    const updated: AlumniProfessionalInformation = {
      id: existing?.id ?? generateId(),
      alumniId,
      currentCompany: data.currentCompany ?? existing?.currentCompany ?? null,
      jobTitle: data.jobTitle ?? existing?.jobTitle ?? null,
      industry: data.industry ?? existing?.industry ?? null,
      yearsOfExperience:
        data.yearsOfExperience ?? existing?.yearsOfExperience ?? null,
      linkedinUrl: data.linkedinUrl ?? existing?.linkedinUrl ?? null,
      updatedAt: new Date(),
    };
    this.professional.set(alumniId, updated);
    return { ...updated };
  }

  async upsertPersonal(
    alumniId: string,
    data: Partial<AlumniPersonalInformation>,
  ): Promise<AlumniPersonalInformation> {
    const existing = this.personal.get(alumniId);
    const updated: AlumniPersonalInformation = {
      id: existing?.id ?? generateId(),
      alumniId,
      dateOfBirth: data.dateOfBirth ?? existing?.dateOfBirth ?? null,
      gender: data.gender ?? existing?.gender ?? null,
      phoneNumber: data.phoneNumber ?? existing?.phoneNumber ?? null,
      address: data.address ?? existing?.address ?? null,
      city: data.city ?? existing?.city ?? null,
      country: data.country ?? existing?.country ?? null,
      photoUrl: data.photoUrl ?? existing?.photoUrl ?? null,
    };
    this.personal.set(alumniId, updated);
    return { ...updated };
  }

  private toProfile(id: string): AlumniProfile | null {
    const alumni = this.alumni.get(id);
    const academic = this.academic.get(id);
    if (!alumni || !academic) {
      return null;
    }

    return {
      alumni: { ...alumni },
      academic: { ...academic },
      professional: this.professional.get(id)
        ? { ...this.professional.get(id)! }
        : null,
      personal: this.personal.get(id) ? { ...this.personal.get(id)! } : null,
    };
  }
}
