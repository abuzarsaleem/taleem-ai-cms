import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEventsAnnouncements1754700000000
  implements MigrationInterface
{
  name = 'AddEventsAnnouncements1754700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "event_type_enum" AS ENUM (
        'REUNION',
        'NETWORKING_DINNER',
        'GUEST_LECTURE',
        'OTHER'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "rsvp_status_enum" AS ENUM (
        'GOING',
        'NOT_GOING',
        'MAYBE'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "announcement_category_enum" AS ENUM (
        'ANNOUNCEMENT',
        'ALUMNI_SPOTLIGHT',
        'CAMPUS_UPDATE'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "events" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "title" character varying(200) NOT NULL,
        "description" text,
        "event_type" "event_type_enum" NOT NULL DEFAULT 'OTHER',
        "event_date" date NOT NULL,
        "start_time" time NOT NULL,
        "end_time" time,
        "venue" character varying(255) NOT NULL,
        "guest_speaker" character varying(200),
        "created_by" uuid NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_events" PRIMARY KEY ("id"),
        CONSTRAINT "FK_events_created_by"
          FOREIGN KEY ("created_by") REFERENCES "accounts"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "event_rsvps" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "event_id" uuid NOT NULL,
        "alumni_id" uuid NOT NULL,
        "status" "rsvp_status_enum" NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_event_rsvps" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_event_rsvps_event_alumni" UNIQUE ("event_id", "alumni_id"),
        CONSTRAINT "FK_event_rsvps_event_id"
          FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_event_rsvps_alumni_id"
          FOREIGN KEY ("alumni_id") REFERENCES "alumni"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "announcements" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "title" character varying(200) NOT NULL,
        "content" text NOT NULL,
        "category" "announcement_category_enum" NOT NULL DEFAULT 'ANNOUNCEMENT',
        "featured_alumni_id" uuid,
        "image_url" character varying(255),
        "is_published" boolean NOT NULL DEFAULT true,
        "published_at" TIMESTAMPTZ DEFAULT now(),
        "created_by" uuid NOT NULL,
        CONSTRAINT "PK_announcements" PRIMARY KEY ("id"),
        CONSTRAINT "FK_announcements_featured_alumni_id"
          FOREIGN KEY ("featured_alumni_id") REFERENCES "alumni"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_announcements_created_by"
          FOREIGN KEY ("created_by") REFERENCES "accounts"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_events_event_date" ON "events" ("event_date")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_event_rsvps_event_id" ON "event_rsvps" ("event_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_event_rsvps_alumni_id" ON "event_rsvps" ("alumni_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_announcements_published"
        ON "announcements" ("is_published", "published_at" DESC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "announcements" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "event_rsvps" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "events" CASCADE`);
    await queryRunner.query(`DROP TYPE IF EXISTS "announcement_category_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "rsvp_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "event_type_enum"`);
  }
}
