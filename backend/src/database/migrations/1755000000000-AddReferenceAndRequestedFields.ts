import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * - alumni_registration_request.reference_number (ALM-YYYY-#######)
 * - alumni.public_alumni_code (copied from reference on approval)
 * - alumni_contact_requests.requested_fields (email|mobile|whatsapp[])
 */
export class AddReferenceAndRequestedFields1755000000000
  implements MigrationInterface
{
  name = 'AddReferenceAndRequestedFields1755000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "alumni_registration_request"
        ADD COLUMN IF NOT EXISTS "reference_number" varchar(32)
    `);

    await queryRunner.query(`
      ALTER TABLE "alumni"
        ADD COLUMN IF NOT EXISTS "public_alumni_code" varchar(32)
    `);

    await queryRunner.query(`
      ALTER TABLE "alumni_contact_requests"
        ADD COLUMN IF NOT EXISTS "requested_fields" text[] NOT NULL DEFAULT '{}'
    `);

    // Backfill registration reference numbers for existing rows
    await queryRunner.query(`
      WITH numbered AS (
        SELECT
          id,
          'ALM-' || TO_CHAR(COALESCE(created_at, NOW()), 'YYYY') || '-' ||
            LPAD(
              ROW_NUMBER() OVER (
                PARTITION BY TO_CHAR(COALESCE(created_at, NOW()), 'YYYY')
                ORDER BY created_at ASC NULLS LAST, id ASC
              )::text,
              7,
              '0'
            ) AS ref
        FROM "alumni_registration_request"
        WHERE "reference_number" IS NULL
      )
      UPDATE "alumni_registration_request" r
      SET "reference_number" = n.ref
      FROM numbered n
      WHERE r.id = n.id
    `);

    // Copy onto alumni where linked to a registration request
    await queryRunner.query(`
      UPDATE "alumni" a
      SET "public_alumni_code" = r."reference_number"
      FROM "alumni_registration_request" r
      WHERE a.registration_request_id = r.id
        AND a."public_alumni_code" IS NULL
        AND r."reference_number" IS NOT NULL
    `);

    // Remaining alumni without a code
    await queryRunner.query(`
      WITH numbered AS (
        SELECT
          id,
          'ALM-' || TO_CHAR(COALESCE(created_at, NOW()), 'YYYY') || '-' ||
            LPAD(
              (
                COALESCE(
                  (
                    SELECT MAX(SUBSTRING(reference_number FROM 10)::int)
                    FROM alumni_registration_request
                    WHERE reference_number ~ ('^ALM-' || TO_CHAR(COALESCE(a.created_at, NOW()), 'YYYY') || '-[0-9]{7}$')
                  ),
                  0
                )
                + ROW_NUMBER() OVER (
                    PARTITION BY TO_CHAR(COALESCE(created_at, NOW()), 'YYYY')
                    ORDER BY created_at ASC NULLS LAST, id ASC
                  )
              )::text,
              7,
              '0'
            ) AS code
        FROM "alumni" a
        WHERE a."public_alumni_code" IS NULL
      )
      UPDATE "alumni" a
      SET "public_alumni_code" = n.code
      FROM numbered n
      WHERE a.id = n.id
    `);

    await queryRunner.query(`
      ALTER TABLE "alumni_registration_request"
        ALTER COLUMN "reference_number" SET NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "alumni"
        ALTER COLUMN "public_alumni_code" SET NOT NULL
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_alumni_registration_request_reference_number"
        ON "alumni_registration_request" ("reference_number")
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_alumni_public_alumni_code"
        ON "alumni" ("public_alumni_code")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "UQ_alumni_public_alumni_code"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "UQ_alumni_registration_request_reference_number"`,
    );
    await queryRunner.query(`
      ALTER TABLE "alumni_contact_requests"
        DROP COLUMN IF EXISTS "requested_fields"
    `);
    await queryRunner.query(`
      ALTER TABLE "alumni"
        DROP COLUMN IF EXISTS "public_alumni_code"
    `);
    await queryRunner.query(`
      ALTER TABLE "alumni_registration_request"
        DROP COLUMN IF EXISTS "reference_number"
    `);
  }
}
