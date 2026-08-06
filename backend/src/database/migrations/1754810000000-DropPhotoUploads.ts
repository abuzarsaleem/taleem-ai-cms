import { MigrationInterface, QueryRunner } from 'typeorm';

/** Removes photo_uploads (URL is stored on alumni / registration only). */
export class DropPhotoUploads1754810000000 implements MigrationInterface {
  name = 'DropPhotoUploads1754810000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "photo_uploads" CASCADE`);
    await queryRunner.query(`DROP TYPE IF EXISTS "photo_upload_status"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "photo_upload_status" AS ENUM (
        'TEMP',
        'ATTACHED',
        'EXPIRED'
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "photo_uploads" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "storage_key" text NOT NULL,
        "public_url" text NOT NULL,
        "status" "photo_upload_status" NOT NULL DEFAULT 'TEMP',
        "uploaded_by_email" character varying(255),
        "expires_at" TIMESTAMPTZ NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_photo_uploads" PRIMARY KEY ("id")
      )
    `);
  }
}
