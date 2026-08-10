import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEventTargetCriteria1754820000000 implements MigrationInterface {
  name = 'AddEventTargetCriteria1754820000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "events"
      ADD COLUMN IF NOT EXISTS "target_criteria" jsonb DEFAULT NULL
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_events_target_criteria"
      ON "events" USING GIN ("target_criteria")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_events_target_criteria"
    `);
    await queryRunner.query(`
      ALTER TABLE "events" DROP COLUMN IF EXISTS "target_criteria"
    `);
  }
}
