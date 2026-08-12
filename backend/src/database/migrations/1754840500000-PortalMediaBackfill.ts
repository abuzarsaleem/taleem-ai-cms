import { MigrationInterface, QueryRunner } from 'typeorm';

export class PortalMediaBackfill1754840500000
  implements MigrationInterface
{
  name = 'PortalMediaBackfill1754840500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Alumni photos
    await queryRunner.query(`
      INSERT INTO "portal_media"(
        "media_type",
        "storage_key",
        "public_url",
        "mime_type",
        "original_file_name",
        "meta",
        "created_at",
        "updated_at"
      )
      SELECT
        'ALUMNI_PHOTO'::varchar,
        NULL,
        a."photo_url",
        NULL,
        NULL,
        NULL,
        now(),
        now()
      FROM "alumni" a
      WHERE a."photo_url" IS NOT NULL
        AND a."photo_url" <> ''
        AND NOT EXISTS (
          SELECT 1
          FROM "portal_media" pm
          WHERE pm."media_type" = 'ALUMNI_PHOTO'
            AND pm."public_url" = a."photo_url"
        )
    `);

    await queryRunner.query(`
      UPDATE "alumni" a
      SET "photo_media_id" = pm."id"
      FROM "portal_media" pm
      WHERE pm."media_type" = 'ALUMNI_PHOTO'
        AND pm."public_url" = a."photo_url"
        AND a."photo_media_id" IS NULL
    `);

    // Registration photos
    await queryRunner.query(`
      INSERT INTO "portal_media"(
        "media_type",
        "storage_key",
        "public_url",
        "mime_type",
        "original_file_name",
        "meta",
        "created_at",
        "updated_at"
      )
      SELECT
        'REGISTRATION_PHOTO'::varchar,
        NULL,
        r."photo_url",
        NULL,
        NULL,
        NULL,
        now(),
        now()
      FROM "alumni_registration_request" r
      WHERE r."photo_url" IS NOT NULL
        AND r."photo_url" <> ''
        AND NOT EXISTS (
          SELECT 1
          FROM "portal_media" pm
          WHERE pm."media_type" = 'REGISTRATION_PHOTO'
            AND pm."public_url" = r."photo_url"
        )
    `);

    await queryRunner.query(`
      UPDATE "alumni_registration_request" r
      SET "photo_media_id" = pm."id"
      FROM "portal_media" pm
      WHERE pm."media_type" = 'REGISTRATION_PHOTO'
        AND pm."public_url" = r."photo_url"
        AND r."photo_media_id" IS NULL
    `);

    // Announcement images
    await queryRunner.query(`
      INSERT INTO "portal_media"(
        "media_type",
        "storage_key",
        "public_url",
        "mime_type",
        "original_file_name",
        "meta",
        "created_at",
        "updated_at"
      )
      SELECT
        'ANNOUNCEMENT_IMAGE'::varchar,
        NULL,
        a."image_url",
        NULL,
        NULL,
        NULL,
        now(),
        now()
      FROM "announcements" a
      WHERE a."image_url" IS NOT NULL
        AND a."image_url" <> ''
        AND NOT EXISTS (
          SELECT 1
          FROM "portal_media" pm
          WHERE pm."media_type" = 'ANNOUNCEMENT_IMAGE'
            AND pm."public_url" = a."image_url"
        )
    `);

    await queryRunner.query(`
      UPDATE "announcements" a
      SET "image_media_id" = pm."id"
      FROM "portal_media" pm
      WHERE pm."media_type" = 'ANNOUNCEMENT_IMAGE'
        AND pm."public_url" = a."image_url"
        AND a."image_media_id" IS NULL
    `);

    // Event images
    await queryRunner.query(`
      INSERT INTO "portal_media"(
        "media_type",
        "storage_key",
        "public_url",
        "mime_type",
        "original_file_name",
        "meta",
        "created_at",
        "updated_at"
      )
      SELECT
        'EVENT_IMAGE'::varchar,
        NULL,
        e."image_url",
        NULL,
        NULL,
        NULL,
        now(),
        now()
      FROM "events" e
      WHERE e."image_url" IS NOT NULL
        AND e."image_url" <> ''
        AND NOT EXISTS (
          SELECT 1
          FROM "portal_media" pm
          WHERE pm."media_type" = 'EVENT_IMAGE'
            AND pm."public_url" = e."image_url"
        )
    `);

    await queryRunner.query(`
      UPDATE "events" e
      SET "image_media_id" = pm."id"
      FROM "portal_media" pm
      WHERE pm."media_type" = 'EVENT_IMAGE'
        AND pm."public_url" = e."image_url"
        AND e."image_media_id" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`UPDATE "alumni" SET "photo_media_id" = NULL`);
    await queryRunner.query(
      `UPDATE "alumni_registration_request" SET "photo_media_id" = NULL`,
    );
    await queryRunner.query(
      `UPDATE "announcements" SET "image_media_id" = NULL`,
    );
    await queryRunner.query(`UPDATE "events" SET "image_media_id" = NULL`);
  }
}

