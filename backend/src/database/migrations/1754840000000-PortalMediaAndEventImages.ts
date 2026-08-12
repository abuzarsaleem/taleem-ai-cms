import { MigrationInterface, QueryRunner } from 'typeorm';

export class PortalMediaAndEventImages1754840000000
  implements MigrationInterface
{
  name = 'PortalMediaAndEventImages1754840000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "portal_media" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "media_type" varchar(50) NOT NULL,
        "storage_key" text NULL,
        "public_url" varchar(500) NOT NULL,
        "mime_type" varchar(100) NULL,
        "original_file_name" varchar(255) NULL,
        "meta" jsonb NULL DEFAULT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_portal_media" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "alumni"
      ADD COLUMN IF NOT EXISTS "photo_media_id" uuid NULL
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_alumni_photo_media'
        ) THEN
          ALTER TABLE "alumni"
          ADD CONSTRAINT "FK_alumni_photo_media"
          FOREIGN KEY ("photo_media_id") REFERENCES "portal_media"("id");
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      ALTER TABLE "alumni_registration_request"
      ADD COLUMN IF NOT EXISTS "photo_media_id" uuid NULL
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_alumni_registration_request_photo_media'
        ) THEN
          ALTER TABLE "alumni_registration_request"
          ADD CONSTRAINT "FK_alumni_registration_request_photo_media"
          FOREIGN KEY ("photo_media_id") REFERENCES "portal_media"("id");
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      ALTER TABLE "announcements"
      ADD COLUMN IF NOT EXISTS "image_media_id" uuid NULL
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_announcements_image_media'
        ) THEN
          ALTER TABLE "announcements"
          ADD CONSTRAINT "FK_announcements_image_media"
          FOREIGN KEY ("image_media_id") REFERENCES "portal_media"("id");
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      ALTER TABLE "events"
      ADD COLUMN IF NOT EXISTS "image_media_id" uuid NULL
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_events_image_media'
        ) THEN
          ALTER TABLE "events"
          ADD CONSTRAINT "FK_events_image_media"
          FOREIGN KEY ("image_media_id") REFERENCES "portal_media"("id");
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      ALTER TABLE "events"
      ADD COLUMN IF NOT EXISTS "image_url" varchar(255) NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "events" DROP COLUMN IF EXISTS "image_url"
    `);

    await queryRunner.query(`
      ALTER TABLE "events" DROP CONSTRAINT IF EXISTS "FK_events_image_media"
    `);
    await queryRunner.query(`
      ALTER TABLE "events" DROP COLUMN IF EXISTS "image_media_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "announcements" DROP CONSTRAINT IF EXISTS "FK_announcements_image_media"
    `);
    await queryRunner.query(`
      ALTER TABLE "announcements" DROP COLUMN IF EXISTS "image_media_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "alumni_registration_request" DROP CONSTRAINT IF EXISTS "FK_alumni_registration_request_photo_media"
    `);
    await queryRunner.query(`
      ALTER TABLE "alumni_registration_request" DROP COLUMN IF EXISTS "photo_media_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "alumni" DROP CONSTRAINT IF EXISTS "FK_alumni_photo_media"
    `);
    await queryRunner.query(`
      ALTER TABLE "alumni" DROP COLUMN IF EXISTS "photo_media_id"
    `);

    await queryRunner.query(`DROP TABLE IF EXISTS "portal_media" CASCADE`);
  }
}

