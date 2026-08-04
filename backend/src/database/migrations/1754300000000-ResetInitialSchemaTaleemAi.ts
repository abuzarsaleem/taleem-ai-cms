import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Resets schema to Initial schema Taleem AI.xlsx and seeds reference data.
 */
export class ResetInitialSchemaTaleemAi1754300000000
  implements MigrationInterface
{
  name = 'ResetInitialSchemaTaleemAi1754300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    // Drop legacy schema (order matters for FKs)
    await queryRunner.query(
      `DROP TABLE IF EXISTS "alumni_personal_information" CASCADE`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS "alumni_professional_information" CASCADE`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS "alumni_academic_information" CASCADE`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "alumni" CASCADE`);
    await queryRunner.query(
      `DROP TABLE IF EXISTS "alumni_registration_request" CASCADE`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "users" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "alumni_verification" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "degree_programs" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "programs" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "degrees" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "campuses" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "accounts" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "roles" CASCADE`);
    await queryRunner.query(`DROP TYPE IF EXISTS "alumni_status"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "registration_status"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "user_role"`);

    await queryRunner.query(`
      CREATE TYPE "registration_status" AS ENUM ('PENDING', 'APPROVED', 'REJECTED')
    `);
    await queryRunner.query(`
      CREATE TYPE "alumni_status" AS ENUM ('ACTIVE', 'INACTIVE', 'REVOKED')
    `);

    await queryRunner.query(`
      CREATE TABLE "roles" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" character varying(50) NOT NULL,
        "description" character varying(255),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_roles_name" UNIQUE ("name"),
        CONSTRAINT "PK_roles" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "accounts" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "email" character varying(255) NOT NULL,
        "password_hash" character varying(255) NOT NULL,
        "role_id" uuid NOT NULL,
        "is_active" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_accounts_email" UNIQUE ("email"),
        CONSTRAINT "PK_accounts" PRIMARY KEY ("id"),
        CONSTRAINT "FK_accounts_role_id"
          FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_accounts_email" ON "accounts" ("email")`,
    );

    await queryRunner.query(`
      CREATE TABLE "campuses" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "code" character varying(30) NOT NULL,
        "name" character varying(150) NOT NULL,
        "city" character varying(50),
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_campuses_code" UNIQUE ("code"),
        CONSTRAINT "PK_campuses" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "degrees" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "code" character varying(20) NOT NULL,
        "name" character varying(100) NOT NULL,
        "level" smallint NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_degrees_code" UNIQUE ("code"),
        CONSTRAINT "PK_degrees" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "programs" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "code" character varying(30) NOT NULL,
        "name" character varying(150) NOT NULL,
        "department" character varying(100),
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_programs_code" UNIQUE ("code"),
        CONSTRAINT "PK_programs" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "degree_programs" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "degree_id" uuid NOT NULL,
        "program_id" uuid NOT NULL,
        "campus_id" uuid,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_degree_programs" PRIMARY KEY ("id"),
        CONSTRAINT "FK_degree_programs_degree_id"
          FOREIGN KEY ("degree_id") REFERENCES "degrees"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_degree_programs_program_id"
          FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_degree_programs_campus_id"
          FOREIGN KEY ("campus_id") REFERENCES "campuses"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "alumni_registration_request" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "full_name" character varying(150) NOT NULL,
        "email" character varying(255) NOT NULL,
        "phone_number" character varying(20),
        "status" "registration_status" NOT NULL DEFAULT 'PENDING',
        "whatsapp_number" character varying(20),
        "cnic_national_id" character varying(15) NOT NULL,
        "degree_program_id" uuid NOT NULL,
        "registration_roll_number" character varying(50) NOT NULL,
        "graduation_year" character varying(20) NOT NULL,
        "reviewed_by" uuid,
        "reviewed_at" TIMESTAMPTZ,
        "rejection_reason" text,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_alumni_registration_request_cnic" UNIQUE ("cnic_national_id"),
        CONSTRAINT "PK_alumni_registration_request" PRIMARY KEY ("id"),
        CONSTRAINT "FK_alumni_registration_request_degree_program_id"
          FOREIGN KEY ("degree_program_id") REFERENCES "degree_programs"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_alumni_registration_request_reviewed_by"
          FOREIGN KEY ("reviewed_by") REFERENCES "accounts"("id") ON DELETE SET NULL
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
        "status" "alumni_status" NOT NULL DEFAULT 'ACTIVE',
        "full_name" character varying(150) NOT NULL,
        "email" character varying(255) NOT NULL,
        "date_of_birth" date,
        "gender" character varying(20),
        "phone_number" character varying(20),
        "whatsapp_number" character varying(20),
        "cnic_national_id" character varying(15) NOT NULL,
        "address" character varying(255),
        "secondry_address" character varying(255),
        "city" character varying(100),
        "country" character varying(100),
        "qr_code" character varying(255) NOT NULL DEFAULT '',
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_alumni_user_id" UNIQUE ("user_id"),
        CONSTRAINT "UQ_alumni_registration_request_id" UNIQUE ("registration_request_id"),
        CONSTRAINT "UQ_alumni_cnic" UNIQUE ("cnic_national_id"),
        CONSTRAINT "PK_alumni" PRIMARY KEY ("id"),
        CONSTRAINT "FK_alumni_user_id"
          FOREIGN KEY ("user_id") REFERENCES "accounts"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_alumni_registration_request_id"
          FOREIGN KEY ("registration_request_id")
          REFERENCES "alumni_registration_request"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_alumni_email" ON "alumni" ("email")`,
    );

    await queryRunner.query(`
      CREATE TABLE "alumni_academic_information" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "alumni_id" uuid NOT NULL,
        "degree_program_id" uuid NOT NULL,
        "registration_roll_number" character varying(50) NOT NULL,
        "graduation_year" character varying(20) NOT NULL,
        "cgpa" numeric(3,2),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_alumni_academic_information" PRIMARY KEY ("id"),
        CONSTRAINT "FK_alumni_academic_information_alumni_id"
          FOREIGN KEY ("alumni_id") REFERENCES "alumni"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_alumni_academic_information_degree_program_id"
          FOREIGN KEY ("degree_program_id") REFERENCES "degree_programs"("id") ON DELETE RESTRICT
      )
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
        "start_date" date NOT NULL,
        "end_date" date,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_alumni_professional_information" PRIMARY KEY ("id"),
        CONSTRAINT "FK_alumni_professional_information_alumni_id"
          FOREIGN KEY ("alumni_id") REFERENCES "alumni"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "alumni_verification" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "alumni_id" uuid NOT NULL,
        "token_hash" character varying(255) NOT NULL,
        "expires_at" TIMESTAMPTZ NOT NULL,
        "used_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_alumni_verification_alumni_id" UNIQUE ("alumni_id"),
        CONSTRAINT "UQ_alumni_verification_token_hash" UNIQUE ("token_hash"),
        CONSTRAINT "PK_alumni_verification" PRIMARY KEY ("id"),
        CONSTRAINT "FK_alumni_verification_alumni_id"
          FOREIGN KEY ("alumni_id") REFERENCES "alumni"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_alumni_verification_token_hash"
        ON "alumni_verification" ("token_hash")
    `);

    // ---- Seed reference data ----
    await queryRunner.query(`
      INSERT INTO "roles" ("id", "name", "description") VALUES
      ('11111111-1111-4111-8111-111111111101', 'alumni', 'Standard alumnus account'),
      ('11111111-1111-4111-8111-111111111102', 'admin', 'Manages alumni records and registration reviews'),
      ('11111111-1111-4111-8111-111111111103', 'super_admin', 'Full administrative access'),
      ('11111111-1111-4111-8111-111111111104', 'student', 'Student account')
    `);

    await queryRunner.query(`
      INSERT INTO "campuses" ("id", "code", "name", "city", "is_active") VALUES
      ('22222222-2222-4222-8222-222222222201', 'ISB_CHAK_SHAHZAD', 'Chak Shahzad Campus, Islamabad', 'Islamabad', true),
      ('22222222-2222-4222-8222-222222222202', 'ISB_MAIN', 'Main Campus, Islamabad', 'Islamabad', true),
      ('22222222-2222-4222-8222-222222222203', 'LHR_CAMPUS', 'Lahore Campus', 'Lahore', true),
      ('22222222-2222-4222-8222-222222222204', 'KHI_CAMPUS', 'Karachi Campus', 'Karachi', true)
    `);

    await queryRunner.query(`
      INSERT INTO "degrees" ("id", "code", "name", "level", "is_active") VALUES
      ('33333333-3333-4333-8333-333333333301', 'BS', 'Bachelor of Science', 1, true),
      ('33333333-3333-4333-8333-333333333302', 'MS', 'Master of Science', 2, true),
      ('33333333-3333-4333-8333-333333333303', 'MBA', 'Master of Business Administration', 2, true),
      ('33333333-3333-4333-8333-333333333304', 'PHD', 'Doctor of Philosophy', 3, true),
      ('33333333-3333-4333-8333-333333333305', 'BBA', 'Bachelor of Business Administration', 1, true)
    `);

    await queryRunner.query(`
      INSERT INTO "programs" ("id", "code", "name", "department", "is_active") VALUES
      ('44444444-4444-4444-8444-444444444401', 'CS', 'Computer Science', 'Faculty of Computing', true),
      ('44444444-4444-4444-8444-444444444402', 'SE', 'Software Engineering', 'Faculty of Computing', true),
      ('44444444-4444-4444-8444-444444444403', 'AI', 'Artificial Intelligence', 'Faculty of Computing', true),
      ('44444444-4444-4444-8444-444444444404', 'EE', 'Electrical Engineering', 'Faculty of Engineering', true),
      ('44444444-4444-4444-8444-444444444405', 'BBA', 'Business Administration', 'Faculty of Management Sciences', true),
      ('44444444-4444-4444-8444-444444444406', 'DS', 'Data Science', 'Faculty of Computing', true)
    `);

    // Degree programs primarily for Chak Shahzad, plus a few all-campus offerings
    await queryRunner.query(`
      INSERT INTO "degree_programs" ("id", "degree_id", "program_id", "campus_id", "is_active") VALUES
      ('55555555-5555-4555-8555-555555555501', '33333333-3333-4333-8333-333333333301', '44444444-4444-4444-8444-444444444401', '22222222-2222-4222-8222-222222222201', true),
      ('55555555-5555-4555-8555-555555555502', '33333333-3333-4333-8333-333333333301', '44444444-4444-4444-8444-444444444402', '22222222-2222-4222-8222-222222222201', true),
      ('55555555-5555-4555-8555-555555555503', '33333333-3333-4333-8333-333333333301', '44444444-4444-4444-8444-444444444403', '22222222-2222-4222-8222-222222222201', true),
      ('55555555-5555-4555-8555-555555555504', '33333333-3333-4333-8333-333333333301', '44444444-4444-4444-8444-444444444406', '22222222-2222-4222-8222-222222222201', true),
      ('55555555-5555-4555-8555-555555555505', '33333333-3333-4333-8333-333333333302', '44444444-4444-4444-8444-444444444401', '22222222-2222-4222-8222-222222222201', true),
      ('55555555-5555-4555-8555-555555555506', '33333333-3333-4333-8333-333333333302', '44444444-4444-4444-8444-444444444403', '22222222-2222-4222-8222-222222222201', true),
      ('55555555-5555-4555-8555-555555555507', '33333333-3333-4333-8333-333333333305', '44444444-4444-4444-8444-444444444405', '22222222-2222-4222-8222-222222222201', true),
      ('55555555-5555-4555-8555-555555555508', '33333333-3333-4333-8333-333333333303', '44444444-4444-4444-8444-444444444405', '22222222-2222-4222-8222-222222222201', true),
      ('55555555-5555-4555-8555-555555555509', '33333333-3333-4333-8333-333333333301', '44444444-4444-4444-8444-444444444404', '22222222-2222-4222-8222-222222222201', true),
      ('55555555-5555-4555-8555-555555555510', '33333333-3333-4333-8333-333333333304', '44444444-4444-4444-8444-444444444401', '22222222-2222-4222-8222-222222222201', true),
      ('55555555-5555-4555-8555-555555555511', '33333333-3333-4333-8333-333333333301', '44444444-4444-4444-8444-444444444401', '22222222-2222-4222-8222-222222222202', true),
      ('55555555-5555-4555-8555-555555555512', '33333333-3333-4333-8333-333333333301', '44444444-4444-4444-8444-444444444401', NULL, true)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "alumni_verification" CASCADE`);
    await queryRunner.query(
      `DROP TABLE IF EXISTS "alumni_professional_information" CASCADE`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS "alumni_academic_information" CASCADE`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "alumni" CASCADE`);
    await queryRunner.query(
      `DROP TABLE IF EXISTS "alumni_registration_request" CASCADE`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "degree_programs" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "programs" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "degrees" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "campuses" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "accounts" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "roles" CASCADE`);
    await queryRunner.query(`DROP TYPE IF EXISTS "alumni_status"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "registration_status"`);
  }
}
