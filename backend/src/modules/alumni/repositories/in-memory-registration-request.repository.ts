import { Injectable } from '@nestjs/common';
import { RegistrationStatus } from '../../../common/enums';
import { generateId } from '../../../common/utils';
import { AlumniRegistrationRequest } from '../entities/alumni-registration-request.entity';
import {
  CreateRegistrationRequestInput,
  IRegistrationRequestRepository,
} from '../interfaces/registration-request.repository.interface';

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
      submittedAt: now,
      reviewedBy: null,
      reviewedAt: null,
      rejectionReason: null,
      createdAt: now,
      campus: input.campus,
      degree: input.degree,
      rollNumber: input.rollNumber,
      graduationYear: input.graduationYear,
      cgpa: input.cgpa ?? null,
    };

    this.store.set(entity.id, entity);
    return { ...entity };
  }

  async findById(id: string): Promise<AlumniRegistrationRequest | null> {
    const entity = this.store.get(id);
    return entity ? { ...entity } : null;
  }

  async findByEmail(email: string): Promise<AlumniRegistrationRequest | null> {
    const normalized = email.toLowerCase();
    for (const entity of this.store.values()) {
      if (entity.email === normalized) {
        return { ...entity };
      }
    }
    return null;
  }

  async findAll(
    status?: RegistrationStatus,
  ): Promise<AlumniRegistrationRequest[]> {
    const items = Array.from(this.store.values());
    const filtered = status
      ? items.filter((item) => item.status === status)
      : items;
    return filtered.map((item) => ({ ...item }));
  }

  async update(
    id: string,
    patch: Partial<AlumniRegistrationRequest>,
  ): Promise<AlumniRegistrationRequest> {
    const existing = this.store.get(id);
    if (!existing) {
      throw new Error(`Registration request ${id} not found`);
    }
    const updated = { ...existing, ...patch, id: existing.id };
    this.store.set(id, updated);
    return { ...updated };
  }
}
