import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVerificationTokenType1754800000000
  implements MigrationInterface
{
  name = 'AddVerificationTokenTypeAndPhotoUploads1754800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "verification_token_type" AS ENUM (
        'ACTIVATION',
        'PASSWORD_RESET',
        'EMAIL_VERIFY'
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "alumni_verification"
        ADD COLUMN "token_type" "verification_token_type" NOT NULL DEFAULT 'ACTIVATION'
    `);

    await queryRunner.query(`
      ALTER TABLE "alumni_verification"
        DROP CONSTRAINT IF EXISTS "UQ_alumni_verification_alumni_id"
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_alumni_verification_token_type_hash"
        ON "alumni_verification" ("token_type", "token_hash")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_alumni_verification_token_type_hash"
    `);

    await queryRunner.query(`
      DELETE FROM "alumni_verification" a
      USING "alumni_verification" b
      WHERE a.ctid < b.ctid
        AND a.alumni_id = b.alumni_id
    `);

    await queryRunner.query(`
      ALTER TABLE "alumni_verification"
        DROP COLUMN IF EXISTS "token_type"
    `);

    await queryRunner.query(`
      ALTER TABLE "alumni_verification"
        ADD CONSTRAINT "UQ_alumni_verification_alumni_id" UNIQUE ("alumni_id")
    `);

    await queryRunner.query(`DROP TYPE IF EXISTS "verification_token_type"`);
  }
}
