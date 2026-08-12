import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PORTAL_MEDIA_TYPE_ENUM, PortalMediaType } from '../../common/enums';

@Entity({ name: 'portal_media' })
export class PortalMediaEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'media_type', type: 'varchar', length: 50 })
  mediaType: PortalMediaType;

  @Column({ name: 'storage_key', type: 'text', nullable: true })
  storageKey: string | null;

  @Column({ name: 'public_url', type: 'varchar', length: 500 })
  publicUrl: string;

  @Column({ name: 'mime_type', type: 'varchar', length: 100, nullable: true })
  mimeType: string | null;

  @Column({
    name: 'original_file_name',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  originalFileName: string | null;

  @Column({ name: 'meta', type: 'jsonb', nullable: true, default: null })
  meta: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}

