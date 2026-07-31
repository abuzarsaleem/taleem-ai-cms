import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitAlumniSchema1753977600000 implements MigrationInterface {
  name = 'InitAlumniSchema1753977600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    await queryRunner.query(`
      CREATE TYPE "user_role" AS ENUM ('alumni', 'admin', 'super_admin')
    `);
    await queryRunner.query(`
      CREATE TYPE "registration_status" AS ENUM ('PENDING', 'APPROVED', 'REJECTED')
    `);
    await queryRunner.query(`
      CREATE TYPE "alumni_status" AS ENUM ('ACTIVE', 'INACTIVE', 'REVOKED')
    `);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "email" character varying(255) NOT NULL,
        "password_hash" character varying(255) NOT NULL,
        "role" "user_role" NOT NULL DEFAULT 'alumni',
        "is_active" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_users_email" ON "users" ("email")
    `);

    await queryRunner.query(`
      CREATE TABLE "alumni_registration_request" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "full_name" character varying(150) NOT NULL,
        "email" character varying(255) NOT NULL,
        "phone_number" character varying(20),
        "status" "registration_status" NOT NULL DEFAULT 'PENDING',
        "submitted_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "reviewed_by" uuid,
        "reviewed_at" TIMESTAMPTZ,
        "rejection_reason" text,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "campus" character varying(100) NOT NULL,
        "degree" character varying(100) NOT NULL,
        "roll_number" character varying(50) NOT NULL,
        "graduation_year" integer NOT NULL,
        "cgpa" numeric(3,2),
        CONSTRAINT "PK_alumni_registration_request" PRIMARY KEY ("id"),
        CONSTRAINT "FK_alumni_registration_request_reviewed_by"
          FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_alumni_registration_request_email"
        ON "alumni_registration_request" ("email")
    `);

    await queryRunner.query(`
      CREATE TABLE "alumni" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid,
        "registration_request_id" uuid,
        "registration_ref" character varying(64) NOT NULL,
        "status" "alumni_status" NOT NULL DEFAULT 'ACTIVE',
        "full_name" character varying(150) NOT NULL,
        "email" character varying(255) NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "alumni_photo" character varying(500),
        "alumni_qr_code" character varying(500),
        CONSTRAINT "UQ_alumni_user_id" UNIQUE ("user_id"),
        CONSTRAINT "UQ_alumni_registration_request_id" UNIQUE ("registration_request_id"),
        CONSTRAINT "UQ_alumni_registration_ref" UNIQUE ("registration_ref"),
        CONSTRAINT "PK_alumni" PRIMARY KEY ("id"),
        CONSTRAINT "FK_alumni_user_id"
          FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_alumni_registration_request_id"
          FOREIGN KEY ("registration_request_id")
          REFERENCES "alumni_registration_request"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_alumni_registration_ref" ON "alumni" ("registration_ref")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_alumni_email" ON "alumni" ("email")
    `);

    await queryRunner.query(`
      CREATE TABLE "alumni_academic_information" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "alumni_id" uuid NOT NULL,
        "campus" character varying(100) NOT NULL,
        "degree" character varying(100) NOT NULL,
        "roll_number" character varying(50) NOT NULL,
        "graduation_year" integer NOT NULL,
        "cgpa" numeric(3,2),
        CONSTRAINT "UQ_alumni_academic_information_alumni_id" UNIQUE ("alumni_id"),
        CONSTRAINT "PK_alumni_academic_information" PRIMARY KEY ("id"),
        CONSTRAINT "FK_alumni_academic_information_alumni_id"
          FOREIGN KEY ("alumni_id") REFERENCES "alumni"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_alumni_academic_information_roll_number"
        ON "alumni_academic_information" ("roll_number")
    `);

    await queryRunner.query(`
      CREATE TABLE "alumni_professional_information" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "alumni_id" uuid NOT NULL,
        "current_company" character varying(150),
        "job_title" character varying(150),
        "industry" character varying(100),
        "years_of_experience" integer,
        "linkedin_url" character varying(255),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_alumni_professional_information_alumni_id" UNIQUE ("alumni_id"),
        CONSTRAINT "PK_alumni_professional_information" PRIMARY KEY ("id"),
        CONSTRAINT "FK_alumni_professional_information_alumni_id"
          FOREIGN KEY ("alumni_id") REFERENCES "alumni"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "alumni_personal_information" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "alumni_id" uuid NOT NULL,
        "date_of_birth" date,
        "gender" character varying(20),
        "phone_number" character varying(20),
        "address" character varying(255),
        "city" character varying(100),
        "country" character varying(100),
        "photo_url" character varying(500),
        CONSTRAINT "UQ_alumni_personal_information_alumni_id" UNIQUE ("alumni_id"),
        CONSTRAINT "PK_alumni_personal_information" PRIMARY KEY ("id"),
        CONSTRAINT "FK_alumni_personal_information_alumni_id"
          FOREIGN KEY ("alumni_id") REFERENCES "alumni"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "alumni_personal_information"`);
    await queryRunner.query(
      `DROP TABLE IF EXISTS "alumni_professional_information"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "alumni_academic_information"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "alumni"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "alumni_registration_request"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "alumni_status"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "registration_status"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "user_role"`);
  }
}
