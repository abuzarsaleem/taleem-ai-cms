import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAlumniNotifications1754900000000 implements MigrationInterface {
  name = 'AddAlumniNotifications1754900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "alumni_notifications" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "alumni_id" uuid NOT NULL,
        "type" varchar(32) NOT NULL,
        "title" varchar(255) NOT NULL,
        "reference_id" uuid NULL,
        "is_read" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "FK_alumni_notifications_alumni_id"
          FOREIGN KEY ("alumni_id") REFERENCES "alumni"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_alumni_notifications_alumni_id"
        ON "alumni_notifications" ("alumni_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_alumni_notifications_is_read"
        ON "alumni_notifications" ("is_read")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_alumni_notifications_created_at"
        ON "alumni_notifications" ("created_at" DESC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TABLE IF EXISTS "alumni_notifications" CASCADE`,
    );
  }
}
