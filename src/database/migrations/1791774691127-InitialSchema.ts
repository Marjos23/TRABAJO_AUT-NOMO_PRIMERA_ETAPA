import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1791774691127 implements MigrationInterface {
  name = 'InitialSchema1791774691127';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('librarian', 'reader')`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" SERIAL NOT NULL, "name" character varying(150) NOT NULL, "email" character varying(150) NOT NULL, "password" character varying NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'reader', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "fines" ("id" SERIAL NOT NULL, "loan_id" integer NOT NULL, "amount" numeric(10,2) NOT NULL, "reason" character varying(255) NOT NULL, "paid" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_b706344bc8943ab7a88ed5d312e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."loans_status_enum" AS ENUM('active', 'returned', 'overdue')`,
    );
    await queryRunner.query(
      `CREATE TABLE "loans" ("id" SERIAL NOT NULL, "book_id" integer NOT NULL, "user_id" integer NOT NULL, "loan_date" TIMESTAMP WITH TIME ZONE NOT NULL, "due_date" TIMESTAMP WITH TIME ZONE NOT NULL, "return_date" TIMESTAMP WITH TIME ZONE, "status" "public"."loans_status_enum" NOT NULL DEFAULT 'active', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5c6942c1e13e4de135c5203ee61" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "books" ("id" SERIAL NOT NULL, "title" character varying(200) NOT NULL, "author" character varying(150) NOT NULL, "isbn" character varying(20) NOT NULL, "category" character varying(100) NOT NULL, "year" integer NOT NULL, "copies" integer NOT NULL DEFAULT '1', CONSTRAINT "UQ_54337dc30d9bb2c3fadebc69094" UNIQUE ("isbn"), CONSTRAINT "PK_f3f2f25a099d24e12545b70b022" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "fines" ADD CONSTRAINT "FK_59c37165a057c5475c272aaafaa" FOREIGN KEY ("loan_id") REFERENCES "loans"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "loans" ADD CONSTRAINT "FK_09b09d3d1b8e33c0f8dd4cafa48" FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "loans" ADD CONSTRAINT "FK_d135791c39e46e13ca4c2725fbb" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "loans" DROP CONSTRAINT "FK_d135791c39e46e13ca4c2725fbb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "loans" DROP CONSTRAINT "FK_09b09d3d1b8e33c0f8dd4cafa48"`,
    );
    await queryRunner.query(
      `ALTER TABLE "fines" DROP CONSTRAINT "FK_59c37165a057c5475c272aaafaa"`,
    );
    await queryRunner.query(`DROP TABLE "books"`);
    await queryRunner.query(`DROP TABLE "loans"`);
    await queryRunner.query(`DROP TYPE "public"."loans_status_enum"`);
    await queryRunner.query(`DROP TABLE "fines"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
  }
}
