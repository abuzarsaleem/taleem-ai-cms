/**
 * Postgres enum: event_lifecycle_status_enum
 * Draft visibility remains `is_draft`; this covers published lifecycle.
 */
export enum EventLifecycleStatus {
  SCHEDULED = 'SCHEDULED',
  POSTPONED = 'POSTPONED',
}

export const EVENT_LIFECYCLE_STATUS_ENUM = 'event_lifecycle_status_enum';
