import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EVENT_TYPE_ENUM, EventType } from '../../common/enums';
import { AccountEntity } from './account.entity';
import { EventRsvpEntity } from './event-rsvp.entity';

@Entity({ name: 'events' })
export class EventEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({
    name: 'event_type',
    type: 'enum',
    enum: EventType,
    enumName: EVENT_TYPE_ENUM,
    default: EventType.OTHER,
  })
  eventType: EventType;

  @Index('IDX_events_event_date')
  @Column({ name: 'event_date', type: 'date' })
  eventDate: string;

  @Column({ name: 'start_time', type: 'time' })
  startTime: string;

  @Column({ name: 'end_time', type: 'time', nullable: true })
  endTime: string | null;

  @Column({ type: 'varchar', length: 255 })
  venue: string;

  @Column({ name: 'guest_speaker', type: 'varchar', length: 200, nullable: true })
  guestSpeaker: string | null;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  @ManyToOne(() => AccountEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'created_by' })
  creator: AccountEntity;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => EventRsvpEntity, (rsvp) => rsvp.event)
  rsvps: EventRsvpEntity[];
}
