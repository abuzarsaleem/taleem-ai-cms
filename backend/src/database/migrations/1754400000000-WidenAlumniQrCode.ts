import { MigrationInterface, QueryRunner } from 'typeorm';

export class WidenAlumniQrCode1754400000000 implements MigrationInterface {
  name = 'WidenAlumniQrCode1754400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "alumni"
      ALTER COLUMN "qr_code" TYPE text
      USING "qr_code"::text
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "alumni"
      ALTER COLUMN "qr_code" TYPE character varying(255)
      USING LEFT("qr_code", 255)
    `);
  }
}
