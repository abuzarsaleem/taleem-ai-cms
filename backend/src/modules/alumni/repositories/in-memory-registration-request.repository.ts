import { Injectable } from '@nestjs/common';
import { RegistrationStatus } from '../../../common/enums';
import {
  degreeProgramNameFromSeed,
  generateId,
} from '../../../common/utils';
import { AlumniRegistrationRequest } from '../entities/alumni-registration-request.entity';
import {
  CreateRegistrationRequestInput,
  IRegistrationRequestRepository,
} from '../interfaces/registration-request.repository.interface';
import {
  formatAlumniReference,
  parseAlumniReferenceSequence,
} from '../utils/alumni-reference';

@Injectable()
export class InMemoryRegistrationRequestRepository
  implements IRegistrationRequestRepository
{
  private readonly store = new Map<string, AlumniRegistrationRequest>();

  async create(
    input: CreateRegistrationRequestInput,
  ): Promise<AlumniRegistrationRequest> {
    const now = new Date();
    const entity: AlumniRegistrationRequest = {
      id: generateId(),
      fullName: input.fullName,
      email: input.email.toLowerCase(),
      phoneNumber: input.phoneNumber ?? null,
      status: RegistrationStatus.PENDING,
      whatsappNumber: input.whatsappNumber ?? null,
      cnicNationalId: input.cnicNationalId,
      degreeProgramId: input.degreeProgramId,
      degreeProgramName: degreeProgramNameFromSeed(input.degreeProgramId),
      registrationRollNumber: input.registrationRollNumber,
      graduationYear: input.graduationYear,
      referenceNumber: input.referenceNumber,
      photoMediaId: input.photoMediaId ?? null,
      reviewedBy: null,
      reviewedAt: null,
      rejectionReason: null,
      createdAt: now,
      updatedAt: now,
    };
    this.store.set(entity.id, entity);
    return { ...entity };
  }

  async nextReferenceNumber(year = new Date().getFullYear()): Promise<string> {
    let max = 0;
    for (const entity of this.store.values()) {
      const seq = parseAlumniReferenceSequence(entity.referenceNumber);
      if (
        seq !== null &&
        entity.referenceNumber.startsWith(`ALM-${year}-`) &&
        seq > max
      ) {
        max = seq;
      }
    }
    return formatAlumniReference(year, max + 1);
  }

  async findById(id: string): Promise<AlumniRegistrationRequest | null> {
    const entity = this.store.get(id);
    return entity ? { ...entity } : null;
  }

  async findByEmail(email: string): Promise<AlumniRegistrationRequest | null> {
    const normalized = email.toLowerCase();
    for (const entity of this.store.values()) {
      if (entity.email === normalized) return { ...entity };
    }
    return null;
  }

  async findByCnic(cnic: string): Promise<AlumniRegistrationRequest | null> {
    for (const entity of this.store.values()) {
      if (entity.cnicNationalId === cnic) return { ...entity };
    }
    return null;
  }

  async findAll(
    status?: RegistrationStatus,
  ): Promise<AlumniRegistrationRequest[]> {
    return [...this.store.values()]
      .filter((e) => (status ? e.status === status : true))
      .map((e) => ({ ...e }));
  }

  async update(
    id: string,
    patch: Partial<AlumniRegistrationRequest>,
  ): Promise<AlumniRegistrationRequest> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`Registration request ${id} not found`);
    const next = { ...existing, ...patch, id, updatedAt: new Date() };
    this.store.set(id, next);
    return { ...next };
  }
}
