import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEventLifecycleStatus1755100000000
  implements MigrationInterface
{
  name = 'AddEventLifecycleStatus1755100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "event_lifecycle_status_enum" AS ENUM ('SCHEDULED', 'POSTPONED');
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$
    `);

    await queryRunner.query(`
      ALTER TABLE "events"
      ADD COLUMN IF NOT EXISTS "status" "event_lifecycle_status_enum"
        NOT NULL DEFAULT 'SCHEDULED'
    `);

    await queryRunner.query(`
      ALTER TABLE "events"
      ADD COLUMN IF NOT EXISTS "status_reason" text NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "events" DROP COLUMN IF EXISTS "status_reason"
    `);
    await queryRunner.query(`
      ALTER TABLE "events" DROP COLUMN IF EXISTS "status"
    `);
    await queryRunner.query(`
      DROP TYPE IF EXISTS "event_lifecycle_status_enum"
    `);
  }
}
