import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPhotoUrlToRegistrationAndAlumni1754500000000
  implements MigrationInterface
{
  name = 'AddPhotoUrlToRegistrationAndAlumni1754500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "alumni_registration_request"
      ADD COLUMN IF NOT EXISTS "photo_url" text
    `);
    await queryRunner.query(`
      ALTER TABLE "alumni"
      ADD COLUMN IF NOT EXISTS "photo_url" text
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "alumni" DROP COLUMN IF EXISTS "photo_url"
    `);
    await queryRunner.query(`
      ALTER TABLE "alumni_registration_request" DROP COLUMN IF EXISTS "photo_url"
    `);
  }
}
