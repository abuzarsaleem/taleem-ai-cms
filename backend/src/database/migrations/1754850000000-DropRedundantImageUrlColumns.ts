import { MigrationInterface, QueryRunner } from 'typeorm';

/** Image URLs now live only on portal_media; owning tables keep FK columns. */
export class DropRedundantImageUrlColumns1754850000000
  implements MigrationInterface
{
  name = 'DropRedundantImageUrlColumns1754850000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "alumni" DROP COLUMN IF EXISTS "photo_url"
    `);
    await queryRunner.query(`
      ALTER TABLE "alumni_registration_request" DROP COLUMN IF EXISTS "photo_url"
    `);
    await queryRunner.query(`
      ALTER TABLE "announcements" DROP COLUMN IF EXISTS "image_url"
    `);
    await queryRunner.query(`
      ALTER TABLE "events" DROP COLUMN IF EXISTS "image_url"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "alumni" ADD COLUMN IF NOT EXISTS "photo_url" text NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "alumni_registration_request" ADD COLUMN IF NOT EXISTS "photo_url" text NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "announcements" ADD COLUMN IF NOT EXISTS "image_url" varchar(255) NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "image_url" varchar(255) NULL
    `);

    await queryRunner.query(`
      UPDATE "alumni" a
      SET "photo_url" = pm."public_url"
      FROM "portal_media" pm
      WHERE a."photo_media_id" = pm."id"
    `);
    await queryRunner.query(`
      UPDATE "alumni_registration_request" r
      SET "photo_url" = pm."public_url"
      FROM "portal_media" pm
      WHERE r."photo_media_id" = pm."id"
    `);
    await queryRunner.query(`
      UPDATE "announcements" a
      SET "image_url" = pm."public_url"
      FROM "portal_media" pm
      WHERE a."image_media_id" = pm."id"
    `);
    await queryRunner.query(`
      UPDATE "events" e
      SET "image_url" = pm."public_url"
      FROM "portal_media" pm
      WHERE e."image_media_id" = pm."id"
    `);
  }
}
