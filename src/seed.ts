import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

const groupsSqlInsert = fs.readFileSync(path.join(__dirname, '..', 'seedGroups.sql')).toString();
const userGroupsSqlInsert = fs
  .readFileSync(path.join(__dirname, '..', 'seedUserGroups.sql'))
  .toString();
const usersSqlInsert = fs.readFileSync(path.join(__dirname, '..', 'seedUsers.sql')).toString();
const salesSqlInsert = fs.readFileSync(path.join(__dirname, '..', 'seedSales.sql')).toString();

const pgclient = new Client({
  host: process.env.DB_HOST || 'db',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'user',
  password: process.env.DB_PASSWORD || 'pass',
  database: process.env.DB_NAME || 'actifai',
});

const createUsersTableQuery = `
    CREATE TABLE IF NOT EXISTS "users" (
      "id" SERIAL,
      "name" VARCHAR(50) NOT NULL,
      "role" VARCHAR(50) NOT NULL,
      PRIMARY KEY ("id")
    );`;

const createGroupsTableQuery = `
    CREATE TABLE IF NOT EXISTS "groups" (
      "id" SERIAL,
      "name" VARCHAR(50) NOT NULL,
      PRIMARY KEY ("id")
    );`;

const createUserGroupsTableQuery = `
    CREATE TABLE IF NOT EXISTS "user_groups" (
      "user_id" SERIAL,
      "group_id" SERIAL,
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(group_id) REFERENCES groups(id)
    );`;

const createSalesTableQuery = `
    CREATE TABLE IF NOT EXISTS "sales" (
      "id" SERIAL,
      "user_id" SERIAL,
      "amount" INTEGER,
      "date" DATE,
      FOREIGN KEY(user_id) REFERENCES users(id),
      PRIMARY KEY ("id")
    );`;

/**
 * Initialize database tables and seed with test data.
 * Skips seeding if the users table already exists.
 */
export async function seedDatabase(): Promise<void> {
  await pgclient.connect();

  const usersTableExistsResult = await pgclient.query(
    "SELECT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users');"
  );
  const usersTableExists = usersTableExistsResult.rows[0].exists;

  if (usersTableExists) {
    console.log('Skipping seeders.');
    await pgclient.end();
    return;
  }

  console.log('Seeding database...');

  await pgclient.query(createUsersTableQuery);
  console.log('Created users table.');

  await pgclient.query(usersSqlInsert);
  console.log('Seeded users table.');

  await pgclient.query(createGroupsTableQuery);
  console.log('Created groups table.');

  await pgclient.query(groupsSqlInsert);
  console.log('Seeded groups table.');

  await pgclient.query(createUserGroupsTableQuery);
  console.log('Created user_groups table.');

  await pgclient.query(userGroupsSqlInsert);
  console.log('Seeded user_group table.');

  await pgclient.query(createSalesTableQuery);
  console.log('Created sales table.');

  await pgclient.query(salesSqlInsert);
  console.log('Seeded sales table.');

  await pgclient.end();
}
