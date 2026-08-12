import { MigrationInterface, QueryRunner } from 'typeorm';

export class CareerProfileEventsUpdates1754830000000
  implements MigrationInterface
{
  name = 'CareerProfileEventsUpdates1754830000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "alumni"
      ADD COLUMN IF NOT EXISTS "linkedin_url" varchar(255) DEFAULT NULL
    `);

    await queryRunner.query(`
      UPDATE "alumni" a
      SET "linkedin_url" = p."linkedin_url"
      FROM (
        SELECT DISTINCT ON ("alumni_id")
          "alumni_id",
          "linkedin_url"
        FROM "alumni_professional_information"
        WHERE "linkedin_url" IS NOT NULL
        ORDER BY "alumni_id", "updated_at" DESC
      ) p
      WHERE a."id" = p."alumni_id"
        AND a."linkedin_url" IS NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "alumni_professional_information"
      ADD COLUMN IF NOT EXISTS "role" varchar(150) DEFAULT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "alumni_professional_information"
      DROP COLUMN IF EXISTS "linkedin_url"
    `);
    await queryRunner.query(`
      ALTER TABLE "alumni_professional_information"
      DROP COLUMN IF EXISTS "industry"
    `);
    await queryRunner.query(`
      ALTER TABLE "alumni_professional_information"
      DROP COLUMN IF EXISTS "years_of_experience"
    `);

    await queryRunner.query(`
      ALTER TABLE "alumni_academic_information"
      ADD COLUMN IF NOT EXISTS "registration_year" varchar(20) DEFAULT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "events"
      ADD COLUMN IF NOT EXISTS "is_draft" boolean NOT NULL DEFAULT false
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "events" DROP COLUMN IF EXISTS "is_draft"
    `);

    await queryRunner.query(`
      ALTER TABLE "alumni_academic_information"
      DROP COLUMN IF EXISTS "registration_year"
    `);

    await queryRunner.query(`
      ALTER TABLE "alumni_professional_information"
      ADD COLUMN IF NOT EXISTS "linkedin_url" varchar(255) DEFAULT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "alumni_professional_information"
      ADD COLUMN IF NOT EXISTS "industry" varchar(100) DEFAULT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "alumni_professional_information"
      ADD COLUMN IF NOT EXISTS "years_of_experience" int DEFAULT NULL
    `);

    await queryRunner.query(`
      UPDATE "alumni_professional_information" p
      SET "linkedin_url" = a."linkedin_url"
      FROM "alumni" a
      WHERE p."alumni_id" = a."id"
        AND a."linkedin_url" IS NOT NULL
        AND p."end_date" IS NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "alumni_professional_information"
      DROP COLUMN IF EXISTS "role"
    `);

    await queryRunner.query(`
      ALTER TABLE "alumni" DROP COLUMN IF EXISTS "linkedin_url"
    `);
  }
}
