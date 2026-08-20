import { Injectable } from '@nestjs/common';
import { ContactRequestStatus } from '../../../common/enums';
import { generateId } from '../../../common/utils';
import {
  AlumniContactRequest,
  CreateContactRequestInput,
  IContactRequestRepository,
} from '../interfaces/contact-request.repository.interface';

@Injectable()
export class InMemoryContactRequestRepository
  implements IContactRequestRepository
{
  private readonly store = new Map<string, AlumniContactRequest>();

  async create(
    input: CreateContactRequestInput,
  ): Promise<AlumniContactRequest> {
    const now = new Date();
    const entity: AlumniContactRequest = {
      id: generateId(),
      requesterAlumniId: input.requesterAlumniId,
      targetAlumniId: input.targetAlumniId,
      requestReason: input.requestReason.trim(),
      requestedFields: [...input.requestedFields],
      status: ContactRequestStatus.PENDING_ADMIN,
      adminId: null,
      rejectionReason: null,
      createdAt: now,
      updatedAt: now,
    };
    this.store.set(entity.id, entity);
    return { ...entity };
  }

  async findById(id: string): Promise<AlumniContactRequest | null> {
    const row = this.store.get(id);
    return row ? { ...row } : null;
  }

  async findSentByRequester(
    requesterAlumniId: string,
  ): Promise<AlumniContactRequest[]> {
    return Array.from(this.store.values())
      .filter((r) => r.requesterAlumniId === requesterAlumniId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((r) => ({ ...r }));
  }

  async findReceivedByTarget(
    targetAlumniId: string,
    status?: ContactRequestStatus,
  ): Promise<AlumniContactRequest[]> {
    return Array.from(this.store.values())
      .filter(
        (r) =>
          r.targetAlumniId === targetAlumniId &&
          (!status || r.status === status),
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((r) => ({ ...r }));
  }

  async findAll(status?: ContactRequestStatus): Promise<AlumniContactRequest[]> {
    return Array.from(this.store.values())
      .filter((r) => !status || r.status === status)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((r) => ({ ...r }));
  }

  async findApprovedPair(
    requesterAlumniId: string,
    targetAlumniId: string,
  ): Promise<AlumniContactRequest | null> {
    for (const row of this.store.values()) {
      if (
        row.requesterAlumniId === requesterAlumniId &&
        row.targetAlumniId === targetAlumniId &&
        row.status === ContactRequestStatus.APPROVED
      ) {
        return { ...row };
      }
    }
    return null;
  }

  async findActivePair(
    requesterAlumniId: string,
    targetAlumniId: string,
  ): Promise<AlumniContactRequest | null> {
    const active = [
      ContactRequestStatus.PENDING_ADMIN,
      ContactRequestStatus.APPROVED,
    ];
    for (const row of this.store.values()) {
      if (
        row.requesterAlumniId === requesterAlumniId &&
        row.targetAlumniId === targetAlumniId &&
        active.includes(row.status)
      ) {
        return { ...row };
      }
    }
    return null;
  }

  async update(
    id: string,
    patch: Partial<AlumniContactRequest>,
  ): Promise<AlumniContactRequest> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`Contact request ${id} not found`);
    const updated = {
      ...existing,
      ...patch,
      id: existing.id,
      updatedAt: new Date(),
    };
    this.store.set(id, updated);
    return { ...updated };
  }
}
