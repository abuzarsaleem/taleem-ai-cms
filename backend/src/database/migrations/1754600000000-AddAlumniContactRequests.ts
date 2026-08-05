import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAlumniContactRequests1754600000000
  implements MigrationInterface
{
  name = 'AddAlumniContactRequests1754600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "contact_request_status" AS ENUM (
        'PENDING_ADMIN',
        'REJECTED_BY_ADMIN',
        'PENDING_ALUMNI',
        'REJECTED_BY_ALUMNI',
        'APPROVED'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "alumni_contact_requests" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "requester_alumni_id" uuid NOT NULL,
        "target_alumni_id" uuid NOT NULL,
        "request_reason" text NOT NULL,
        "status" "contact_request_status" NOT NULL DEFAULT 'PENDING_ADMIN',
        "admin_id" uuid,
        "rejection_reason" text,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_alumni_contact_requests" PRIMARY KEY ("id"),
        CONSTRAINT "FK_alumni_contact_requests_requester"
          FOREIGN KEY ("requester_alumni_id") REFERENCES "alumni"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_alumni_contact_requests_target"
          FOREIGN KEY ("target_alumni_id") REFERENCES "alumni"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_alumni_contact_requests_admin"
          FOREIGN KEY ("admin_id") REFERENCES "accounts"("id") ON DELETE SET NULL,
        CONSTRAINT "CHK_alumni_contact_requests_distinct"
          CHECK ("requester_alumni_id" <> "target_alumni_id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_alumni_contact_requests_requester"
        ON "alumni_contact_requests" ("requester_alumni_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_alumni_contact_requests_target"
        ON "alumni_contact_requests" ("target_alumni_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_alumni_contact_requests_status"
        ON "alumni_contact_requests" ("status")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "alumni_contact_requests" CASCADE`);
    await queryRunner.query(`DROP TYPE IF EXISTS "contact_request_status"`);
  }
}
